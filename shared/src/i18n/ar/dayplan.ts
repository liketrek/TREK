import type { TranslationStrings } from '../types';

const dayplan: TranslationStrings = {
  'dayplan.icsTooltip': 'تصدير التقويم (ICS)',
  'dayplan.emptyDay': 'لا توجد أماكن مخططة لهذا اليوم',
  'dayplan.cannotReorderTransport': 'لا يمكن إعادة ترتيب الحجوزات ذات الوقت الثابت',
  'dayplan.confirmRemoveTimeTitle': 'إزالة الوقت؟',
  'dayplan.confirmRemoveTimeBody': 'هذا المكان له وقت ثابت ({time}). نقله سيزيل الوقت ويسمح بالترتيب الحر.',
  'dayplan.confirmRemoveTimeAction': 'إزالة الوقت ونقل',
  'dayplan.confirmDeleteNoteTitle': 'حذف الملاحظة؟',
  'dayplan.confirmDeleteNoteBody': 'سيتم حذف هذه الملاحظة نهائيًا.',
  'dayplan.cannotDropOnTimed': 'لا يمكن وضع العناصر بين الإدخالات المرتبطة بوقت',
  'dayplan.cannotBreakChronology': 'سيؤدي هذا إلى كسر الترتيب الزمني للعناصر والحجوزات المجدولة',
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
  'dayplan.toast.routeOptimizedFromHotel': 'تم تحسين المسار انطلاقًا من مكان إقامتك',
  'dayplan.toast.noGeoPlaces': 'لم يتم العثور على أماكن بإحداثيات لحساب المسار',
  'dayplan.confirmed': 'مؤكد',
  'dayplan.pendingRes': 'قيد الانتظار',
  'dayplan.pdfTooltip': 'تصدير خطة اليوم بصيغة PDF',
  'dayplan.pdfError': 'فشل تصدير PDF',
  'dayplan.expandAll': 'Expand all days', // en-fallback
  'dayplan.collapseAll': 'Collapse all days', // en-fallback
  'dayplan.pdf': 'PDF', // en-fallback
  'dayplan.mobile.addPlace': 'Add Place', // en-fallback
  'dayplan.mobile.searchPlaces': 'Search places...', // en-fallback
  'dayplan.mobile.allAssigned': 'All places assigned', // en-fallback
  'dayplan.mobile.noMatch': 'No match', // en-fallback
  'dayplan.mobile.createNew': 'Create new place', // en-fallback
  'dayplan.reorderDays': 'إعادة ترتيب الأيام',
  'dayplan.reorderTitle': 'إعادة ترتيب الأيام',
  'dayplan.reorderHint': 'تنتقل أماكن اليوم وملاحظاته وحجوزاته معه.',
  'dayplan.addDay': 'إضافة يوم',
  'dayplan.moveUp': 'تحريك لأعلى',
  'dayplan.moveDown': 'تحريك لأسفل',
  'dayplan.reorderUndo': 'إعادة ترتيب الأيام',
  'dayplan.reorderError': 'تعذّر إعادة ترتيب الأيام',
  'dayplan.addDayError': 'تعذّر إضافة يوم',
};
export default dayplan;
