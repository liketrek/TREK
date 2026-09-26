import type { TranslationStrings } from '../types';

const dayplan: TranslationStrings = {
  'dayplan.icsTooltip': 'Təqvimi ixrac et (ICS)',
  'dayplan.emptyDay': 'Bu gün üçün heç bir məkan planlaşdırılmayıb',
  'dayplan.addPlaceHere': 'Bu günə məkan əlavə et',
  'dayplan.cannotReorderTransport':
    'Sabit vaxtı olan rezervasiyaların sırası dəyişdirilə bilməz',

  'dayplan.confirmRemoveTimeTitle': 'Vaxt silinsin?',
  'dayplan.confirmRemoveTimeBody':
    'Bu məkanın sabit vaxtı var ({time}). Onu daşıdıqda vaxt silinəcək və sərbəst sıralama mümkün olacaq.',
  'dayplan.confirmRemoveTimeAction': 'Vaxtı sil və daşı',

  'dayplan.confirmDeleteNoteTitle': 'Qeyd silinsin?',
  'dayplan.confirmDeleteNoteBody': 'Bu qeyd həmişəlik silinəcək.',

  'dayplan.cannotDropOnTimed':
    'Elementlər vaxtı müəyyən edilmiş qeydlərin arasına yerləşdirilə bilməz',
  'dayplan.cannotBreakChronology':
    'Bu, vaxtı müəyyən edilmiş elementlərin və rezervasiyaların xronoloji ardıcıllığını pozacaq',

  'dayplan.addNote': 'Qeyd əlavə et',
  'dayplan.expandAll': 'Bütün günləri genişləndir',
  'dayplan.collapseAll': 'Bütün günləri yığ',
  'dayplan.editNote': 'Qeydi redaktə et',
  'dayplan.noteAdd': 'Qeyd əlavə et',
  'dayplan.noteEdit': 'Qeydi redaktə et',
  'dayplan.noteDelete': 'Qeydi sil',
  'dayplan.noteTitle': 'Qeyd',
  'dayplan.noteSubtitle': 'Günlük qeyd',
  'dayplan.noteIcon': 'İkon',

  'notes.appearance': 'Görünüş',
  'notes.preview': 'Önizləmə',
  'notes.bodyPlaceholder': 'Təfərrüatlar, linklər, xatırlatmalar…',
  'notes.markdownHint': 'Markdown dəstəklənir',
  'notes.format.toolbar': 'Formatlama',
  'notes.format.bold': 'Qalın',
  'notes.format.italic': 'Maili',
  'notes.format.strike': 'Üstündən xətt çəkilmiş',
  'notes.format.code': 'Kod',
  'notes.format.link': 'Link',
  'notes.format.list': 'Markerli siyahı',
  'notes.format.orderedList': 'Nömrələnmiş siyahı',
  'notes.format.quote': 'Sitat',

  'notes.color.label': 'Rəng',
  'notes.color.none': 'Rəngsiz',
  'notes.color.red': 'Qırmızı',
  'notes.color.orange': 'Narıncı',
  'notes.color.amber': 'Kəhrəba',
  'notes.color.green': 'Yaşıl',
  'notes.color.cyan': 'Firuzəyi',
  'notes.color.blue': 'Mavi',
  'notes.color.purple': 'Bənövşəyi',

  'dayplan.totalCost': 'Ümumi xərc',
  'dayplan.days': 'Günlər',
  'dayplan.dayN': '{n}-ci gün',
  'dayplan.calculating': 'Hesablanır...',
  'dayplan.route': 'Marşrut',
  'dayplan.optimize': 'Optimallaşdır',

  'dayplan.transportMode.change': 'Nəqliyyat növünü dəyiş',
  'dayplan.transportMode.useDefault':
    'Günün standart seçimindən istifadə et',

  'dayplan.optimized': 'Marşrut optimallaşdırıldı',
  'dayplan.routeError': 'Marşrutu hesablamaq mümkün olmadı',
  'dayplan.toast.needTwoPlaces':
    'Marşrutu optimallaşdırmaq üçün ən azı iki məkan tələb olunur',
  'dayplan.toast.routeOptimized': 'Marşrut optimallaşdırıldı',
  'dayplan.toast.routeOptimizedFromHotel':
    'Marşrut yaşayış yerinizdən başlayaraq optimallaşdırıldı',
  'dayplan.toast.noGeoPlaces':
    'Marşrutun hesablanması üçün koordinatları olan heç bir məkan tapılmadı',

  'dayplan.confirmed': 'Təsdiqlənib',
  'dayplan.pendingRes': 'Gözləyir',

  'dayplan.export': 'İxrac et',
  'dayplan.exportIntro':
    'Planınızı özünüzlə aparın: sənəd kimi, təqviminizdə və ya GPS cihazınızda.',
  'dayplan.exportDocument': 'Sənəd',
  'dayplan.exportCalendar': 'Təqvim',
  'dayplan.exportMaps': 'Xəritələr və GPS',

  'dayplan.pdf': 'PDF',
  'dayplan.pdfTooltip': 'Günlük planı PDF kimi ixrac et',
  'dayplan.gpxTooltip':
    'Oflayn xəritələr və GPS cihazları üçün GPX kimi ixrac et',
  'dayplan.gpxAll': 'Bütün səyahət',
  'dayplan.gpxPlaces': 'Yalnız məkanlar',
  'dayplan.gpxDays': 'Günlər marşrut kimi',
  'dayplan.gpxEmpty': 'Hələ ixrac ediləcək heç nə yoxdur',
  'dayplan.gpxFailed': 'GPX ixracı uğursuz oldu',
  'dayplan.pdfError': 'PDF-i ixrac etmək mümkün olmadı',

  'dayplan.mobile.addPlace': 'Məkan əlavə et',
  'dayplan.mobile.searchPlaces': 'Məkanları axtarın...',
  'dayplan.mobile.allAssigned': 'Bütün məkanlar günlərə təyin edilib',
  'dayplan.mobile.noMatch': 'Uyğun nəticə yoxdur',
  'dayplan.mobile.createNew': 'Yeni məkan yarat',

  'dayplan.reorderDays': 'Günlərin sırasını dəyiş',
  'dayplan.reorderTitle': 'Günlərin sırasını dəyiş',
  'dayplan.reorderHint':
    'Günə aid məkanlar, qeydlər və rezervasiyalar günlə birlikdə daşınacaq.',
  'dayplan.addDay': 'Gün əlavə et',
  'dayplan.moveUp': 'Yuxarı daşı',
  'dayplan.moveDown': 'Aşağı daşı',
  'dayplan.reorderUndo': 'Günlərin sırasını dəyiş',
  'dayplan.reorderError':
    'Günlərin sırasını dəyişmək mümkün olmadı',
  'dayplan.addDayError': 'Gün əlavə etmək mümkün olmadı',
  'dayplan.deleteDay': 'Günü sil',
  'dayplan.deleteDayTitle': '{day} silinsin?',
  'dayplan.deleteDayBody': 'Gün səyahətdən silinəcək. Bunu geri qaytarmaq mümkün deyil.',
  'dayplan.deleteDayEmpty': 'Bu gün üçün heç nə planlaşdırılmayıb.',
  'dayplan.impactPlaces': 'Planlaşdırılmış məkanlar: {count}',
  'dayplan.impactPlacesHint': 'Onlar məkanlar siyahısında qalır.',
  'dayplan.impactNotes': 'Qeydlər: {count}',
  'dayplan.impactTexts': 'Gün başlıqları və təsvirləri: {count}',
  'dayplan.impactDeletedHint': 'Onlar da silinəcək.',
  'dayplan.impactBookings': 'Rezervasiyalar: {count}',
  'dayplan.impactStay': '{name} məkanında qalma',
  'dayplan.deleteDayBookingsHint': 'Onlar gün təyin edilmədən Rezervasiyalar bölməsində qalır.',
  'dayplan.deleteDayStayHint': 'Giriş və ya çıxış bu günə düşdüyü üçün qalma qeydi ləğv edilir.',
  'dayplan.deleteDayStayBookedHint':
    'Giriş və ya çıxış bu günə düşdüyü üçün qalma qeydi, “{booking}” rezervasiyası və onun xərci birlikdə ləğv edilir.',
  'dayplan.deleteDayStayBookingHint':
    'Giriş və ya çıxış bu günə düşdüyü üçün qalma qeydi və “{booking}” rezervasiyası birlikdə ləğv edilir.',
  'dayplan.deleteDayStayPaidHint':
    'Giriş və ya çıxış bu günə düşdüyü üçün qalma qeydi, “{booking}” rezervasiyası və onun {amount} məbləğində xərci birlikdə ləğv edilir.',
  'dayplan.deleteDayShift': 'Sonrakı günlər: {count}',
  'dayplan.deleteDayShiftHint': 'Hər biri bir tarix əvvələ keçiriləcək.',
  'dayplan.deleteDayShiftBookingsHint':
    'Hər biri bir tarix əvvələ keçiriləcək. Birlikdə köçürülən rezervasiyalar: {count}',
  'dayplan.deleteDayShrink': 'Səyahət artıq {date} tarixində bitir',
  'dayplan.deleteDayShrinkHint': 'Son tarixi qəbul edəcək tarixsiz gün yoxdur.',
  'dayplan.impactStayShorter': '{name} məkanında qalma: bir gecə az',
  'dayplan.deleteDayStayShorterHint':
    'Bu günü əhatə etdiyi üçün çıxış tarixi artıq {date} olacaq.',
  'dayplan.deleteDayStayShorterUndatedHint':
    'Bu günü əhatə etdiyi üçün qalma müddəti artıq bir gün əvvəl bitir.',
  'dayplan.deleteDaySpareDated': '{day}, {date} tarixini qəbul edir',
  'dayplan.deleteDaySpareDatedHint':
    'Bu, tarixsiz ilk gündür və səyahətin son tarixini qəbul edir.',
  'dayplan.deleteDayLast': 'Səyahətdə ən azı bir gün olmalıdır',
  'dayplan.daysOffline': 'Günləri dəyişmək üçün internet bağlantısı lazımdır',
  'dayplan.deleteDaySuccess': 'Gün silindi',
  'dayplan.deleteDayError': 'Günü silmək mümkün olmadı',
  'dayplan.addUndatedDay': 'Tarixsiz',
  'dayplan.addUndatedDayHint':
    'Sona tarixsiz gün əlavə edir. Səyahətin tarixləri dəyişməz qalır.',
  'dayplan.addDatedDay': '{date} tarixini əlavə et',
  'dayplan.addDatedDayHint':
    '{date} tarixini əlavə edir və səyahəti bir gün uzadır.',
  'dayplan.tripExtended':
    'Gün əlavə edildi. Səyahət artıq bir gün sonra, {date} tarixində bitir.',
};

export default dayplan;