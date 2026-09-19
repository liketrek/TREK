import type { TranslationStrings } from '../types';

const docsync: TranslationStrings = {
  'docsync.title': 'مزامنة المستندات',
  'docsync.noProviders': 'لا يوجد مزوّدو مستندات متاحون',
  'docsync.noProvidersHint': 'يفعّلها مسؤول الخادم من الإدارة ← الإضافات ← المستندات.',
  'docsync.addProvider': 'ربط مزوّد',
  'docsync.test': 'اختبار الاتصال',
  'docsync.connect.optional': 'اختياري',
  'docsync.connected': 'متصل',
  'docsync.chooseFolder': 'اختيار مجلد',
  'docsync.noFolders': 'لم يُعثر على شيء على هذا الخادم بعد.',
  'docsync.newFolderPlaceholder': 'اسم المجلد الجديد',
  'docsync.syncNow': 'زامن الآن',
  'docsync.unlink': 'قطع الاتصال',
  'docsync.confirmUnlink': 'تبقى المستندات في TREK وفي المخزن. يزول الاقتران بينهما فقط.',
  'docsync.syncEnabled': 'المزامنة تلقائياً',
  'docsync.deletePolicy': 'عند حذف مستند',
  'docsync.deleteUnlink': 'الإبقاء على النسختين',
  'docsync.deleteTrash': 'النقل إلى سلة المهملات',
  'docsync.conflictPolicy': 'عند تغيير الجانبين',
  'docsync.onConflict.manual': 'اسألني',
  'docsync.onConflict.trek_wins': 'الاحتفاظ بنسخة TREK',
  'docsync.onConflict.provider_wins': 'الاحتفاظ بنسخة المخزن',
  'docsync.webhookHint': 'الصق هذا الـ URL في المزوّد لتصل التغييرات فوراً. بدونه يتحقق TREK على فترات زمنية.',

  // حقول نموذج الاتصال. تطابق المفاتيح عمود `label` في
  // document_provider_fields، وهو يخزّن لاحقة مفتاح لا نصاً.
  'docsync.providerUrl': 'العنوان',
  'docsync.providerApiToken': 'رمز API',
  'docsync.providerApiKey': 'مفتاح API',
  'docsync.providerAppPassword': 'كلمة مرور التطبيق',
  'docsync.providerAppToken': 'رمز التطبيق',
  'docsync.providerUsername': 'اسم المستخدم',
  'docsync.providerPassword': 'كلمة المرور',
  'docsync.providerOrganization': 'معرّف المؤسسة',
  'docsync.providerBasePath': 'المجلد الأساسي',
  'docsync.providerOTP': 'رمز المصادقة الثنائية',
  'docsync.allowInsecureTls': 'قبول شهادة موقّعة ذاتياً',

  'docsync.hintPaperlessToken': 'أنشئه في Paperless ضمن ملفي الشخصي. يحمل كامل صلاحيات ذلك الحساب.',
  'docsync.hintPapraKey': 'أنشئه في Papra ضمن مفاتيح API. تصل مفاتيح Papra دائماً إلى كل مؤسسة تنتمي إليها.',
  'docsync.hintPapraOrg': 'المعرّف org_… من شريط العنوان في Papra.',
  'docsync.hintNextcloudLogin': 'اسم الدخول إلى Nextcloud، لا بريدك الإلكتروني.',
  'docsync.hintNextcloudAppPassword':
    'الإعدادات ← الأمان ← إنشاء كلمة مرور تطبيق جديدة. لا تستخدم كلمة مرور حسابك أبداً.',
  'docsync.hintOpenCloudToken': 'يُنشأ في OpenCloud ضمن رموز التطبيقات.',
  'docsync.hintBasePath': 'المكان الذي يبحث فيه TREK عن مجلدات الرحلات. الافتراضي /TREK.',
  'docsync.hintSynologyUrl': 'أدرج المنفذ، مثال https://nas.example.com:5001',
  'docsync.hintSynologyUser': 'يُفضّل حساب DSM مخصّص لا يصل إلا إلى هذا المجلد المشترك.',
  'docsync.hintSynologyOtp': 'مطلوب مرة واحدة فقط، إذا كان الحساب يستخدم المصادقة الثنائية.',

  'docsync.linkState.never': 'لم تجرِ المزامنة بعد',
  'docsync.linkState.ok': 'متزامن',
  'docsync.linkState.partial': 'متزامن جزئياً',
  'docsync.linkState.failed': 'فشل',
  'docsync.linkState.needs_reauth': 'سجّل الدخول مجدداً',
  'docsync.linkState.scope_lost': 'المجلد لم يعد موجوداً',
  'docsync.linkState.orphaned': 'غادر المالك الرحلة',

  'docsync.state.pending': 'في الانتظار',
  'docsync.state.synced': 'متزامن',
  'docsync.state.conflict': 'تعارض',
  'docsync.state.rejected_type': 'نوع غير مسموح',
  'docsync.state.too_large': 'كبير جداً',
  'docsync.state.error': 'خطأ',
  'docsync.state.remote_missing': 'غير موجود لدى المزوّد',
  'docsync.state.local_deleted': 'محذوف في TREK',
  'docsync.state.scope_drift': 'نُقل خارج المجلد',

  'docsync.conflict.resolve': "حلّ {count}",

  'docsync.conflict.title': 'تغيّرت النسختان',
  'docsync.conflict.keepTrek': 'الإبقاء على نسخة TREK',
  'docsync.conflict.keepProvider': 'الإبقاء على نسخة المزوّد',
  'docsync.conflict.keepBoth': 'الإبقاء على النسختين',

  // تنتقل أسباب الفشل كرموز لا كنص قادم من المزوّد: فهو يجيب بالإنجليزية،
  // أو بصفحة تسجيل دخول HTML من وسيط، وكلاهما لا مكان له هنا.
  'docsync.error.unreachable': 'تعذّر الوصول إلى المزوّد.',
  'docsync.error.tls_untrusted': 'رُفضت الشهادة. اسمح بالشهادات الموقّعة ذاتياً إذا كنت تثق بهذا الخادم.',
  'docsync.error.unauthorized': 'رُفضت بيانات الاعتماد.',
  'docsync.error.forbidden': 'هذا الحساب لا يملك صلاحية القيام بذلك.',
  'docsync.error.not_found': 'غير موجود لدى المزوّد.',
  'docsync.error.scope_missing': 'المجلد المرتبط لم يعد موجوداً.',
  'docsync.error.rate_limited': 'المزوّد يحدّ من عدد طلباتنا. سيعيد TREK المحاولة لاحقاً.',
  'docsync.error.too_large': 'حجم الملف أكبر مما يقبله المزوّد.',
  'docsync.error.unsupported_type': 'المزوّد لا يقبل هذا النوع من الملفات.',
  'docsync.error.quota_exceeded': 'لم تعد لدى المزوّد مساحة.',
  'docsync.error.conflict': 'تغيّر المستند في الجهتين.',
  'docsync.error.checksum_mismatch': 'لم يصل النقل سليماً.',
  'docsync.error.provider_error': 'أبلغ المزوّد عن خطأ.',
  'docsync.error.timeout': 'استغرق المزوّد وقتاً طويلاً للرد.',
  'docsync.error.ssrf_blocked': 'هذا العنوان غير مسموح به.',
  'docsync.error.mass_delete_guard':
    'اختفت معظم المستندات دفعة واحدة، لذا لم يُغيَّر شيء. تأكد من أن المجلد لا يزال موصولاً.',
  'docsync.error.unknown': 'حدث خطأ ما.',

  // ── النافذة ────────────────────────────────────────────────────────────────
  'docsync.sidebar.connected': 'هذه الرحلة',
  'docsync.addAnother': 'إضافة آخر',
  'docsync.syncing': 'جارٍ المزامنة',
  'docsync.card.pickFolder': 'متصل، اختر مجلداً',

  'docsync.empty.title': 'لا شيء مرتبط بعد',
  'docsync.empty.hintOwner':
    'اختر مخزناً من القائمة الجانبية. يحتفظ TREK بنسخته الخاصة من كل شيء، فلا يضيع شيء إذا اختفى المخزن.',
  'docsync.empty.hintMember': 'يتولى مالك الرحلة إعداد هذا. تبقى المستندات في TREK في الحالتين.',

  // كيف يرتّب كل منتج الملفات. يظهر قبل أي ربط، لأنه ما ستطلبه الشاشة التالية.
  'docsync.model.paperless': 'التصنيف بالوسوم',
  'docsync.model.papra': 'التصنيف بالوسوم داخل مؤسسة',
  'docsync.model.nextcloud': 'التصنيف في مجلد',
  'docsync.model.opencloud': 'التصنيف في مساحة',
  'docsync.model.synologydrive': 'التصنيف في مجلد على جهاز NAS',

  // ── شريط التدفق ────────────────────────────────────────────────────────────
  'docsync.flow.trek': 'TREK',
  'docsync.flow.toProvider': 'إلى المخزن',
  'docsync.flow.toTrek': 'من المخزن',
  'docsync.flow.documents': 'مستندات',
  'docsync.flow.summary.both': 'المستندات تنتقل في الاتجاهين.',
  'docsync.flow.summary.pull': 'المستندات تدخل فقط.',
  'docsync.flow.summary.push': 'المستندات تخرج فقط.',
  'docsync.flow.summaryEditable.both': 'تنتقل في الاتجاهين. انقر مساراً لإيقافه.',
  'docsync.flow.summaryEditable.pull': 'تدخل فقط. انقر المسار الآخر لإرسالها أيضاً.',
  'docsync.flow.summaryEditable.push': 'تخرج فقط. انقر المسار الآخر لاستقبالها أيضاً.',

  // ── اقتران واحد ────────────────────────────────────────────────────────────
  'docsync.binding.settings': 'الإعدادات',
  'docsync.binding.folder': 'المجلد',
  'docsync.binding.lastRun': 'آخر تشغيل',
  'docsync.binding.autoOff': 'متوقفة مؤقتاً',
  'docsync.binding.neverRun': 'لم تُشغَّل بعد',
  'docsync.binding.deleteHint': 'ما الذي يحدث للنسخة في الجهة الأخرى.',
  'docsync.binding.conflictHint': 'أي نسخة تبقى عند تحرير مستند في المكانين.',
  'docsync.binding.autoHint': 'التحقق من التغييرات في الخلفية.',
  'docsync.binding.webhookTitle': 'تحديثات فورية',
  'docsync.binding.copy': 'نسخ',
  'docsync.binding.copied': 'تم النسخ',

  // ── الربط ──────────────────────────────────────────────────────────────────
  'docsync.connect.submit': 'ربط',
  'docsync.connect.testing': 'جارٍ محاولة الوصول',
  'docsync.connect.okAs': 'تم الوصول، وسُجّل الدخول باسم {account}',
  'docsync.connect.insecureHint': 'لخادم على شبكتك الخاصة بشهادة موقّعة ذاتياً.',
  'docsync.connect.about.paperless': 'يحفظ TREK هذه الرحلة تحت وسم خاص بها ولا يمسّ بقية أرشيفك.',
  'docsync.connect.about.papra': 'اختر المؤسسة التي تنتمي إليها هذه الرحلة. يحفظها TREK داخلها تحت وسم خاص بها.',
  'docsync.connect.about.nextcloud':
    'استخدم كلمة مرور تطبيق لا كلمة مرور حسابك: فهي تعمل مع المصادقة الثنائية ويمكنك إبطالها وحدها.',
  'docsync.connect.about.opencloud': 'يحصل TREK على مساحة خاصة بهذه الرحلة، منفصلة عن كل ما عداها.',
  'docsync.connect.about.synologydrive': 'يُفضّل حساب DSM لا يصل إلا إلى المجلد المشترك المخصّص لهذه الرحلة.',

  // ── اختيار الحاوية ─────────────────────────────────────────────────────────
  'docsync.scope.title': 'أين تُحفظ هذه الرحلة في {provider}؟',
  'docsync.scope.intro': 'يُزامَن ما بداخله فقط. كل ما عداه في مخزنك يبقى خارج TREK.',
  'docsync.scope.createTitle': 'إنشاء واحد جديد',
  'docsync.scope.createAction': 'إنشاء',
  'docsync.scope.pickTitle': 'أو استخدم واحداً موجوداً لديك',
  'docsync.scope.search': 'بحث',
  'docsync.scope.noMatch': 'لا شيء يطابق ذلك.',

  // ── أمور تحتاج قراراً من المستخدم ──────────────────────────────────────────
  'docsync.issues.title': 'يحتاج إلى مراجعة',
  'docsync.issues.conflict': 'تغيّر في الجهتين. اختر النسخة التي تبقى.',
  'docsync.issues.remote_missing': 'اختفى من المخزن. نسخة TREK لا تزال هنا.',
  'docsync.issues.rejected_type': 'نوع الملف هذا غير مسموح به هنا.',
  'docsync.issues.too_large': 'أكبر من الحد المسموح.',
  'docsync.issues.error': 'لم يتم النقل.',

  'docsync.error.unknown_provider': 'هذا المزوّد غير متاح على هذا الخادم.',
  'docsync.error.provider_disabled': 'متوقفة مؤقتاً: أوقف مسؤول الخادم هذا المزوّد. ستُستأنف المزامنة عند إعادة تشغيله.',
};

export default docsync;
