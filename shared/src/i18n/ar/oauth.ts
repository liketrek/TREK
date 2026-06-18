import type { TranslationStrings } from '../types';

const oauth: TranslationStrings = {
  'oauth.scope.group.trips': 'الرحلات',
  'oauth.scope.group.places': 'الأماكن',
  'oauth.scope.group.packing': 'الأمتعة',
  'oauth.scope.group.todos': 'المهام',
  'oauth.scope.group.budget': 'الميزانية',
  'oauth.scope.group.reservations': 'الحجوزات',
  'oauth.scope.group.collab': 'التعاون',
  'oauth.scope.group.notifications': 'الإشعارات',
  'oauth.scope.group.vacay': 'الإجازة',
  'oauth.scope.group.weather': 'الطقس',
  'oauth.scope.group.journey': 'مذكرة السفر',
  'oauth.scope.trips:read.label': 'عرض الرحلات وخطط السفر',
  'oauth.scope.trips:read.description': 'قراءة الرحلات والأيام والملاحظات والأعضاء',
  'oauth.scope.trips:write.label': 'تحرير الرحلات وخطط السفر',
  'oauth.scope.trips:write.description': 'إنشاء وتحديث الرحلات والأيام والملاحظات وإدارة الأعضاء',
  'oauth.scope.trips:delete.label': 'حذف الرحلات',
  'oauth.scope.trips:delete.description': 'حذف الرحلات بأكملها نهائياً — هذا الإجراء لا يمكن التراجع عنه',
  'oauth.scope.trips:share.label': 'إدارة روابط المشاركة',
  'oauth.scope.trips:share.description': 'إنشاء روابط مشاركة عامة وتحديثها وإلغاؤها',
  'oauth.scope.places:read.label': 'عرض الأماكن وبيانات الخريطة',
  'oauth.scope.places:read.description': 'قراءة الأماكن وتعيينات الأيام والعلامات والفئات',
  'oauth.scope.places:write.label': 'إدارة الأماكن',
  'oauth.scope.places:write.description': 'إنشاء وتحديث وحذف الأماكن والتعيينات والعلامات',
  'oauth.scope.atlas:read.label': 'عرض Atlas',
  'oauth.scope.atlas:read.description': 'قراءة الدول والمناطق المزارة وقائمة الأمنيات',
  'oauth.scope.atlas:write.label': 'إدارة Atlas',
  'oauth.scope.atlas:write.description': 'تعليم الدول والمناطق كمزارة، وإدارة قائمة الأمنيات',
  'oauth.scope.packing:read.label': 'عرض قوائم الأمتعة',
  'oauth.scope.packing:read.description': 'قراءة عناصر الأمتعة والحقائب ومُسنَدي الفئات',
  'oauth.scope.packing:write.label': 'إدارة قوائم الأمتعة',
  'oauth.scope.packing:write.description': 'إضافة وتحديث وحذف وتبديل وإعادة ترتيب عناصر الأمتعة والحقائب',
  'oauth.scope.todos:read.label': 'عرض قوائم المهام',
  'oauth.scope.todos:read.description': 'قراءة مهام الرحلة ومُسنَدي الفئات',
  'oauth.scope.todos:write.label': 'إدارة قوائم المهام',
  'oauth.scope.todos:write.description': 'إنشاء وتحديث وتبديل وحذف وإعادة ترتيب المهام',
  'oauth.scope.budget:read.label': 'عرض الميزانية',
  'oauth.scope.budget:read.description': 'قراءة بنود الميزانية وتفاصيل النفقات',
  'oauth.scope.budget:write.label': 'إدارة الميزانية',
  'oauth.scope.budget:write.description': 'إنشاء وتحديث وحذف بنود الميزانية',
  'oauth.scope.reservations:read.label': 'عرض الحجوزات',
  'oauth.scope.reservations:read.description': 'قراءة الحجوزات وتفاصيل الإقامة',
  'oauth.scope.reservations:write.label': 'إدارة الحجوزات',
  'oauth.scope.reservations:write.description': 'إنشاء وتحديث وحذف وإعادة ترتيب الحجوزات',
  'oauth.scope.collab:read.label': 'عرض التعاون',
  'oauth.scope.collab:read.description': 'قراءة ملاحظات التعاون والاستطلاعات والرسائل',
  'oauth.scope.collab:write.label': 'إدارة التعاون',
  'oauth.scope.collab:write.description': 'إنشاء وتحديث وحذف الملاحظات والاستطلاعات والرسائل التعاونية',
  'oauth.scope.notifications:read.label': 'عرض الإشعارات',
  'oauth.scope.notifications:read.description': 'قراءة إشعارات التطبيق وأعداد غير المقروءة',
  'oauth.scope.notifications:write.label': 'إدارة الإشعارات',
  'oauth.scope.notifications:write.description': 'تعليم الإشعارات كمقروءة والرد عليها',
  'oauth.scope.vacay:read.label': 'عرض خطط الإجازة',
  'oauth.scope.vacay:read.description': 'قراءة بيانات تخطيط الإجازة والإدخالات والإحصاءات',
  'oauth.scope.vacay:write.label': 'إدارة خطط الإجازة',
  'oauth.scope.vacay:write.description': 'إنشاء وإدارة إدخالات الإجازة والعطلات وخطط الفريق',
  'oauth.scope.geo:read.label': 'الخرائط والترميز الجغرافي',
  'oauth.scope.geo:read.description': 'البحث عن مواقع وحل عناوين الخرائط والترميز الجغرافي العكسي للإحداثيات',
  'oauth.scope.weather:read.label': 'توقعات الطقس',
  'oauth.scope.weather:read.description': 'جلب توقعات الطقس لمواقع الرحلة وتواريخها',
  'oauth.scope.journey:read.label': 'عرض مذكرات السفر',
  'oauth.scope.journey:read.description': 'قراءة مذكرات السفر والمدخلات وقائمة المساهمين',
  'oauth.scope.journey:write.label': 'إدارة مذكرات السفر',
  'oauth.scope.journey:write.description': 'إنشاء مذكرات السفر وتحديثها وحذفها وإدخالاتها',
  'oauth.scope.journey:share.label': 'إدارة روابط مذكرات السفر',
  'oauth.scope.journey:share.description': 'إنشاء روابط مشاركة عامة لمذكرات السفر وتحديثها وإلغاؤها',
  'oauth.scope.group.atlas': 'Atlas', // en-fallback
  'oauth.scope.group.geo': 'Geo', // en-fallback
  'oauth.authorize.authorizing': 'Authorizing…', // en-fallback
  'oauth.authorize.loading': 'Loading…', // en-fallback
  'oauth.authorize.errorTitle': 'Authorization Error', // en-fallback
  'oauth.authorize.loginTitle': 'Sign in to continue', // en-fallback
  'oauth.authorize.loginDescription': '{client} wants access to your TREK account. Please sign in first.', // en-fallback
  'oauth.authorize.loginButton': 'Sign in to TREK', // en-fallback
  'oauth.authorize.requestLabel': 'Authorization Request', // en-fallback
  'oauth.authorize.requestDescription': 'This application is requesting access to your TREK account.', // en-fallback
  'oauth.authorize.trustNote': 'Only grant access to applications you trust. Your data stays on your server.', // en-fallback
  'oauth.authorize.selectScope': 'Select at least one scope', // en-fallback
  'oauth.authorize.approveOneScope': 'Approve ({count} scope)', // en-fallback
  'oauth.authorize.approveManyScopes': 'Approve ({count} scopes)', // en-fallback
  'oauth.authorize.approveAccess': 'Approve Access', // en-fallback
  'oauth.authorize.deny': 'Deny', // en-fallback
  'oauth.authorize.choosePermissions': 'Choose which permissions to grant', // en-fallback
  'oauth.authorize.permissionsRequested': 'Permissions requested', // en-fallback
  'oauth.authorize.alwaysIncluded': 'Always included', // en-fallback
  'oauth.authorize.alwaysTool.listTrips': 'List your trips so the AI can discover trip IDs', // en-fallback
  'oauth.authorize.alwaysTool.getTripSummary': 'Read a trip overview needed to use any other tool', // en-fallback
};
export default oauth;
