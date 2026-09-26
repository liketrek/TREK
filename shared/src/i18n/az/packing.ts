import type { TranslationStrings } from '../types';

const packing: TranslationStrings = {
  'packing.actions': 'Əməliyyatlar',
  'packing.editDone': 'Hazır',
  'packing.personalEmptyHint':
    'Şəxsi siyahınız boşdur — paylaşılan elementləri siyahınıza köçürün və ya yenisini əlavə edin.',
  'packing.assignMembers': 'Üzvləri təyin et',
  'packing.categoryOptions': 'Siyahı seçimləri',
  'packing.editItem': 'Elementi redaktə et',
  'packing.itemName': 'Ad',
  'packing.itemQuantity': 'Say',
  'packing.itemWeight': 'Çəki (qram)',

  'packing.title': 'Baqaj siyahısı',
  'packing.empty': 'Baqaj siyahısı boşdur',
  'packing.import': 'İdxal et',
  'packing.importTitle': 'Baqaj siyahısını idxal et',
  'packing.importHint':
    'Hər sətirdə bir element. Format: Kateqoriya, Ad, qramla çəki (istəyə bağlı), Çanta (istəyə bağlı), checked/unchecked (istəyə bağlı)',
  'packing.importPlaceholder':
    'Gigiyena, Diş fırçası\nGeyim, Köynəklər, 200\nSənədlər, Pasport, , Əl yükü\nElektronika, Şarj cihazı, 50, Çamadan, checked',
  'packing.importCsv': 'CSV/TXT/MD yüklə',
  'packing.export': 'İxrac et',
  'packing.exportPrint': 'Çap et və ya PDF kimi saxla',
  'packing.exportMarkdown': 'Markdown yoxlama siyahısı (.md)',
  'packing.exportCsv': 'İdxal üçün CSV (.csv)',
  'packing.printItems': 'Elementlər',
  'packing.printPacked': 'Yığılıb',
  'packing.importHintMarkdown':
    'Markdown siyahısı da işləyir: başlıq kateqoriyanı adlandırır, "- [ ]" və "- [x]" elementə çevrilir, adın önündəki "3x" isə miqdarı təyin edir.',
  'packing.importAction': '{count} elementi idxal et',
  'packing.importSuccess': '{count} element idxal edildi',
  'packing.importError': 'İdxal uğursuz oldu',
  'packing.importEmpty': 'İdxal ediləcək element yoxdur',

  'packing.progress':
    '{total} elementdən {packed} yığılıb ({percent}%)',
  'packing.clearChecked': 'İşarələnmiş {count} elementi sil',
  'packing.clearCheckedShort': '{count} elementi sil',

  'packing.allPacked': 'Hər şey yığılıb!',

  'packing.addPlaceholder': 'Yeni element əlavə et...',
  'packing.categoryPlaceholder': 'Siyahı...',
  'packing.filterAll': 'Hamısı',
  'packing.filterOpen': 'Hazır deyil',
  'packing.filterDone': 'Hazırdır',

  'packing.emptyTitle': 'Baqaj siyahısı boşdur',
  'packing.emptyFiltered':
    'Bu filtrə uyğun heç bir element yoxdur',

  'packing.menuRename': 'Adını dəyiş',
  'packing.menuCheckAll': 'Hamısını işarələ',
  'packing.menuUncheckAll': 'Bütün işarələri sil',
  'packing.menuDeleteCat': 'Siyahını sil',

  'packing.noMembers': 'Səyahət üzvü yoxdur',
  'packing.addItem': 'Element əlavə et',
  'packing.addItemPlaceholder': 'Elementin adı...',
  'packing.addCategory': 'Siyahı əlavə et',
  'packing.newCategoryPlaceholder':
    'Siyahının adı (məs. Geyim)',

  'packing.applyTemplate': 'Şablonu tətbiq et',
  'packing.template': 'Şablon',
  'packing.templateApplied':
    'Şablondan {count} element əlavə edildi',
  'packing.templateError': 'Şablonu tətbiq etmək mümkün olmadı',
  'packing.saveAsTemplate': 'Şablon kimi yadda saxla',
  'packing.templateName': 'Şablonun adı',
  'packing.templateSaved':
    'Baqaj siyahısı şablon kimi yadda saxlanıldı',

  'packing.bags': 'Çantalar',
  'packing.noBag': 'Təyin edilməyib',
  'packing.totalWeight': 'Ümumi çəki',
  'packing.quantity': 'Say',
  'packing.bagName': 'Çantanın adı...',
  'packing.addBag': 'Çanta əlavə et',
  'packing.changeCategory': 'Siyahıya köçür',

  'packing.makePrivate': 'Şəxsi et',
  'packing.makePublic': 'Paylaşılan et',
  'packing.privateHint': 'Şəxsi — yalnız sizə görünür',
  'packing.viewCommon': 'Paylaşılan',
  'packing.viewPersonal': 'Mənim siyahım',
  'packing.share': 'Paylaşım',
  'packing.tierCommonHint':
    'Ümumi siyahıdadır və hər kəsə görünür',
  'packing.tierPersonal': 'Şəxsi',
  'packing.tierPersonalHint': 'Şəxsi — yalnız siz görə bilərsiniz',
  'packing.tierShared': 'Paylaşılıb:',
  'packing.noOneToShare':
    'Bu səyahətdə hələ başqa üzv yoxdur',

  'packing.takenCareOf': '{name} cavabdehdir',
  'packing.sharedWithCount': '{count} nəfərlə paylaşılıb',
  'packing.broughtBy': '{name} gətirir',
  'packing.alsoBring': 'Mən də bunu gətirə bilərəm',
  'packing.alsoBringingStop': 'Mən bunu gətirməyəcəyəm',
  'packing.cloneToMine': 'Mənim siyahıma köçür',

  'packing.confirm.clearChecked':
    'İşarələnmiş {count} elementi silmək istədiyinizə əminsiniz?',
  'packing.confirm.deleteCat':
    '“{name}” siyahısını daxilindəki {count} elementlə birlikdə silmək istədiyinizə əminsiniz?',

  'packing.defaultCategory': 'Digər',
  'packing.toast.saveError': 'Yadda saxlamaq mümkün olmadı',
  'packing.toast.deleteError': 'Silmək mümkün olmadı',
  'packing.toast.renameError': 'Adını dəyişmək mümkün olmadı',
  'packing.toast.addError': 'Əlavə etmək mümkün olmadı',


  'packing.bagLimit': 'Çəki limiti',
  'packing.setBagLimit': 'Limit təyin et',
};

export default packing;