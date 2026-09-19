import type { TranslationStrings } from '../types';

const docsync: TranslationStrings = {
  'docsync.title': 'Синхронизация документов',
  'docsync.noProviders': 'Нет доступных провайдеров документов',
  'docsync.noProvidersHint':
    'Администратор экземпляра включает их в разделе «Администрирование → Дополнения → Документы».',
  'docsync.addProvider': 'Подключить провайдера',
  'docsync.test': 'Проверить подключение',
  'docsync.connect.optional': 'Необязательно',
  'docsync.connected': 'Подключено',
  'docsync.chooseFolder': 'Выбрать папку',
  'docsync.noFolders': 'В этом экземпляре пока ничего не найдено.',
  'docsync.newFolderPlaceholder': 'Название новой папки',
  'docsync.syncNow': 'Синхронизировать сейчас',
  'docsync.unlink': 'Отключить',
  'docsync.confirmUnlink': 'Документы останутся и в TREK, и в хранилище. Исчезнет только связь между ними.',
  'docsync.syncEnabled': 'Синхронизировать автоматически',
  'docsync.deletePolicy': 'Когда документ удалён',
  'docsync.deleteUnlink': 'Оставить обе копии',
  'docsync.deleteTrash': 'Переместить в корзину',
  'docsync.conflictPolicy': 'Когда изменились обе стороны',
  'docsync.onConflict.manual': 'Спросить меня',
  'docsync.onConflict.trek_wins': 'Оставить копию TREK',
  'docsync.onConflict.provider_wins': 'Оставить копию хранилища',
  'docsync.webhookHint':
    'Вставьте этот URL у своего провайдера, чтобы изменения приходили сразу. Без него TREK проверяет по таймеру.',

  // Поля формы подключения. Ключи повторяют столбец `label` в
  // document_provider_fields, где хранится суффикс ключа, а не текст.
  'docsync.providerUrl': 'Адрес',
  'docsync.providerApiToken': 'Токен API',
  'docsync.providerApiKey': 'Ключ API',
  'docsync.providerAppPassword': 'Пароль приложения',
  'docsync.providerAppToken': 'Токен приложения',
  'docsync.providerUsername': 'Имя пользователя',
  'docsync.providerPassword': 'Пароль',
  'docsync.providerOrganization': 'ID организации',
  'docsync.providerBasePath': 'Базовая папка',
  'docsync.providerOTP': 'Код двухфакторной проверки',
  'docsync.allowInsecureTls': 'Принимать самоподписанный сертификат',

  'docsync.hintPaperlessToken':
    'Создайте его в Paperless в разделе «Мой профиль». Он даёт все права этой учётной записи.',
  'docsync.hintPapraKey':
    'Создайте его в Papra в разделе «Ключи API». Ключи Papra всегда охватывают все организации, в которых вы состоите.',
  'docsync.hintPapraOrg': 'Идентификатор org_… из адресной строки Papra.',
  'docsync.hintNextcloudLogin': 'Ваше имя для входа в Nextcloud, а не адрес электронной почты.',
  'docsync.hintNextcloudAppPassword':
    '«Настройки → Безопасность → Создать новый пароль приложения». Никогда не пароль от учётной записи.',
  'docsync.hintOpenCloudToken': 'Создаётся в OpenCloud в разделе токенов приложений.',
  'docsync.hintBasePath': 'Где TREK ищет папки поездок. По умолчанию /TREK.',
  'docsync.hintSynologyUrl': 'Укажите порт, например https://nas.example.com:5001',
  'docsync.hintSynologyUser': 'Лучше отдельная учётная запись DSM с доступом только к этой общей папке.',
  'docsync.hintSynologyOtp': 'Нужен только один раз, если в учётной записи включена двухфакторная аутентификация.',

  'docsync.linkState.never': 'Ещё не синхронизировано',
  'docsync.linkState.ok': 'Всё синхронизировано',
  'docsync.linkState.partial': 'Синхронизировано частично',
  'docsync.linkState.failed': 'Не удалось',
  'docsync.linkState.needs_reauth': 'Войдите снова',
  'docsync.linkState.scope_lost': 'Папка исчезла',
  'docsync.linkState.orphaned': 'Владелец покинул поездку',

  'docsync.state.pending': 'Ожидает',
  'docsync.state.synced': 'Синхронизировано',
  'docsync.state.conflict': 'Конфликт',
  'docsync.state.rejected_type': 'Тип не разрешён',
  'docsync.state.too_large': 'Слишком большой',
  'docsync.state.error': 'Ошибка',
  'docsync.state.remote_missing': 'Отсутствует у провайдера',
  'docsync.state.local_deleted': 'Удалено в TREK',
  'docsync.state.scope_drift': 'Перемещено за пределы папки',

  'docsync.conflict.resolve': "Решить: {count}",

  'docsync.conflict.title': 'Изменились обе копии',
  'docsync.conflict.keepTrek': 'Оставить версию TREK',
  'docsync.conflict.keepProvider': 'Оставить версию провайдера',
  'docsync.conflict.keepBoth': 'Оставить обе',

  // Причины сбоя передаются кодами, а не текстом провайдера: он отвечает
  // по-английски или HTML-страницей входа от прокси, и ни тому, ни другому здесь не место.
  'docsync.error.unreachable': 'Не удалось связаться с провайдером.',
  'docsync.error.tls_untrusted':
    'Сертификат отклонён. Разрешите самоподписанные сертификаты, если доверяете этому экземпляру.',
  'docsync.error.unauthorized': 'Учётные данные отклонены.',
  'docsync.error.forbidden': 'Этой учётной записи такое не разрешено.',
  'docsync.error.not_found': 'У провайдера не найдено.',
  'docsync.error.scope_missing': 'Подключённой папки больше не существует.',
  'docsync.error.rate_limited': 'Провайдер ограничивает частоту запросов. TREK повторит попытку позже.',
  'docsync.error.too_large': 'Файл больше, чем принимает провайдер.',
  'docsync.error.unsupported_type': 'Провайдер не принимает файлы этого типа.',
  'docsync.error.quota_exceeded': 'У провайдера закончилось место.',
  'docsync.error.conflict': 'Документ изменился с обеих сторон.',
  'docsync.error.checksum_mismatch': 'Данные пришли повреждёнными.',
  'docsync.error.provider_error': 'Провайдер сообщил об ошибке.',
  'docsync.error.timeout': 'Провайдер слишком долго отвечал.',
  'docsync.error.ssrf_blocked': 'Этот адрес не разрешён.',
  'docsync.error.mass_delete_guard':
    'Сразу исчезло большинство документов, поэтому ничего не изменено. Проверьте, что папка всё ещё подключена.',
  'docsync.error.unknown': 'Что-то пошло не так.',

  // ── Диалог ─────────────────────────────────────────────────────────────────
  'docsync.sidebar.connected': 'Эта поездка',
  'docsync.addAnother': 'Добавить ещё',
  'docsync.syncing': 'Синхронизация',
  'docsync.card.pickFolder': 'Подключено, выберите папку',

  'docsync.empty.title': 'Пока ничего не подключено',
  'docsync.empty.hintOwner':
    'Выберите хранилище слева. TREK держит собственную копию всего, поэтому ничего не пропадёт, если оно исчезнет.',
  'docsync.empty.hintMember': 'Это настраивает владелец поездки. Документы в любом случае остаются в TREK.',

  // Как каждый продукт раскладывает файлы. Показывается до подключения, потому
  // что именно об этом спросит следующий экран.
  'docsync.model.paperless': 'Хранит по меткам',
  'docsync.model.papra': 'Хранит по меткам внутри организации',
  'docsync.model.nextcloud': 'Хранит в папке',
  'docsync.model.opencloud': 'Хранит в пространстве',
  'docsync.model.synologydrive': 'Хранит в папке на NAS',

  // ── Полоса потока ──────────────────────────────────────────────────────────
  'docsync.flow.trek': 'TREK',
  'docsync.flow.toProvider': 'В хранилище',
  'docsync.flow.toTrek': 'Из хранилища',
  'docsync.flow.documents': 'документов',
  'docsync.flow.summary.both': 'Документы идут в обе стороны.',
  'docsync.flow.summary.pull': 'Документы только приходят.',
  'docsync.flow.summary.push': 'Документы только уходят.',
  'docsync.flow.summaryEditable.both': 'Идут в обе стороны. Нажмите полосу, чтобы её остановить.',
  'docsync.flow.summaryEditable.pull': 'Только приходят. Нажмите вторую полосу, чтобы и отправлять.',
  'docsync.flow.summaryEditable.push': 'Только уходят. Нажмите вторую полосу, чтобы и получать.',

  // ── Одна связь ─────────────────────────────────────────────────────────────
  'docsync.binding.settings': 'Настройки',
  'docsync.binding.folder': 'Папка',
  'docsync.binding.lastRun': 'Последний запуск',
  'docsync.binding.autoOff': 'Приостановлено',
  'docsync.binding.neverRun': 'ещё не запускалась',
  'docsync.binding.deleteHint': 'Что происходит с копией на другой стороне.',
  'docsync.binding.conflictHint': 'Какая копия останется, если документ изменили в обоих местах.',
  'docsync.binding.autoHint': 'Проверять изменения в фоне.',
  'docsync.binding.webhookTitle': 'Мгновенные обновления',
  'docsync.binding.copy': 'Копировать',
  'docsync.binding.copied': 'Скопировано',

  // ── Подключение ────────────────────────────────────────────────────────────
  'docsync.connect.submit': 'Подключить',
  'docsync.connect.testing': 'Пробуем связаться',
  'docsync.connect.okAs': 'Связь есть, вход выполнен как {account}',
  'docsync.connect.insecureHint': 'Для экземпляра в вашей сети с самоподписанным сертификатом.',
  'docsync.connect.about.paperless': 'TREK держит эту поездку под собственной меткой и не трогает остальной архив.',
  'docsync.connect.about.papra':
    'Выберите организацию, к которой относится поездка. Внутри неё TREK держит её под собственной меткой.',
  'docsync.connect.about.nextcloud':
    'Используйте пароль приложения, а не пароль учётной записи: он переживает двухфакторную проверку, и его можно отозвать отдельно.',
  'docsync.connect.about.opencloud':
    'Для этой поездки TREK получает собственное пространство, отдельно от всего остального.',
  'docsync.connect.about.synologydrive':
    'Лучше учётная запись DSM, у которой есть доступ только к общей папке этой поездки.',

  // ── Выбор контейнера ───────────────────────────────────────────────────────
  'docsync.scope.title': 'Где эта поездка будет лежать в {provider}?',
  'docsync.scope.intro': 'Синхронизируется только то, что лежит здесь. Всё остальное в хранилище в TREK не попадёт.',
  'docsync.scope.createTitle': 'Создать с нуля',
  'docsync.scope.createAction': 'Создать',
  'docsync.scope.pickTitle': 'Или выбрать из существующих',
  'docsync.scope.search': 'Поиск',
  'docsync.scope.noMatch': 'Ничего не найдено.',

  // ── То, что должен решить человек ──────────────────────────────────────────
  'docsync.issues.title': 'Требует внимания',
  'docsync.issues.conflict': 'Изменено с обеих сторон. Выберите, какую копию оставить.',
  'docsync.issues.remote_missing': 'Пропало из хранилища. Копия в TREK на месте.',
  'docsync.issues.rejected_type': 'Такой тип файла здесь не разрешён.',
  'docsync.issues.too_large': 'Больше допустимого размера.',
  'docsync.issues.error': 'Передача не прошла.',

  'docsync.error.unknown_provider': 'Этот провайдер недоступен в этом экземпляре.',
  'docsync.error.provider_disabled': 'Приостановлено: администратор отключил этого провайдера. Синхронизация возобновится, как только его снова включат.',
};

export default docsync;
