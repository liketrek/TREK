import type { TranslationStrings } from '../types';

const dayplan: TranslationStrings = {
  'dayplan.icsTooltip': 'تصدير التقويم (ICS)',
  'dayplan.emptyDay': 'لا توجد أماكن مخططة لهذا اليوم',
  'dayplan.cannotReorderTransport':
    'لا يمكن إعادة ترتيب الحجوزات ذات الوقت الثابت',
  'dayplan.confirmRemoveTimeTitle': 'إزالة الوقت؟',
  'dayplan.confirmRemoveTimeBody':
    'هذا المكان له وقت ثابت ({time}). نقله سيزيل الوقت ويسمح بالترتيب الحر.',
  'dayplan.confirmRemoveTimeAction': 'إزالة الوقت ونقل',
  'dayplan.cannotDropOnTimed':
    'لا يمكن وضع العناصر بين الإدخالات المرتبطة بوقت',
  'dayplan.cannotBreakChronology':
    'سيؤدي هذا إلى كسر الترتيب الزمني للعناصر والحجوزات المجدولة',
  'dayplan.addNote': 'إضافة ملاحظة',
  'dayplan.editNote': 'تعديل الملاحظة',
  'dayplan.noteAdd': 'إضافة ملاحظة',
  'dayplan.noteEdit': 'تعديل الملاحظة',
  'dayplan.noteTitle': 'ملاحظة',
  'dayplan.noteSubtitle': 'ملاحظة يومية',
  'dayplan.totalCost': 'إجمالي التكلفة',
  'dayplan.days': 'الأيام',
  'dayplan.dayN': 'اليوم {n}',
  'dayplan.calculating': 'جارٍ الحساب...',
  'dayplan.route': 'المسار',
  'dayplan.optimize': 'تحسين',
  'dayplan.optimized': 'تم تحسين المسار',
  'dayplan.routeError': 'فشل حساب المسار',
  'dayplan.toast.needTwoPlaces': 'يلزم مكانان على الأقل لتحسين المسار',
  'dayplan.toast.routeOptimized': 'تم تحسين المسار',
  'dayplan.toast.noGeoPlaces': 'لم يتم العثور على أماكن بإحداثيات لحساب المسار',
  'dayplan.confirmed': 'مؤكد',
  'dayplan.pendingRes': 'قيد الانتظار',
  'dayplan.pdfTooltip': 'تصدير خطة اليوم بصيغة PDF',
  'dayplan.pdfError': 'فشل تصدير PDF',
};
export default dayplan;
