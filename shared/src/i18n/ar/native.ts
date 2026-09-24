import type { TranslationStrings } from '../types';

const native: TranslationStrings = {
  'native.connect.title': 'الاتصال بـ TREK',
  'native.connect.hint': 'أدخل العنوان الذي تفتح به TREK في متصفحك.',
  'native.connect.placeholder': 'trek.example.com',
  'native.connect.submit': 'اتصال',
  'native.connect.checking': 'جارٍ التحقق…',
  'native.connect.errorInvalid': 'لا يبدو هذا عنوان ويب.',
  'native.connect.errorUnreachable': 'لا يستجيب أي خادم على هذا العنوان. تحقق من العنوان ومن اتصالك.',
  'native.connect.errorNotTrek': 'الخادم على هذا العنوان ليس TREK.',
  'native.connect.errorTooOld': 'خادم TREK هذا قديم جدًا بالنسبة للتطبيق. يحتاج إلى تحديث أولًا.',
  'native.offline.title': 'تعذّر الوصول إلى الخادم',
  'native.offline.hint': 'تعذّر على TREK الوصول إلى {server}. تحقق من اتصالك ثم حاول مرة أخرى.',
  'native.offline.retry': 'إعادة المحاولة',
  'native.changeServer': 'تغيير الخادم',
  'native.login.failed': 'تعذّر تسجيل الدخول. يرجى المحاولة مرة أخرى.',
  'native.handoff.title': 'المتابعة في التطبيق',
  'native.handoff.hint': 'لقد سجّلت الدخول باسم {name}. افتح تطبيق TREK لإكمال تسجيل الدخول هناك.',
  'native.handoff.open': 'فتح تطبيق TREK',
  'native.handoff.switchAccount': 'استخدام حساب آخر',
  'native.settings.server': 'الخادم',
  'native.settings.serverHint': 'هذا التطبيق متصل بـ {server}.',
};

export default native;
