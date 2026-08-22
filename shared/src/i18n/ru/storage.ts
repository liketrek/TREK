import type { TranslationStrings } from '../types';

const storage: TranslationStrings = {
  'storage.field.root': 'Корневой каталог',
  'storage.help.root': 'Абсолютный путь на сервере, где этот бэкенд хранит свои объекты.',
  'storage.field.endpoint': 'URL конечной точки',
  'storage.help.endpoint':
    'Базовый URL S3-совместимого сервиса, например https://s3.example.com или http://127.0.0.1:9000.',
  'storage.field.bucket': 'Bucket',
  'storage.field.accessKeyId': 'ID ключа доступа',
  'storage.field.secretAccessKey': 'Секретный ключ доступа',
  'storage.field.region': 'Регион',
  'storage.help.region': 'Оставьте значение по умолчанию, если провайдер не требует конкретный регион.',
  'storage.field.keyPrefix': 'Префикс ключа',
  'storage.help.keyPrefix': 'Необязательный префикс, добавляемый к каждому ключу объекта, например trek/prod.',
  'storage.field.retries': 'Повторные попытки',
  'storage.field.timeoutMs': 'Тайм-аут (мс)',
  'storage.field.primary': 'Основной бэкенд',
  'storage.field.replicas': 'Реплики',
  'storage.title': 'Хранилище',
  'storage.description':
    'Где TREK хранит загруженные файлы, фото и резервные копии. Ничего не изменится, пока вы не сохраните.',
  'storage.loading': 'Загрузка…',
  'storage.saved': 'Конфигурация хранилища сохранена',
  'storage.save': 'Сохранить изменения',
  'storage.unsaved': 'Несохранённые изменения',
  'storage.saveConflict':
    'Конфигурация хранилища изменилась с момента загрузки, поэтому ваши изменения не сохранены. Отмените их и загрузите сохранённые настройки заново, чтобы начать сначала.',
  'storage.discardAndReload': 'Отменить мои изменения и перезагрузить',
  'storage.configError.banner': 'Не удалось загрузить сохранённые настройки хранилища — сохранение заменит их: {error}',
  'storage.backends.title': 'Бэкенды',
  'storage.backends.add': 'Добавить бэкенд',
  'storage.backends.usedBy': 'Используется в: {categories}',
  'storage.backends.unused': 'Не назначен ни одной категории',
  'storage.backends.envReadOnly': 'Определено переменной окружения — только для чтения',
  'storage.source.built-in': 'Встроенный',
  'storage.source.env': 'Окружение',
  'storage.source.settings': 'Настройки',
  'storage.type.local': 'Локальный',
  'storage.type.s3': 'S3',
  'storage.type.mirror': 'Зеркало',
  'storage.actions.test': 'Проверить',
  'storage.actions.edit': 'Изменить',
  'storage.actions.remove': 'Удалить',
  'storage.test.running': 'Проверка…',
  'storage.test.ok': 'Соединение установлено',
  'storage.test.failed': 'Проверка не удалась',
  'storage.remove.title': 'Удалить бэкенд',
  'storage.remove.body':
    'Удалить {name} из конфигурации? Сервер отклонит сохранение, если от него всё ещё что-то зависит.',
  'storage.remove.stillAssigned': 'Всё ещё назначен: {categories}',
  'storage.form.addTitle': 'Добавить бэкенд',
  'storage.form.editTitle': 'Изменить бэкенд',
  'storage.form.name': 'Название',
  'storage.form.type': 'Тип',
  'storage.form.apply': 'Применить',
  'storage.form.cancel': 'Отмена',
  'storage.form.duplicateName': 'Бэкенд с названием {name} уже существует',
  'storage.categories.title': 'Категории',
  'storage.categories.default': 'по умолчанию',
  'storage.categories.reassignWarning':
    'Существующие объекты не перемещаются: новые объекты идут во вновь назначенный бэкенд, старые остаются на месте.',
  'storage.category.files': 'Документы поездки',
  'storage.category.journey': 'Фото путешествия',
  'storage.category.covers': 'Обложки',
  'storage.category.avatars': 'Фото профиля',
  'storage.category.places': 'Изображения мест',
  'storage.category.photos-google': 'Кэш фото Google',
  'storage.category.photos-trek': 'Кэш фото TREK',
  'storage.category.backups': 'Резервные копии',

  // What each category stores — rendered under the label in the category map.
  'storage.categoryDesc.files':
    'Файловые вложения, загруженные в поездки — билеты, PDF, подтверждения бронирования и файлы, которыми поделились в чате поездки.',
  'storage.categoryDesc.journey': 'Фото и миниатюры, прикреплённые к записям путешествия.',
  'storage.categoryDesc.covers': 'Обложки поездок и коллекций, включая обложки, полученные с Unsplash.',
  'storage.categoryDesc.avatars': 'Фото профиля учётных записей пользователей.',
  'storage.categoryDesc.places':
    'Изображения, прикреплённые к местам и местам коллекций — загруженные или импортированные.',
  'storage.categoryDesc.photos-google':
    'Кэшированные копии фото Google Places — их можно получить заново, потеря безопасна.',
  'storage.categoryDesc.photos-trek':
    'Кэшированные фото из фотосервиса TREK, используемого функцией Фото (Memories) — их можно получить заново, потеря безопасна.',
  'storage.categoryDesc.backups':
    'Архивы резервных копий сервера, созданные панелью резервного копирования или по расписанию.',
  'storage.health.title': 'Состояние',
  'storage.health.allClear': 'Сбоев реплик не зафиксировано.',
  'storage.health.seedFile':
    'Присутствует файл-заготовка storage-config.json, но он игнорируется — строки конфигурации уже существуют. Управляйте хранилищем здесь.',
  'storage.health.failureLine': '{op} для {key} на {backend} не удалось: {error}',

  // Replicas-on-primary mirror UX (2026-08-20 spec)
  'storage.mirror.targets': 'Цели зеркала',
  'storage.mirror.targetsHelp': 'Каждая запись в этот бэкенд также копируется в каждую выбранную цель.',
  'storage.mirror.latencyNote':
    'Реплики записываются последовательно, одна за другой, при каждой загрузке — медленная или недоступная цель замедляет каждую загрузку каждой категории на этом бэкенде.',
  'storage.mirror.mirroredTo': 'Зеркалируется в: {targets}',
  'storage.mirror.replicaOf': 'Реплика с: {primaries}',
  'storage.mirror.cacheWarning':
    'Не рекомендуется: эта категория содержит контент, который можно получить заново — его репликация обычно бесполезна.',
  'storage.mirror.degenerate.duplicate-mirror':
    'Второе зеркало оборачивает {primary} — панель управляет только первым; удалите это, чтобы управлять зеркалированием от {primary}.',
  'storage.mirror.degenerate.env-primary':
    'Оборачивает бэкенд, определённый переменной окружения — здесь не редактируется.',
  'storage.mirror.degenerate.missing-primary': 'Ссылается на бэкенд, которого больше не существует.',
  'storage.remove.usedAsReplicaBy': 'Используется как реплика в: {primaries}',

  // Backfill + usage (backfill/stats/notifications spec)
  'storage.sync.now': 'Синхронизировать сейчас',
  'storage.sync.running': 'Синхронизация… {done}/{total}',
  'storage.sync.counts': '{copied} скопировано · {skipped} пропущено · {failed} не удалось',
  'storage.sync.cancel': 'Отменить синхронизацию',
  'storage.sync.done': 'Синхронизация завершена: {copied} скопировано, {deleted} удалено, {failed} не удалось',
  'storage.sync.cancelled': 'Синхронизация отменена',
  'storage.sync.error': 'Ошибка синхронизации: {error}',
  'storage.sync.prompt': 'Существующие объекты ещё не реплицированы — синхронизировать сейчас?',
  'storage.sync.dismiss': 'Скрыть',
  'storage.usage.line': '{objects} объектов · {size}',
  'storage.usage.computed': 'Использование рассчитано {age}',
  'storage.usage.never': 'Использование ещё не рассчитано',
  'storage.usage.refresh': 'Обновить',
  'storage.usage.compute': 'Рассчитать сейчас',
  'storage.usage.legacyNote': 'включает старую библиотеку фото',

  // Category migration (copy → flip → delta sweep)
  'storage.migrate.promptTitle': 'Перенести существующие объекты на новый бэкенд?',
  'storage.migrate.promptLine': '{category}: {objects} объектов ({size}) из {from} в {to}',
  'storage.migrate.promptLineUnknown':
    '{category}: неизвестный размер (использование ещё не просканировано) из {from} в {to}',
  'storage.migrate.move': 'Перенести существующие объекты',
  'storage.migrate.routeOnly': 'Перенаправить только новые записи',
  'storage.migrate.running': 'Перенос {category}… {done}/{total}',
  'storage.migrate.done': 'Перенос завершён: {copied} скопировано, {skipped} пропущено',
  'storage.migrate.doneFailures': '{failed} не удалось — эти объекты не были скопированы на новый бэкенд',
  'storage.migrate.failed': 'Перенос не удался: {error} — категория не была переключена',
  'storage.migrate.cancelled': 'Перенос отменён — ничего не было переключено',
  'storage.migrate.reclaimable': '{objects} объектов ({size}) остаются на {from} — освободите вручную',
  'storage.migrate.cancel': 'Отменить перенос',
  'storage.migrate.promptCancel': 'Отмена',
  'storage.migrate.queued': 'В очереди: {categories}',
  'storage.migrate.queueDropped': 'Не удалось запустить следующий перенос — оставшаяся очередь очищена: {categories}',
};
export default storage;
