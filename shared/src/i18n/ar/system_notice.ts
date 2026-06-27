import type { TranslationStrings } from '../types';

const system_notice: TranslationStrings = {
  'system_notice.v3_photos.title': 'تم نقل الصور في الإصدار 3.0',
  'system_notice.v3_photos.body':
    'تمت إزالة تبويب ​**الصور**​ من مخطط الرحلة. صورك آمنة — لم يعدّل TREK مكتبتك على Immich أو Synology قطّ.\n\nتعيش الصور الآن في إضافة **Journey**. Journey اختيارية — إن لم تكن متاحة بعد، اطلب من المسؤول تفعيلها عبر Admin ← الإضافات.',
  'system_notice.v3_journey.title': 'تعرّف على Journey — مذكرة سفر',
  'system_notice.v3_journey.body': 'وثّق رحلاتك كقصص غنية بخطوط زمنية ومعارض صور وخرائط تفاعلية.',
  'system_notice.v3_journey.cta_label': 'فتح Journey',
  'system_notice.v3_journey.highlight_timeline': 'جدول زمني يومي ومعرض',
  'system_notice.v3_journey.highlight_photos': 'استيراد من Immich أو Synology',
  'system_notice.v3_journey.highlight_share': 'مشاركة علنية — دون تسجيل دخول',
  'system_notice.v3_journey.highlight_export': 'تصدير كألبوم صور PDF',
  'system_notice.v3_features.title': 'مزيد من مميزات 3.0',
  'system_notice.v3_features.body': 'بعض الجديد الآخر الجدير بالمعرفة في هذا الإصدار.',
  'system_notice.v3_features.highlight_dashboard': 'إعادة تصميم لوحة التحكم mobile-first',
  'system_notice.v3_features.highlight_offline': 'وضع لا اتصال كامل كتطبيق PWA',
  'system_notice.v3_features.highlight_search': 'إكمال تلقائي في الوقت الفعلي',
  'system_notice.v3_features.highlight_import': 'استيراد أماكن من ملفات KMZ/KML',
  'system_notice.v3_mcp.title': 'MCP: ترقية OAuth 2.1',
  'system_notice.v3_mcp.body':
    'تمت إعادة تصميم تكامل MCP بالكامل. OAuth 2.1 هو الآن طريقة المصادقة الموصى بها. الرموز الثابتة (trek_…) مهملة وستُزال في إصدار مستقبلي.',
  'system_notice.v3_mcp.highlight_oauth': 'OAuth 2.1 موصى به (mcp-remote)',
  'system_notice.v3_mcp.highlight_scopes': '24 نطاق أذونات دقيق',
  'system_notice.v3_mcp.highlight_deprecated': 'الرموز الثابتة trek_ مهملة',
  'system_notice.v3_mcp.highlight_tools': 'مجموعة أدوات وإرشادات موسعة',
  'system_notice.v3_thankyou.title': 'كلمة شخصية مني',
  'system_notice.v3_thankyou.body':
    'قبل أن تمضي — أريد أن أتوقف لحظة.\n\nبدأ TREK كمشروع جانبي بنيته لرحلاتي الخاصة. لم أتخيل يومًا أنه سيكبر ليصبح شيئًا يعتمد عليه 4,000 منكم لتخطيط مغامراتهم. كل نجمة، كل مشكلة، كل طلب ميزة — أقرأها جميعًا، وهي ما يبقيني مستمرًا في الليالي المتأخرة بين عمل بدوام كامل والجامعة.\n\nأريدكم أن تعرفوا: TREK سيبقى دائمًا مفتوح المصدر، دائمًا مستضافًا ذاتيًا، دائمًا ملككم. لا تتبع، لا اشتراكات، لا شروط خفية. مجرد أداة بناها شخص يحب السفر بقدر ما تحبونه.\n\nشكر خاص لـ [jubnl](https://github.com/jubnl) — لقد أصبحت متعاونًا رائعًا. الكثير مما يجعل الإصدار 3.0 عظيمًا يحمل بصماتك. شكرًا لإيمانك بهذا المشروع عندما كان لا يزال في بداياته.\n\nولكل واحد منكم ممن أبلغ عن خطأ، أو ترجم نصًا، أو شارك TREK مع صديق، أو ببساطة استخدمه لتخطيط رحلة — **شكرًا لكم**. أنتم السبب في وجود هذا.\n\nإلى المزيد من المغامرات معًا.\n\n— Maurice\n\n---\n\n[انضم إلى المجتمع على Discord](https://discord.gg/7Q6M6jDwzf)\n\nإذا جعل TREK رحلاتك أفضل، [فنجان قهوة صغير](https://ko-fi.com/mauriceboe) يبقي الأضواء مشتعلة.',
  'system_notice.v3014_whitespace_collision.title': 'إجراء مطلوب: تعارض في حسابات المستخدمين',
  'system_notice.v3014_whitespace_collision.body':
    'اكتشف ترقية 3.0.14 تعارضًا في أسماء مستخدمين أو بريد إلكتروني ناتجًا عن مسافات بيضاء في بداية أو نهاية القيم المخزنة. تمت إعادة تسمية الحسابات المتأثرة تلقائيًا. تحقق من سجلات الخادم بحثًا عن أسطر تبدأ بـ **[migration] WHITESPACE COLLISION** لتحديد الحسابات التي تحتاج إلى مراجعة.',
  'system_notice.welcome_v1.title': 'مرحبًا بك في TREK',
  'system_notice.welcome_v1.body':
    'مخطط رحلاتك الشامل. أنشئ جداول السفر، وشارك رحلاتك مع الأصدقاء، وابقَ منظمًا — سواء كنت متصلاً بالإنترنت أم لا.',
  'system_notice.welcome_v1.cta_label': 'خطط لرحلة',
  'system_notice.welcome_v1.hero_alt': 'وجهة سفر خلابة مع واجهة تطبيق TREK',
  'system_notice.welcome_v1.highlight_plan': 'جداول رحلات يومية لكل سفرة',
  'system_notice.welcome_v1.highlight_share': 'تعاون مع شركاء السفر',
  'system_notice.welcome_v1.highlight_offline': 'يعمل بلا إنترنت على الهاتف',
  'system_notice.pager.prev': 'الإشعار السابق',
  'system_notice.pager.next': 'الإشعار التالي',
  'system_notice.pager.goto': 'الانتقال إلى الإشعار {n}',
  'system_notice.pager.position': 'الإشعار {current} من {total}',
  'system_notice.dev_test_modal.title': '[Dev] Test notice', // en-fallback
  'system_notice.dev_test_modal.body': 'This is a dev-only test notice.', // en-fallback
  'system_notice.thank_you_support.title': 'شكرًا لاستخدامك TREK',
  'system_notice.thank_you_support.body':
    'شكرًا سريعًا على تثبيتك TREK — هذا يعني لي الكثير حقًا.\n\nأنا مطوّر منفرد أبني TREK في وقت فراغي. بدأ كأداة صغيرة لرحلاتي الخاصة فحسب، وصدقًا أنا مندهش من الدعم والاهتمام اللذين أبداهما المجتمع منذ ذلك الحين. TREK مصنوع بكثير من الحب من جانبي — ولكن أيضًا بفضل العديد من المساهمين الخارجيين الرائعين الذين ساعدوا في تشكيله.\n\n**TREK مفتوح المصدر ومجاني تمامًا — وسيبقى كذلك إلى الأبد. لا باقات مدفوعة، لا اشتراكات، لا شروط خفية. أعدكم بذلك.**\n\nإذا كان TREK مفيدًا لك وأردت دعم تطويره، فإن فنجان قهوة صغيرًا يساعدني حقًا على مواصلة البناء — لا ضغط على الإطلاق، لكن كل فنجان يبقي الليالي المتأخرة مستمرة.\n\nشكرًا لوجودك هنا.\n\n— Maurice',
  'system_notice.thank_you_support.highlight_opensource': 'مفتوح المصدر 100% على GitHub',
  'system_notice.thank_you_support.highlight_free': 'مجاني للأبد — لا باقات مدفوعة أبدًا',
  'system_notice.thank_you_support.highlight_community': 'مبني بالتعاون مع المجتمع',
  'system_notice.thank_you_support.cta_bmc': 'Buy Me a Coffee',
  'system_notice.thank_you_support.cta_kofi': 'ادعمني على Ko-fi',
  'system_notice.pager.counter': '{current} / {total}', // en-fallback
};
export default system_notice;
