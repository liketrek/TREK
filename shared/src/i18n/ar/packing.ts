import type { TranslationStrings } from '../types';

const packing: TranslationStrings = {
  'packing.title': 'قائمة التجهيز',
  'packing.empty': 'قائمة التجهيز فارغة',
  'packing.import': 'استيراد',
  'packing.importTitle': 'استيراد قائمة التعبئة',
  'packing.importHint':
    'عنصر واحد لكل سطر. يمكن إضافة الفئة والكمية مفصولة بفاصلة أو فاصلة منقوطة أو علامة تبويب: الاسم، الفئة، الكمية',
  'packing.importPlaceholder': 'فرشاة أسنان\nواقي شمس، نظافة\nقمصان، ملابس، 5\nجواز سفر، مستندات',
  'packing.importCsv': 'تحميل CSV/TXT',
  'packing.importAction': 'استيراد {count}',
  'packing.importSuccess': 'تم استيراد {count} عنصر',
  'packing.importError': 'فشل الاستيراد',
  'packing.importEmpty': 'لا توجد عناصر للاستيراد',
  'packing.progress': '{packed} من {total} جُهّز ({percent}%)',
  'packing.clearChecked': 'إزالة {count} محدد',
  'packing.clearCheckedShort': 'إزالة {count}',
  'packing.suggestions': 'اقتراحات',
  'packing.suggestionsTitle': 'إضافة اقتراحات',
  'packing.allSuggested': 'تمت إضافة جميع الاقتراحات',
  'packing.allPacked': 'تم تجهيز الكل!',
  'packing.addPlaceholder': 'إضافة عنصر جديد...',
  'packing.categoryPlaceholder': 'الفئة...',
  'packing.filterAll': 'الكل',
  'packing.filterOpen': 'مفتوح',
  'packing.filterDone': 'تم',
  'packing.emptyTitle': 'قائمة التجهيز فارغة',
  'packing.emptyHint': 'أضف عناصر أو استخدم الاقتراحات',
  'packing.emptyFiltered': 'لا توجد عناصر مطابقة لهذا الفلتر',
  'packing.menuRename': 'إعادة تسمية',
  'packing.menuCheckAll': 'تحديد الكل',
  'packing.menuUncheckAll': 'إلغاء تحديد الكل',
  'packing.menuDeleteCat': 'حذف الفئة',
  'packing.noMembers': 'لا أعضاء',
  'packing.addItem': 'إضافة عنصر',
  'packing.addItemPlaceholder': 'اسم العنصر...',
  'packing.addCategory': 'إضافة فئة',
  'packing.newCategoryPlaceholder': 'اسم الفئة (مثال: ملابس)',
  'packing.applyTemplate': 'تطبيق قالب',
  'packing.template': 'قالب',
  'packing.templateApplied': 'تمت إضافة {count} عنصر من القالب',
  'packing.templateError': 'فشل تطبيق القالب',
  'packing.saveAsTemplate': 'حفظ كقالب',
  'packing.templateName': 'اسم القالب',
  'packing.templateSaved': 'تم حفظ قائمة الحقائب كقالب',
  'packing.bags': 'أمتعة',
  'packing.noBag': 'غير معيّن',
  'packing.totalWeight': 'الوزن الإجمالي',
  'packing.bagName': 'الاسم...',
  'packing.addBag': 'إضافة أمتعة',
  'packing.changeCategory': 'تغيير الفئة',
  'packing.confirm.clearChecked': 'هل تريد إزالة {count} عنصر محدد؟',
  'packing.confirm.deleteCat': 'هل تريد حذف الفئة "{name}" مع {count} عنصر؟',
  'packing.defaultCategory': 'أخرى',
  'packing.toast.saveError': 'فشل الحفظ',
  'packing.toast.deleteError': 'فشل الحذف',
  'packing.toast.renameError': 'فشلت إعادة التسمية',
  'packing.toast.addError': 'فشلت الإضافة',
  'packing.suggestions.items': [
    {
      name: 'جواز السفر',
      category: 'المستندات',
    },
    {
      name: 'بطاقة الهوية',
      category: 'المستندات',
    },
    {
      name: 'تأمين السفر',
      category: 'المستندات',
    },
    {
      name: 'تذاكر الطيران',
      category: 'المستندات',
    },
    {
      name: 'بطاقة ائتمان',
      category: 'المالية',
    },
    {
      name: 'نقد',
      category: 'المالية',
    },
    {
      name: 'تأشيرة',
      category: 'المستندات',
    },
    {
      name: 'قمصان',
      category: 'الملابس',
    },
    {
      name: 'بنطلونات',
      category: 'الملابس',
    },
    {
      name: 'ملابس داخلية',
      category: 'الملابس',
    },
    {
      name: 'جوارب',
      category: 'الملابس',
    },
    {
      name: 'جاكيت',
      category: 'الملابس',
    },
    {
      name: 'ملابس نوم',
      category: 'الملابس',
    },
    {
      name: 'ملابس سباحة',
      category: 'الملابس',
    },
    {
      name: 'معطف مطر',
      category: 'الملابس',
    },
    {
      name: 'أحذية مريحة',
      category: 'الملابس',
    },
    {
      name: 'فرشاة أسنان',
      category: 'أدوات العناية',
    },
    {
      name: 'معجون أسنان',
      category: 'أدوات العناية',
    },
    {
      name: 'شامبو',
      category: 'أدوات العناية',
    },
    {
      name: 'مزيل عرق',
      category: 'أدوات العناية',
    },
    {
      name: 'واقي شمس',
      category: 'أدوات العناية',
    },
    {
      name: 'شفرة حلاقة',
      category: 'أدوات العناية',
    },
    {
      name: 'شاحن',
      category: 'الإلكترونيات',
    },
    {
      name: 'بطارية محمولة',
      category: 'الإلكترونيات',
    },
    {
      name: 'سماعات',
      category: 'الإلكترونيات',
    },
    {
      name: 'محول سفر',
      category: 'الإلكترونيات',
    },
    {
      name: 'كاميرا',
      category: 'الإلكترونيات',
    },
    {
      name: 'مسكنات ألم',
      category: 'الصحة',
    },
    {
      name: 'لاصقات جروح',
      category: 'الصحة',
    },
    {
      name: 'مطهر',
      category: 'الصحة',
    },
  ],
};
export default packing;
