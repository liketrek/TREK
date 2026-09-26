import type { TranslationStrings } from '../types';

const reservations: TranslationStrings = {
  'reservations.title': 'Rezervasiyalar',
  'reservations.empty': 'Hələ rezervasiya yoxdur',
  'reservations.emptyHint':
    'Uçuşlar, otellər və digər xidmətlər üçün rezervasiyalar əlavə edin',
  'reservations.add': 'Rezervasiya əlavə et',
  'reservations.addManual': 'Əl ilə rezervasiya et',
  'reservations.placeHint':
    'İpucu: Rezervasiyanı günlük planınızla əlaqələndirmək üçün onu birbaşa məkandan yaratmaq daha məqsədəuyğundur.',

  'reservations.confirmed': 'Təsdiqlənib',
  'reservations.pending': 'Gözləyir',
  'reservations.summary':
    '{confirmed} təsdiqlənib, {pending} gözləyir',
  'reservations.showFiles': 'Faylları göstər',

  'reservations.editTitle': 'Rezervasiyanı redaktə et',
  'reservations.status': 'Status',
  'reservations.datetime': 'Tarix və vaxt',
  'reservations.startTime': 'Başlanğıc vaxtı',
  'reservations.endTime': 'Bitmə vaxtı',
  'reservations.date': 'Tarix',
  'reservations.time': 'Vaxt',
  'reservations.timeAlt': 'Vaxt (alternativ, məsələn, 19:30)',
  'reservations.notes': 'Qeydlər',
  'reservations.notesPlaceholder': 'Əlavə qeydlər...',
  'reservations.urlLabel': 'Link',
  'reservations.urlPlaceholder': 'https://...',

  'reservations.meta.airline': 'Aviaşirkət',
  'reservations.meta.flightNumber': 'Uçuş nömrəsi',
  'reservations.meta.from': 'Haradan',
  'reservations.meta.to': 'Haraya',

  'reservations.layover.route': 'Marşrut',
  'reservations.layover.stop': 'Ara dayanacaq',
  'reservations.layover.addStop': 'Ara dayanacaq əlavə et',
  'reservations.layover.connection': 'Transfer',
  'reservations.layover.layover': 'Tranzit gözləmə',

  'reservations.needsReview': 'Yoxlayın',
  'reservations.needsReviewHint':
    'Hava limanını avtomatik uyğunlaşdırmaq mümkün olmadı — məkanı təsdiqləyin.',
  'reservations.searchLocation':
    'Stansiya, liman və ya ünvan axtarın…',

  'reservations.meta.trainNumber': 'Qatar nömrəsi',
  'reservations.meta.platform': 'Platforma',
  'reservations.meta.seat': 'Oturacaq',
  'reservations.meta.checkIn': 'Giriş',
  'reservations.meta.checkInUntil': 'Son giriş vaxtı',
  'reservations.meta.checkOut': 'Çıxış',

  'reservations.meta.linkAccommodation': 'Yaşayış yeri',
  'reservations.meta.pickAccommodation':
    'Yaşayış yeri ilə əlaqələndir',
  'reservations.meta.noAccommodation': 'Heç biri',
  'reservations.meta.hotelPlace': 'Yaşayış yeri',

  'reservations.meta.linkPlace': 'Məkan / Fəaliyyət',
  'reservations.meta.pickPlace': 'Məkan / fəaliyyət seç',
  'reservations.meta.pickHotel': 'Yaşayış yeri seç',
  'reservations.meta.fromDay': 'Başlanğıc günü',
  'reservations.meta.toDay': 'Son gün',
  'reservations.meta.selectDay': 'Gün seç',

  'reservations.type.flight': 'Uçuş',
  'reservations.type.hotel': 'Yaşayış yeri',
  'reservations.type.restaurant': 'Restoran',
  'reservations.type.train': 'Qatar',
  'reservations.type.car': 'Avtomobil',
  'reservations.type.cruise': 'Kruiz',
  'reservations.type.event': 'Tədbir',
  'reservations.type.tour': 'Tur',
  'reservations.type.parking': 'Parkinq',
  'reservations.type.other': 'Digər',
  'reservations.type.bus': 'Avtobus',
  'reservations.type.ferry': 'Bərə',
  'reservations.type.bicycle': 'Velosiped',
  'reservations.type.taxi': 'Taksi',
  'reservations.type.transit': 'İctimai nəqliyyat',
  'reservations.type.transport_other': 'Digər',

  'reservations.confirm.delete':
    '“{name}” rezervasiyasını silmək istədiyinizə əminsiniz?',
  'reservations.confirm.deleteTitle': 'Rezervasiya silinsin?',
  'reservations.confirm.deleteBody':
    '“{name}” həmişəlik silinəcək.',

  'reservations.toast.updated': 'Rezervasiya yeniləndi',
  'reservations.toast.removed': 'Rezervasiya silindi',
  'reservations.toast.fileUploaded': 'Fayl yükləndi',
  'reservations.toast.uploadError': 'Faylı yükləmək mümkün olmadı',

  'reservations.newTitle': 'Yeni rezervasiya',
  'reservations.bookingType': 'Rezervasiya növü',
  'reservations.titleLabel': 'Başlıq',
  'reservations.titlePlaceholder':
    'məs. Lufthansa LH123, Hotel Adlon...',
  'reservations.locationAddress': 'Məkan / Ünvan',
  'reservations.locationPlaceholder':
    'Ünvan, hava limanı, otel...',
  'reservations.confirmationCode': 'Rezervasiya kodu',
  'reservations.confirmationPlaceholder': 'məs. ABC12345',
  'reservations.day': 'Gün',
  'reservations.noDay': 'Gün seçilməyib',
  'reservations.place': 'Məkan',
  'reservations.noPlace': 'Məkan seçilməyib',

  'reservations.pendingSave': 'yadda saxlanacaq…',
  'reservations.uploading': 'Yüklənir...',
  'reservations.attachFile': 'Fayl əlavə et',
  'reservations.linkExisting': 'Mövcud faylı əlaqələndir',

  'reservations.toast.saveError': 'Yadda saxlamaq mümkün olmadı',
  'reservations.toast.updateError': 'Yeniləmək mümkün olmadı',
  'reservations.toast.deleteError': 'Silmək mümkün olmadı',

  'reservations.confirm.remove':
    '“{name}” üçün rezervasiya silinsin?',

  'reservations.linkAssignment': 'Günlük planla əlaqələndir',
  'reservations.pickAssignment':
    'Planınızdan bir təyinat seçin...',
  'reservations.noAssignment': 'Əlaqə yoxdur (müstəqil)',

  'reservations.price': 'Qiymət',
  'reservations.budgetCategory': 'Büdcə kateqoriyası',
  'reservations.budgetCategoryPlaceholder':
    'məs. Nəqliyyat, Yaşayış yeri',
  'reservations.budgetCategoryAuto':
    'Avtomatik (rezervasiya növünə əsasən)',
  'reservations.budgetHint':
    'Yadda saxlanarkən avtomatik olaraq büdcə qeydi yaradılacaq.',

  'reservations.departureDate': 'Yola düşmə',
  'reservations.arrivalDate': 'Çatma',
  'reservations.departureTime': 'Yola düşmə vaxtı',
  'reservations.arrivalTime': 'Çatma vaxtı',
  'reservations.pickupDate': 'Götürmə',
  'reservations.returnDate': 'Qaytarma',
  'reservations.pickupTime': 'Götürmə vaxtı',
  'reservations.returnTime': 'Qaytarma vaxtı',
  'reservations.endDate': 'Bitmə tarixi',

  'reservations.meta.departureTimezone':
    'Yola düşmə saat qurşağı',
  'reservations.meta.arrivalTimezone':
    'Çatma saat qurşağı',

  'reservations.span.departure': 'Yola düşmə',
  'reservations.span.arrival': 'Çatma',
  'reservations.span.inTransit': 'Yoldadır',

  // span.pickup does double duty: the day a rental car is picked up, and the day a
  // multi-day parking ends and you collect your own car again. Both read the same way
  // in every locale, so parking only needs the drop-off wording of its own.
  'reservations.span.pickup': 'Götürmə',
  'reservations.span.dropOff': 'Təhvilvermə',
  'reservations.span.return': 'Qaytarma',
  'reservations.span.active': 'Aktiv',
  'reservations.span.start': 'Başlanğıc',
  'reservations.span.end': 'Son',
  'reservations.span.ongoing': 'Davam edir',

  'reservations.validation.endBeforeStart':
    'Bitmə tarixi və vaxtı başlanğıc tarixi və vaxtından sonra olmalıdır',

  'reservations.addBooking': 'Rezervasiya əlavə et',

  'reservations.import.title':
    'Rezervasiya təsdiqlərini idxal et',
  'reservations.import.cta': 'Fayldan idxal et',
  'reservations.import.dropHere':
    'Rezervasiya təsdiqi fayllarını buraya sürükləyib buraxın və ya seçmək üçün klikləyin',
  'reservations.import.dropActive':
    'İdxal etmək üçün faylları buraya buraxın',
  'reservations.import.acceptedFormats':
    'Qəbul edilən formatlar: EML, PDF, PKPass, HTML, TXT (hər biri maksimum 10 MB, 5 fayladək)',
  'reservations.import.acceptedPhotos': 'Fotoları (JPG, PNG, WEBP) süni intellekt modeli oxuyur.',
  'reservations.import.parsing': 'Fayllar təhlil edilir…',
  'reservations.import.previewHeading':
    '{count} rezervasiya tapıldı',
  'reservations.import.previewEmpty':
    'Yüklənən fayllardan heç bir rezervasiya çıxarmaq mümkün olmadı.',
  'reservations.import.removeItem': 'Sil',
  'reservations.import.needsReview': 'Yoxlayın',
  'reservations.import.tryAi': 'AI ilə təhlil et',
  'reservations.import.aiParsing': 'AI ilə təhlil edilir…',
  'reservations.import.confirm':
    '{count} rezervasiyanı idxal et',
  'reservations.import.back': 'Geri',
  'reservations.import.success':
    '{count} rezervasiya idxal edildi',
  'reservations.import.partialFailure':
    '{created} idxal edildi, {failed} uğursuz oldu',
  'reservations.import.error':
    'Təhlil uğursuz oldu. Faylın etibarlı rezervasiya təsdiqi olduğuna əmin olun.',
  'reservations.import.unavailable':
    'Rezervasiyaların idxalı bu serverdə əlçatan deyil.',
  'reservations.import.unsupportedFormat':
    'Dəstəklənməyən fayl formatıdır. EML, PDF, PKPass, HTML və ya TXT istifadə edin.',
  'reservations.import.fileTooLarge':
    '“{name}” faylı 10 MB limitini keçir.',

  'reservations.airtrail.title': 'AirTrail-dən idxal et',
  'reservations.airtrail.cta': 'AirTrail',
  'reservations.airtrail.synced': 'AirTrail',
  'reservations.airtrail.syncedHint':
    'AirTrail ilə sinxronlaşdırılıb — dəyişikliklər hər iki istiqamətdə sinxron qalır.',
  'reservations.airtrail.notSynced': 'Sinxronlaşdırılmayıb',
  'reservations.airtrail.notSyncedHint':
    'Bu uçuş AirTrail-dən silinib və artıq sinxronlaşdırılmır.',
  'reservations.airtrail.layoverHint':
    'AirTrail-dən idxal edilib. Tranzit gözləməsi olan çoxseqmentli uçuşun AirTrail-də sinxronlaşdırıla biləcək vahid uçuş qeydi olmadığından, bu birdəfəlik idxal kimi qalır.',
  'reservations.airtrail.loadError':
    'AirTrail uçuşlarınızı yükləmək mümkün olmadı.',
  'reservations.airtrail.imported':
    '{count} uçuş idxal edildi',
  'reservations.airtrail.skippedDuplicate':
    '{count} uçuş artıq bu səyahətdədir və buraxıldı',
  'reservations.airtrail.nothingImported':
    'İdxal ediləcək heç nə yoxdur.',
  'reservations.airtrail.importError':
    'İdxal uğursuz oldu. Yenidən cəhd edin.',
  'reservations.airtrail.undo': 'AirTrail-dən idxal et',
  'reservations.airtrail.alreadyImported': 'İdxal edilib',
  'reservations.airtrail.duringTrip': 'Bu səyahət zamanı',
  'reservations.airtrail.otherFlights': 'Digər uçuşlar',
  'reservations.airtrail.empty':
    'AirTrail hesabınızda heç bir uçuş tapılmadı.',
  'reservations.airtrail.importCta': '{count} uçuşu idxal et',
  'reservations.airtrail.joinConnection':
    '{stops} dayanacağında tranzit gözləmə ilə bir uçuş kimi idxal et',

  'reservations.costsLabel': 'Xərclər',
  'reservations.createExpense': 'Xərc yarat',
  'reservations.createExpenseHint':
    'Rezervasiyanı yadda saxlayır, sonra Xərclər redaktorunu açır.',
  'reservations.linkedExpense': 'Əlaqəli xərc',
  'reservations.removeExpense': 'Xərci sil',
  'reservations.linkedExpenses': 'Əlaqəli xərclər',
  'reservations.linkExpense': 'Mövcud xərci əlaqələndir',
  'reservations.unlinkExpense': 'Əlaqəni sil, xərci saxla',
  'reservations.noUnlinkedExpenses': 'Əlaqəsiz xərc yoxdur',

  'reservations.travelers.label': 'Səyahətçilər',
  'reservations.travelers.assign': 'Səyahətçiləri təyin et',
  'reservations.travelers.none':
    'Hələ səyahət üzvü yoxdur.',
};

export default reservations;