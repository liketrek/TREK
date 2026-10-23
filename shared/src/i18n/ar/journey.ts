import type { TranslationStrings } from '../types';

const journey: TranslationStrings = {
  'journey.search.placeholder': 'البحث في الرحلات…',
  'journey.search.noResults': 'لا توجد رحلات تطابق "{query}"',
  'journey.status.archived': 'مؤرشف',
  'journey.detail.backToJourney': 'العودة للمجلة',
  'journey.detail.photos': 'صورة',
  'journey.detail.photos.zero': 'صور',
  'journey.detail.photos.one': 'صورة',
  'journey.detail.photos.two': 'صورتان',
  'journey.detail.photos.few': 'صور',
  'journey.detail.photos.many': 'صورة',
  'journey.detail.day': 'اليوم {number}',
  'journey.detail.places': 'أماكن',
  'journey.skeletons.show': 'إظهار الاقتراحات',
  'journey.skeletons.hide': 'إخفاء الاقتراحات',
  'journey.editor.discardChangesConfirm': 'لديك تغييرات غير محفوظة. هل تريد تجاهلها؟',
  'journey.editor.uploadFailed': 'فشل رفع الصور',
  'journey.editor.uploadPhotos': 'رفع صور',
  'journey.editor.uploading': '...جارٍ الرفع',
  'journey.editor.uploadingProgress': 'جارٍ الرفع {done}/{total}…',
  'journey.editor.uploadPartialFailed': 'فشل رفع {failed} من {total} — احفظ مجدداً للمحاولة',
  'journey.editor.fromGallery': 'من المعرض',
  'journey.editor.addAnother': 'إضافة آخر',
  'journey.editor.makeFirst': 'جعله الأول',
  'journey.editor.searching': 'جارٍ البحث...',
  'journey.editor.useCurrentLocation': 'استخدام موقعي الحالي',
  'journey.editor.locationPermissionDenied': 'تم رفض الوصول إلى الموقع. اسمح به في إعدادات المتصفح وحاول مرة أخرى.',
  'journey.editor.locationTimeout': 'انتهت مهلة تحديد موقعك. حاول مرة أخرى.',
  'journey.editor.locationUnavailable': 'تعذر تحديد موقعك.',
  'journey.editor.locationInsecureContext': 'يتطلب تحديد الموقع اتصالاً آمناً (HTTPS).',
  'journey.share.copy': 'نسخ',
  'journey.share.copied': 'تم النسخ!',
  'journey.invite.role': 'الدور',
  'journey.invite.viewer': 'مشاهد',
  'journey.invite.editor': 'محرر',
  'journey.invite.invite': 'دعوة',
  'journey.invite.inviting': 'جارٍ الدعوة...',
  'journey.settings.endJourney': 'أرشفة الرحلة',
  'journey.settings.reopenJourney': 'استعادة الرحلة',
  'journey.settings.archived': 'تم أرشفة الرحلة',
  'journey.settings.reopened': 'تمت إعادة فتح الرحلة',
  'journey.settings.endDescription': 'يخفي شارة البث المباشر. يمكنك إعادة الفتح في أي وقت.',
  'journey.settings.failedToDelete': 'فشل في الحذف',
  'journey.entries.deleteTitle': 'حذف الإدخال',
  'journey.gallery.deleteTitle': 'حذف الصورة',
  'journey.gallery.deleteMessage': 'ستُزال هذه الصورة من المعرض ومن كل إدخال تظهر فيه. لا يمكن التراجع عن ذلك.',
  'journey.photosUploaded': 'تم رفع {count} صورة',
  'journey.photosUploaded.zero': 'لم يتم رفع أي صورة',
  'journey.photosUploaded.one': 'تم رفع صورة واحدة',
  'journey.photosUploaded.two': 'تم رفع صورتين',
  'journey.photosUploaded.few': 'تم رفع {count} صور',
  'journey.photosUploaded.many': 'تم رفع {count} صورة',
  'journey.photosUploadFailed': 'فشل رفع بعض الصور',
  'journey.photosAdded': 'تمت إضافة {count} صورة',
  'journey.photosAdded.zero': 'لم تتم إضافة أي صورة',
  'journey.photosAdded.one': 'تمت إضافة صورة واحدة',
  'journey.photosAdded.two': 'تمت إضافة صورتين',
  'journey.photosAdded.few': 'تمت إضافة {count} صور',
  'journey.photosAdded.many': 'تمت إضافة {count} صورة',
  'journey.picker.tripPeriod': 'فترة الرحلة',
  'journey.picker.dateRange': 'نطاق التاريخ',
  'journey.picker.allPhotos': 'كل الصور',
  'journey.picker.albums': 'ألبومات',
  'journey.picker.selected': 'محدد',
  'journey.picker.addTo': 'إضافة إلى',
  'journey.picker.newGallery': 'معرض جديد',
  'journey.picker.selectAll': 'تحديد الكل',
  'journey.picker.deselectAll': 'إلغاء تحديد الكل',
  'journey.picker.noAlbums': 'لم يتم العثور على ألبومات',
  'journey.picker.selectDate': 'اختر تاريخ',
  'journey.picker.search': 'بحث',
  'journey.title': 'Journey', // en-fallback
  'journey.subtitle': 'Track your travels as they happen', // en-fallback
  'journey.new': 'New Journey', // en-fallback
  'journey.lightbox.zoomIn': 'تكبير',
  'journey.lightbox.zoomOut': 'تصغير',
  'journey.lightbox.zoomReset': 'العودة إلى الصورة كاملة',
  'journey.create': 'Create', // en-fallback
  'journey.titlePlaceholder': 'Where are you going?', // en-fallback
  'journey.empty': 'No journeys yet', // en-fallback
  'journey.emptyHint': 'Start documenting your next trip', // en-fallback
  'journey.deleted': 'Journey deleted', // en-fallback
  'journey.createError': 'Could not create journey', // en-fallback
  'journey.deleteError': 'Could not delete journey', // en-fallback
  'journey.deleteConfirmTitle': 'Delete', // en-fallback
  'journey.deleteConfirmMessage': 'Delete "{title}"? This cannot be undone.', // en-fallback
  'journey.deleteConfirmGeneric': 'Are you sure you want to delete this?', // en-fallback
  'journey.notFound': 'Journey not found', // en-fallback
  'journey.photos': 'Photos', // en-fallback
  'journey.timelineEmpty': 'No stops yet', // en-fallback
  'journey.timelineEmptyHint': 'Add a check-in or write a journal entry to get started', // en-fallback
  'journey.status.draft': 'Draft', // en-fallback
  'journey.status.active': 'Active', // en-fallback
  'journey.status.completed': 'Completed', // en-fallback
  'journey.status.upcoming': 'Upcoming', // en-fallback
  'journey.checkin.add': 'Check in', // en-fallback
  'journey.checkin.namePlaceholder': 'Location name', // en-fallback
  'journey.checkin.notesPlaceholder': 'Notes (optional)', // en-fallback
  'journey.checkin.save': 'Save', // en-fallback
  'journey.checkin.error': 'Could not save check-in', // en-fallback
  'journey.entry.add': 'Journal', // en-fallback
  'journey.entry.edit': 'Edit entry', // en-fallback
  'journey.entry.titlePlaceholder': 'Title (optional)', // en-fallback
  'journey.entry.bodyPlaceholder': 'What happened today?', // en-fallback
  'journey.entry.save': 'Save', // en-fallback
  'journey.entry.error': 'Could not save entry', // en-fallback
  'journey.photo.add': 'Photo', // en-fallback
  'journey.photo.uploadError': 'Upload failed', // en-fallback
  'journey.share.share': 'Share', // en-fallback
  'journey.share.public': 'Public', // en-fallback
  'journey.share.linkCopied': 'Public link copied', // en-fallback
  'journey.share.disabled': 'Public sharing disabled', // en-fallback
  'journey.editor.titlePlaceholder': 'Give this moment a name...', // en-fallback
  'journey.editor.bodyPlaceholder': 'Tell the story of this day...', // en-fallback
  'journey.editor.placePlaceholder': 'Location (optional)', // en-fallback
  'journey.editor.tagsPlaceholder': 'Tags: hidden gem, best meal, must revisit...', // en-fallback
  'journey.visibility.private': 'Private', // en-fallback
  'journey.visibility.shared': 'Shared', // en-fallback
  'journey.visibility.public': 'Public', // en-fallback
  'journey.emptyState.title': 'Your story starts here', // en-fallback
  'journey.emptyState.subtitle': 'Check in at a place or write your first journal entry', // en-fallback
  'journey.frontpage.subtitle': "Turn your trips into stories you'll never forget", // en-fallback
  'journey.frontpage.createJourney': 'Create Journey', // en-fallback
  'journey.frontpage.activeJourney': 'Active Journey', // en-fallback
  'journey.frontpage.latestJourney': 'أحدث رحلة',
  'journey.frontpage.allJourneys': 'All Journeys', // en-fallback
  'journey.frontpage.journeys': 'رحلة',
  'journey.frontpage.journeys.zero': 'رحلات',
  'journey.frontpage.journeys.one': 'رحلة',
  'journey.frontpage.journeys.two': 'رحلتان',
  'journey.frontpage.journeys.few': 'رحلات',
  'journey.frontpage.journeys.many': 'رحلة',
  'journey.frontpage.createNew': 'Create a new Journey', // en-fallback
  'journey.frontpage.createNewSub': 'Pick trips, write stories, share your adventures', // en-fallback
  'journey.frontpage.live': 'Live', // en-fallback
  'journey.frontpage.synced': 'Synced', // en-fallback
  'journey.frontpage.continueWriting': 'Continue writing', // en-fallback
  'journey.frontpage.updated': 'Updated {time}', // en-fallback
  'journey.frontpage.suggestionLabel': 'Trip just ended', // en-fallback
  'journey.frontpage.suggestionText': 'Turn <strong>{title}</strong> into a Journey', // en-fallback
  'journey.frontpage.dismiss': 'Dismiss', // en-fallback
  'journey.frontpage.dismissError': 'تعذر تجاهل هذا الاقتراح',
  'journey.frontpage.journeyName': 'Journey Name', // en-fallback
  'journey.frontpage.namePlaceholder': 'e.g. Southeast Asia 2026', // en-fallback
  'journey.frontpage.selectTrips': 'Select Trips', // en-fallback
  'journey.frontpage.tripsSelected': 'trips selected', // en-fallback
  'journey.frontpage.trips': 'trips', // en-fallback
  'journey.frontpage.placesImported': 'places will be imported', // en-fallback
  'journey.frontpage.places': 'مكان',
  'journey.frontpage.places.zero': 'أماكن',
  'journey.frontpage.places.one': 'مكان',
  'journey.frontpage.places.two': 'مكانان',
  'journey.frontpage.places.few': 'أماكن',
  'journey.frontpage.places.many': 'مكانًا',
  'journey.detail.syncedWithTrips': 'Synced with Trips', // en-fallback
  'journey.detail.addEntry': 'Add Entry', // en-fallback
  'journey.detail.jumpToTop': 'العودة إلى الأعلى',
  'journey.detail.jumpToLast': 'الانتقال إلى آخر مدخل',
  'journey.detail.dayJump': 'الانتقال إلى يوم',
  'journey.detail.dayJumpCount': '{count} يوم',
  'journey.detail.dayJumpCount.zero': 'لا توجد أيام',
  'journey.detail.dayJumpCount.one': 'يوم واحد',
  'journey.detail.dayJumpCount.two': 'يومان',
  'journey.detail.dayJumpCount.few': '{count} أيام',
  'journey.detail.dayJumpCount.many': '{count} يومًا',
  'journey.detail.newEntry': 'New Entry', // en-fallback
  'journey.detail.editEntry': 'Edit Entry', // en-fallback
  'journey.detail.noEntries': 'No entries yet', // en-fallback
  'journey.detail.noEntriesHint': 'Add a trip to get started with skeleton entries', // en-fallback
  'journey.detail.noPhotos': 'No photos yet', // en-fallback
  'journey.detail.noPhotosHint': 'Upload photos to entries or browse your Immich/Synology library', // en-fallback
  'journey.detail.journeyTab': 'Journey', // en-fallback
  'journey.detail.journeyStats': 'Journey Stats', // en-fallback
  'journey.detail.syncedTrips': 'Synced Trips', // en-fallback
  'journey.detail.noTripsLinked': 'No trips linked yet', // en-fallback
  'journey.detail.contributors': 'Contributors', // en-fallback
  'journey.detail.readMore': 'Read more', // en-fallback
  'journey.detail.prosCons': 'Pros & Cons', // en-fallback
  'journey.stats.days': 'Days', // en-fallback
  'journey.stats.cities': 'Cities', // en-fallback
  'journey.stats.entries': 'Entries', // en-fallback
  'journey.stats.photos': 'Photos', // en-fallback
  'journey.stats.places': 'Places', // en-fallback
  'journey.verdict.lovedIt': 'Loved it', // en-fallback
  'journey.verdict.couldBeBetter': 'Could be better', // en-fallback
  'journey.synced.places': 'مكان',
  'journey.synced.places.zero': 'أماكن',
  'journey.synced.places.one': 'مكان',
  'journey.synced.places.two': 'مكانان',
  'journey.synced.places.few': 'أماكن',
  'journey.synced.places.many': 'مكانًا',
  'journey.synced.synced': 'synced', // en-fallback
  'journey.editor.allPhotosAdded': 'All photos already added', // en-fallback
  'journey.editor.writeStory': 'Write your story...', // en-fallback
  'journey.editor.prosCons': 'Pros & Cons', // en-fallback
  'journey.editor.pros': 'Pros', // en-fallback
  'journey.editor.cons': 'Cons', // en-fallback
  'journey.editor.proPlaceholder': 'Something great...', // en-fallback
  'journey.editor.conPlaceholder': 'Not so great...', // en-fallback
  'journey.editor.date': 'Date', // en-fallback
  'journey.editor.location': 'Location', // en-fallback
  'journey.editor.searchLocation': 'Search location...', // en-fallback
  'journey.editor.mood': 'Mood', // en-fallback
  'journey.editor.weather': 'Weather', // en-fallback
  'journey.editor.photoFirst': '1st', // en-fallback
  'journey.mood.amazing': 'Amazing', // en-fallback
  'journey.mood.good': 'Good', // en-fallback
  'journey.mood.neutral': 'Neutral', // en-fallback
  'journey.mood.rough': 'Rough', // en-fallback
  'journey.weather.sunny': 'Sunny', // en-fallback
  'journey.weather.partly': 'Partly cloudy', // en-fallback
  'journey.weather.cloudy': 'Cloudy', // en-fallback
  'journey.weather.rainy': 'Rainy', // en-fallback
  'journey.weather.stormy': 'Stormy', // en-fallback
  'journey.weather.cold': 'Snowy', // en-fallback
  'journey.trips.linkTrip': 'Link Trip', // en-fallback
  'journey.trips.searchTrip': 'Search Trip', // en-fallback
  'journey.trips.searchPlaceholder': 'Trip name or destination...', // en-fallback
  'journey.trips.noTripsAvailable': 'No trips available', // en-fallback
  'journey.trips.link': 'Link', // en-fallback
  'journey.trips.tripLinked': 'Trip linked', // en-fallback
  'journey.trips.linkFailed': 'Failed to link trip', // en-fallback
  'journey.trips.addTrip': 'Add Trip', // en-fallback
  'journey.trips.unlinkTrip': 'Unlink Trip', // en-fallback
  'journey.trips.unlinkMessage':
    'Unlink "{title}"? All synced entries and photos from this trip will be permanently deleted. This cannot be undone.', // en-fallback
  'journey.trips.unlink': 'Unlink', // en-fallback
  'journey.trips.tripUnlinked': 'Trip unlinked', // en-fallback
  'journey.trips.unlinkFailed': 'Failed to unlink trip', // en-fallback
  'journey.trips.noTripsLinkedSettings': 'No trips linked', // en-fallback
  'journey.contributors.invite': 'Invite Contributor', // en-fallback
  'journey.contributors.searchUser': 'Search User', // en-fallback
  'journey.contributors.searchPlaceholder': 'Username or email...', // en-fallback
  'journey.contributors.noUsers': 'No users found', // en-fallback
  'journey.contributors.role': 'Role', // en-fallback
  'journey.contributors.added': 'Contributor added', // en-fallback
  'journey.contributors.addFailed': 'Failed to add contributor', // en-fallback
  'journey.contributors.remove': 'Remove contributor', // en-fallback
  'journey.contributors.removeConfirm': 'Remove {username} from this journey?', // en-fallback
  'journey.contributors.removed': 'Contributor removed', // en-fallback
  'journey.contributors.removeFailed': 'Failed to remove contributor', // en-fallback
  'journey.contributors.viaTrips': 'عبر الرحلات',
  'journey.contributors.viaTripsHint': 'يمكنهم فتح هذه اليوميات لأن رحلة ترتبط بها. غيّر ذلك من إعدادات الرحلة.',
  'journey.contributors.viaTrip': 'عبر {trip}',
  'journey.share.publicShare': 'Public Share', // en-fallback
  'journey.share.createLink': 'Create share link', // en-fallback
  'journey.share.linkCreated': 'Share link created', // en-fallback
  'journey.share.createFailed': 'Failed to create link', // en-fallback
  'journey.share.timeline': 'Timeline', // en-fallback
  'journey.share.gallery': 'Gallery', // en-fallback
  'journey.share.map': 'Map', // en-fallback
  'journey.share.removeLink': 'Remove share link', // en-fallback
  'journey.share.linkDeleted': 'Share link deleted', // en-fallback
  'journey.share.deleteFailed': 'Failed to delete', // en-fallback
  'journey.share.updateFailed': 'Failed to update', // en-fallback
  'journey.settings.title': 'Journey Settings', // en-fallback
  'journey.settings.coverImage': 'Cover Image', // en-fallback
  'journey.settings.changeCover': 'Change cover', // en-fallback
  'journey.settings.addCover': 'Add cover image', // en-fallback
  'journey.settings.name': 'Name', // en-fallback
  'journey.settings.subtitle': 'Subtitle', // en-fallback
  'journey.settings.subtitlePlaceholder': 'e.g. Thailand, Vietnam & Cambodia', // en-fallback
  'journey.settings.tracks': 'مسارات GPX',
  'journey.settings.recordings': 'الأيام المسجلة',
  'journey.settings.showTripTracks': 'إظهار جميع مسارات GPX للرحلات',
  'journey.settings.showTripTracksHint': 'يرسم المسارات المخططة (مسارات GPX) من الرحلات المرتبطة على الخريطة.',
  'journey.settings.autoPrepare': 'تحضير الأيام المسجلة تلقائيًا',
  'journey.settings.autoPrepareHint':
    'ما دامت رحلة مرتبطة جارية، تنتظر محطات التوقف من Dawarich الخاص بك عند يومها لتراجعها. يحصل المحررون الذين لديهم اتصالهم الخاص على محطاتهم. لا يُكتب شيء في اليومية من تلقاء نفسه.',
  'journey.settings.status': 'الحالة',
  'journey.settings.statusAuto': 'تلقائي',
  'journey.settings.statusAutoHint': 'يتبع تواريخ الرحلات المرتبطة. بدون رحلة تبقى الرحلة مسودة.',
  'journey.settings.statusManualHint': 'مضبوطة يدويًا. لن تغيرها تواريخ الرحلة حتى تعود إلى الوضع التلقائي.',
  'journey.settings.photosSection': 'الصور',
  'journey.settings.photoLocation': 'تحديد موقع الإدخالات من صورها',
  'journey.settings.photoLocationHint':
    'يأخذ الإدخال الذي بلا مكان موقع أول صورة له تحمل GPS. لا تُنقل الأماكن التي حددتها بنفسك أبدًا.',
  'journey.settings.delete': 'Delete', // en-fallback
  'journey.settings.deleteJourney': 'Delete Journey', // en-fallback
  'journey.settings.deleteMessage': 'Delete "{title}"? All entries and photos will be lost.', // en-fallback
  'journey.settings.saved': 'Settings saved', // en-fallback
  'journey.settings.saveFailed': 'Failed to save', // en-fallback
  'journey.settings.coverUpdated': 'Cover updated', // en-fallback
  'journey.settings.coverFailed': 'Upload failed', // en-fallback
  'journey.public.notFound': 'Not Found', // en-fallback
  'journey.public.notFoundMessage': "This journey doesn't exist or the link has expired.", // en-fallback
  'journey.public.readOnly': 'Read-only · Public Journey', // en-fallback
  'journey.public.tagline': 'Travel Resource & Exploration Kit', // en-fallback
  'journey.public.sharedVia': 'Shared via', // en-fallback
  'journey.public.madeWith': 'Made with', // en-fallback
  'journey.pdf.journeyBook': 'Journey Book', // en-fallback
  'journey.pdf.madeWith': 'Made with TREK', // en-fallback
  'journey.pdf.day': 'Day', // en-fallback
  'journey.pdf.theEnd': 'The End', // en-fallback
  'journey.pdf.saveAsPdf': 'Save as PDF', // en-fallback
  'journey.pdf.pages': 'pages', // en-fallback
  'journey.editor.externalPhotos': 'External photos', // en-fallback
  'journey.editor.externalPhotosFor': 'Photos for {date}', // en-fallback
  'journey.editor.externalPhotosNearby': 'Nearby photos first', // en-fallback
  'journey.editor.externalPhotosNoLocation': 'All photos from this day', // en-fallback
  'journey.editor.externalPhotosQueued': 'queued', // en-fallback
  'journey.editor.externalPhotosUnavailable': 'No connected photo providers are available.', // en-fallback
  'journey.editor.externalPhotosPartialFailed': '{failed} photo groups failed — save again to retry', // en-fallback
  'journey.picker.day': 'This day', // en-fallback
  'journey.studio.title': 'TREK Studio', // en-fallback
  'journey.studio.open': 'Studio', // en-fallback
  'journey.studio.openAria': 'Open the photo book studio', // en-fallback
  'journey.studio.backToJourney': 'Back to the journey', // en-fallback
  'journey.studio.format': 'Page format', // en-fallback
  'journey.studio.formatA4Landscape': 'A4 landscape', // en-fallback
  'journey.studio.formatA4Portrait': 'A4 portrait', // en-fallback
  'journey.studio.formatSquare21': 'Square 21 × 21 cm', // en-fallback
  'journey.studio.formatSquare30': 'Square 30 × 30 cm', // en-fallback
  'journey.studio.pages': 'Pages', // en-fallback
  'journey.studio.cover': 'Cover', // en-fallback
  'journey.studio.inspector': 'Properties', // en-fallback
  'journey.studio.inspectorEmpty': 'Select something on the page to edit it.', // en-fallback
  'journey.studio.emptySpread': 'This spread is still empty', // en-fallback
  'journey.studio.autoLayout': 'Auto layout', // en-fallback
  'journey.studio.export': 'Export', // en-fallback
  'journey.studio.day': 'اليوم {day}',
  'journey.studio.stations': 'المحطات',
  'journey.studio.peersHere': 'هنا',
  'journey.studio.folioAuto': 'تلقائي',
  'journey.studio.exportLayout': 'التخطيط',
  'journey.studio.exportPages': 'صفحات مفردة',
  'journey.studio.exportPagesHint': 'ورقة واحدة لكل صفحة، بترتيب القراءة. هذا ما تطلبه المطبعة.',
  'journey.studio.exportSpreads': 'صفحات مزدوجة',
  'journey.studio.exportSpreadsHint': 'صفحتان معًا، كما يُفتح الكتاب. للقراءة.',
  'journey.studio.exportFinishing': 'التشطيب',
  'journey.studio.exportMarks': 'علامات القص',
  'journey.studio.exportMarksHint': 'يضيف {bleed} مم من الفيض عند كل حافة ويحدد موضع القص',
  'journey.studio.exportNote': '{count} ورقة بقياس {width} × {height} مم. يحوّل المتصفح معاينة الطباعة إلى PDF.',
  'journey.studio.exportNote.zero': 'لا توجد أوراق بقياس {width} × {height} مم. يحوّل المتصفح معاينة الطباعة إلى PDF.',
  'journey.studio.exportNote.one': 'ورقة واحدة بقياس {width} × {height} مم. يحوّل المتصفح معاينة الطباعة إلى PDF.',
  'journey.studio.exportNote.two': 'ورقتان بقياس {width} × {height} مم. يحوّل المتصفح معاينة الطباعة إلى PDF.',
  'journey.studio.exportNote.few': '{count} أوراق بقياس {width} × {height} مم. يحوّل المتصفح معاينة الطباعة إلى PDF.',
  'journey.studio.exportNote.many': '{count} ورقة بقياس {width} × {height} مم. يحوّل المتصفح معاينة الطباعة إلى PDF.',
  'journey.studio.exportOpen': 'معاينة الطباعة',
  'journey.studio.exportSave': 'حفظ بصيغة PDF',
  'journey.studio.exportPreparing': 'جارٍ التحضير',
  'journey.studio.exportSheetCount': '{count} ورقة',
  'journey.studio.exportSheetCount.zero': 'لا توجد أوراق',
  'journey.studio.exportSheetCount.one': 'ورقة واحدة',
  'journey.studio.exportSheetCount.two': 'ورقتان',
  'journey.studio.exportSheetCount.few': '{count} أوراق',
  'journey.studio.exportSheetCount.many': '{count} ورقة',
  'journey.studio.undo': 'Undo', // en-fallback
  'journey.studio.redo': 'Redo', // en-fallback
  'journey.studio.zoomIn': 'Zoom in', // en-fallback
  'journey.studio.zoomOut': 'Zoom out', // en-fallback
  'journey.studio.zoomFit': 'Fit to view', // en-fallback
  'journey.studio.downloadSpread': 'تنزيل هذه الصفحة المزدوجة',
  'journey.studio.downloadSpreadHint': 'يحفظ تصميم هذه الصفحة كملف، بدون الصور، لمشاركته أو إعادة استخدامه',
  'journey.studio.importSpread': 'استيراد',
  'journey.studio.importSpreadHint': 'إضافة صفحة مزدوجة من ملف تصميم منزّل',
  'journey.studio.importSpreadFailed': 'هذا الملف ليس صفحة من TREK Studio',
  'journey.studio.desktopOnly': 'Studio needs a bigger screen', // en-fallback
  'journey.studio.desktopOnlyHint':
    'تصميم كتاب يحتاج مساحة للعمل، لذلك يعمل الاستوديو على سطح المكتب فقط، وكذلك إنشاء ملف PDF. كل شيء آخر في رحلتك يعمل هنا كالمعتاد.', // en-fallback
  'journey.studio.formatA5Landscape': 'A5 landscape', // en-fallback
  'journey.studio.bookView': 'Book view', // en-fallback
  'journey.studio.multiple': 'Several', // en-fallback
  'journey.studio.kind.photo': 'Photo', // en-fallback
  'journey.studio.kind.text': 'Text', // en-fallback
  'journey.studio.kind.shape': 'Shape', // en-fallback
  'journey.studio.position': 'Position', // en-fallback
  'journey.studio.width': 'W', // en-fallback
  'journey.studio.height': 'H', // en-fallback
  'journey.studio.text': 'Text', // en-fallback
  'journey.studio.typography': 'Type', // en-fallback
  'journey.studio.leading': 'Line', // en-fallback
  'journey.studio.colour': 'Colour', // en-fallback
  'journey.studio.autoColour': 'تلقائي',
  'journey.studio.countryNames': 'الأسماء',
  'journey.studio.crop': 'Crop', // en-fallback
  'journey.studio.look': 'Look', // en-fallback
  'journey.studio.radius': 'Corner', // en-fallback
  'journey.studio.shape': 'Shape', // en-fallback
  'journey.studio.arrange': 'Arrange', // en-fallback
  'journey.studio.toFront': 'Bring to front', // en-fallback
  'journey.studio.forward': 'Bring forward', // en-fallback
  'journey.studio.backward': 'Send backward', // en-fallback
  'journey.studio.toBack': 'Send to back', // en-fallback
  'journey.studio.lock': 'Lock', // en-fallback
  'journey.studio.unlock': 'Unlock', // en-fallback
  'journey.studio.delete': 'Delete', // en-fallback
  'journey.studio.pageHint': 'Page', // en-fallback
  'journey.studio.boundHint': 'Follows the journal entry. Editing it here breaks that link.', // en-fallback
  'journey.studio.fit.cover': 'Fill', // en-fallback
  'journey.studio.fit.contain': 'Fit', // en-fallback
  'journey.studio.filter.none': 'Original', // en-fallback
  'journey.studio.filter.bw': 'Black & white', // en-fallback
  'journey.studio.filter.warm': 'Warm', // en-fallback
  'journey.studio.shapeKind.rect': 'Rectangle', // en-fallback
  'journey.studio.shapeKind.ellipse': 'Ellipse', // en-fallback
  'journey.studio.focalHint': 'Drag the point to choose what stays in frame.', // en-fallback
  'journey.studio.backCover': 'Back cover', // en-fallback
  'journey.studio.sections': 'Sections', // en-fallback
  'journey.studio.content': 'Content', // en-fallback
  'journey.studio.elements': 'Elements', // en-fallback
  'journey.studio.templates': 'Layouts', // en-fallback
  'journey.studio.photos': 'Photos', // en-fallback
  'journey.studio.entries': 'Entries', // en-fallback
  'journey.studio.addToPage': 'Add to this page', // en-fallback
  'journey.studio.noPhotos': 'This journey has no photos yet.', // en-fallback
  'journey.studio.untitled': 'Untitled', // en-fallback
  'journey.studio.addTitle': 'Title', // en-fallback
  'journey.studio.addStory': 'Story', // en-fallback
  'journey.studio.addPlace': 'Place', // en-fallback
  'journey.studio.shapes': 'Shapes', // en-fallback
  'journey.studio.frames': 'إطارات', // en-fallback
  'journey.studio.emptyFrame': 'Empty frame', // en-fallback
  'journey.studio.frameHint': 'An empty frame marks where a picture goes. Drop one on it from Content.', // en-fallback
  'journey.studio.shapeKind.line': 'Line', // en-fallback
  'journey.studio.styleTitle': 'Heading', // en-fallback
  'journey.studio.styleSubtitle': 'Subheading', // en-fallback
  'journey.studio.styleBody': 'Body text', // en-fallback
  'journey.studio.styleCaption': 'Caption', // en-fallback
  'journey.studio.sampleHeading': 'A heading', // en-fallback
  'journey.studio.sampleSubheading': 'A subheading', // en-fallback
  'journey.studio.sampleBody': 'Write something about this day.', // en-fallback
  'journey.studio.sampleCaption': 'Caption', // en-fallback
  'journey.studio.templatesCoverHint':
    'Layouts apply to the inside spreads. The cover and the back are designed on their own.', // en-fallback
  'journey.studio.tpl.heroStory': 'Hero and story', // en-fallback
  'journey.studio.tpl.fullBleed': 'One picture, full spread', // en-fallback
  'journey.studio.tpl.twoUp': 'Two full pages', // en-fallback
  'journey.studio.tpl.grid4': 'Four up', // en-fallback
  'journey.studio.tpl.grid6': 'Six up', // en-fallback
  'journey.studio.tpl.strip': 'Strip and text', // en-fallback
  'journey.studio.tpl.quietText': 'Text only', // en-fallback
  'journey.studio.tpl.portraitPair': 'A pair', // en-fallback
  'journey.studio.dropPhotoHere': 'اسحب صورتك\nوأفلتها هنا',
  'journey.studio.searchContent': 'Search photos and entries', // en-fallback
  'journey.studio.noMatches': 'Nothing matches that.', // en-fallback
  'journey.studio.decorations': 'Decoration', // en-fallback
  'journey.studio.quoteMark': 'Quotation mark', // en-fallback
  'journey.studio.circleOutline': 'Outlined circle', // en-fallback
  'journey.studio.roundFrame': 'Rounded frame', // en-fallback
  'journey.studio.shapeKind.rounded': 'Rounded rectangle', // en-fallback
  'journey.studio.shapeKind.triangle': 'Triangle', // en-fallback
  'journey.studio.shapeKind.outline': 'Outline only', // en-fallback
  'journey.studio.travel': 'الرحلة',
  'journey.studio.travelEmpty': 'أرقام هذه الرحلة ليست جاهزة بعد.',
  'journey.studio.grids': 'الشبكات',
  'journey.studio.gridHint': 'تضع الشبكة مجموعة من الإطارات الفارغة. اسحب الصور إليها من المحتوى.',
  'journey.studio.lines': 'الخطوط',
  'journey.studio.frameStyles': 'أنماط الإطار',
  'journey.studio.frameShapes': 'أشكال الإطار',
  'journey.studio.plainFrame': 'بسيط',
  'journey.studio.polaroidFrame': 'بولارويد',
  'journey.studio.whiteFrame': 'حافة بيضاء',
  'journey.studio.shadowFrame': 'ظل',
  'journey.studio.filmFrame': 'فيلم',
  'journey.studio.tapeFrame': 'بشريط لاصق',
  'journey.studio.shapeGroup.basic': 'أساسية',
  'journey.studio.shapeGroup.polygons': 'مضلعات',
  'journey.studio.shapeGroup.stars': 'نجوم',
  'journey.studio.shapeGroup.arrows': 'أسهم',
  'journey.studio.shapeGroup.speech': 'فقاعات كلام',
  'journey.studio.shapeGroup.travel': 'سفر',
  'journey.studio.shapeGroup.decor': 'زخرفة',
  'journey.studio.shapeGroup.banners': 'لافتات',
  'journey.studio.summary': 'الملخص',
  'journey.studio.tripSummary': 'ملخص الرحلة',
  'journey.studio.statsRow': 'صف واحد',
  'journey.studio.statsFull': 'كل شيء',
  'journey.studio.routeMap': 'خريطة المسار',
  'journey.studio.mapStyle.minimal': 'بسيط',
  'journey.studio.mapStyle.outline': 'مخطط',
  'journey.studio.mapStyle.paper': 'ورقي',
  'journey.studio.mapStyle.dark': 'داكن',
  'journey.studio.countries': 'الدول',
  'journey.studio.countryList': 'قائمة الدول',
  'journey.studio.countryGrid': 'شبكة الدول',
  'journey.studio.noCountries': 'لم تُحدَّد دول لهذه الرحلة بعد.',
  'journey.studio.noRoute': 'لا توجد محطات بإحداثيات بعد.',
  'journey.studio.marks': 'العلامات',
  'journey.studio.dateMark': 'التاريخ',
  'journey.studio.dayMark': 'عدّاد الأيام',
  'journey.studio.coordsMark': 'الإحداثيات',
  'journey.studio.coordsDms': 'درجات',
  'journey.studio.coordsDecimal': 'عشرية',
  'journey.studio.flagMark': 'العلم',
  'journey.studio.distanceMark': 'المسافة',
  'journey.studio.metric.distance': 'المسافة',
  'journey.studio.metric.days': 'الأيام',
  'journey.studio.metric.steps': 'المحطات',
  'journey.studio.metric.photos': 'الصور',
  'journey.studio.metric.countries': 'الدول',
  'journey.studio.metric.places': 'الأماكن',
  'journey.studio.metric.furthest': 'الأبعد',
  'journey.studio.kind.map': 'خريطة',
  'journey.studio.kind.stats': 'أرقام',
  'journey.studio.kind.countries': 'دول',
  'journey.studio.kind.badge': 'علامة',
  'journey.studio.kind.list': 'قائمة',
  'journey.studio.kind.icon': 'أيقونة',
  'journey.studio.duplicate': 'تكرار',
  'journey.studio.copyToPage': 'نسخ للصق في أي صفحة (Ctrl+C)',
  'journey.studio.paste': 'لصق (Ctrl+V)',
  'journey.studio.pasteEmpty': 'انسخ شيئًا أولًا، ثم الصقه في أي صفحة',
  'journey.studio.myLayouts': 'تخطيطاتي',
  'journey.studio.myLayoutsEmpty': 'احتفظ بصفحة رتّبتها، ورتّب صفحات أخرى بالطريقة نفسها. تبقى صورها ونصوصها كما هي.',
  'journey.studio.saveLayout': 'حفظ هذه الصفحة كتخطيط',
  'journey.studio.saveLayoutHint': 'يحتفظ بالترتيب دون الصور، لكل محرري هذا الكتاب',
  'journey.studio.saveLayoutFull': 'يحتفظ هذا الكتاب بما يصل إلى 24 تخطيطًا. احذف واحدًا لحفظ آخر.',
  'journey.studio.deleteLayout': 'حذف التخطيط',
  'journey.studio.layoutName': 'تخطيط',
  'journey.studio.builtInLayouts': 'مدمجة',
  'journey.studio.style': 'النمط',
  'journey.studio.shows': 'المعروض',
  'journey.studio.size': 'الحجم',
  'journey.studio.weight': 'الوزن',
  'journey.studio.italic': 'مائل',
  'journey.studio.tracking': 'تباعد الأحرف',
  'journey.studio.rotation': 'التدوير',
  'journey.studio.opacity': 'العتامة',
  'journey.studio.fill': 'التعبئة',
  'journey.studio.fillOn': 'معبّأ',
  'journey.studio.stroke': 'الإطار',
  'journey.studio.strokeWidth': 'السماكة',
  'journey.studio.gradient': 'التدرّج',
  'journey.studio.gradientDown': 'لأسفل',
  'journey.studio.gradientUp': 'لأعلى',
  'journey.studio.showIcons': 'الأيقونات',
  'journey.studio.mapFit': 'الملاءمة',
  'journey.studio.mapPadding': 'الهامش',
  'journey.studio.mapShape': 'الشكل',
  'journey.studio.align.left': 'يسار',
  'journey.studio.align.center': 'وسط',
  'journey.studio.align.right': 'يمين',
  'journey.studio.markStyle.plain': 'بسيط',
  'journey.studio.markStyle.chip': 'شريحة',
  'journey.studio.markStyle.outline': 'مفرّغ',
  'journey.studio.markStyle.stacked': 'عمودي',
  'journey.studio.icon': 'الأيقونة',
  'journey.studio.iconAndLabel': 'أيقونة ونص',
  'journey.studio.iconOnly': 'أيقونة فقط',
  'journey.studio.labelOnly': 'نص فقط',
  'journey.studio.icons': 'أيقونات',
  'journey.studio.iconsForTravel': 'للسفر',
  'journey.studio.iconsAll': 'كل الأيقونات',
  'journey.studio.searchIcons': 'بحث عن أيقونات',
  'journey.studio.lineWidth': 'السماكة',
  'journey.studio.mask': 'قص حسب الشكل',
  'journey.studio.maskNone': 'بدون',
  'journey.studio.frameStyle': 'إطار',
  'journey.studio.mapLayers': 'الطبقات',
  'journey.studio.showLand': 'الدول',
  'journey.studio.showRoute': 'المسار',
  'journey.studio.showPins': 'المحطات',
  'journey.studio.showLabels': 'التسميات',
  'journey.studio.units': 'الوحدات',
  'journey.studio.metrics': 'الأرقام',
  'journey.studio.layout': 'التخطيط',
  'journey.studio.layoutGrid': 'شبكة',
  'journey.studio.layoutRow': 'صف',
  'journey.studio.layoutColumn': 'عمود',
  'journey.studio.layoutList': 'قائمة',
  'journey.studio.showOutline': 'المخططات',
  'journey.studio.showFlag': 'الأعلام',
  'journey.studio.showName': 'الأسماء',
  'journey.studio.textScale': 'حجم النص',
  'journey.studio.accent': 'لون التمييز',
  'journey.studio.refresh': 'تحديث من الرحلة',
  'journey.studio.staleHint': 'تغيّرت الرحلة منذ أن أُخذت هذه الأرقام.',
  'journey.studio.align': 'المحاذاة',
  'journey.studio.filter.cool': 'بارد',
  'journey.studio.filter.fade': 'باهت',
  'journey.studio.filter.contrast': 'قوي',
  'journey.studio.strokeStyle': 'الحد',
  'journey.studio.strokeSolid': 'متصل',
  'journey.studio.strokeDashed': 'متقطع',
  'journey.studio.strokeDotted': 'منقّط',
  'journey.studio.singleFigures': 'أرقام مفردة',
  'journey.studio.addPage': 'إضافة صفحة',
  'journey.studio.addPageAfter': 'إدراج صفحة بعد هذه',
  'journey.studio.duplicatePage': 'تكرار الصفحة',
  'journey.studio.deletePage': 'حذف الصفحة',
  'journey.studio.movePageUp': 'نقل للأمام',
  'journey.studio.movePageDown': 'نقل للخلف',
  'journey.studio.beta': 'Beta',
  'journey.studio.addProsCons': 'Pros & Cons',
  'journey.studio.showMarks': 'علامات',
  'journey.studio.formatCustom': 'مقاس مخصص',
  'journey.studio.document': 'المستند',
  'journey.studio.pageNumbers': 'أرقام الصفحات',
  'journey.studio.pageNumbersOn': 'تشغيل',
  'journey.studio.pageNumbersOff': 'إيقاف',
  'journey.studio.folio.outer': 'خارجي',
  'journey.studio.folio.inner': 'داخلي',
  'journey.studio.folio.centre': 'وسط',
  'journey.studio.folioStart': 'يبدأ من',
  'journey.studio.folioMargin': 'الهامش',
  'journey.studio.relayoutSpread': 'هذه الصفحة',
  'journey.studio.relayoutSpreadHint': 'إعادة بنائها من مدخلها',
  'journey.studio.relayoutSpreadNone': 'هذه الصفحة ليست من مدخل',
  'journey.studio.relayoutBook': 'الكتاب كامل',
  'journey.studio.relayoutBookHint': 'يستبدل كل الصفحات — يمكن التراجع',
  'journey.studio.tpl.coverFull': 'بلا حواف',
  'journey.studio.tpl.coverBand': 'صورة وشريط',
  'journey.studio.tpl.coverWindow': 'بإطار',
  'journey.studio.tpl.coverQuiet': 'نص فقط',
  'journey.studio.tpl.coverHalf': 'نصفان',
  'journey.studio.tpl.fullText': 'صورة وقصة',
  'journey.studio.tpl.grid9': 'تسعة',
  'journey.studio.tpl.mosaic': 'فسيفساء',
  'journey.studio.tpl.bandQuote': 'كلمات في الوسط',
  'journey.studio.tpl.staggerFour': 'أربع متدرجة',
  'journey.studio.weightMissing': 'هذا الخط لا يوفر هذا الوزن',
  'journey.studio.mapSource': 'مصدر الخريطة',
  'journey.studio.mapSourceVector': 'المخططات',
  'journey.studio.mapSourceRelief': 'تضاريس',
  'journey.studio.mapSourceSatellite': 'قمر صناعي',
  'journey.studio.mapSourceSatelliteHint':
    'صور Sentinel-2 خالية من السحب، يمكن طباعتها بحرية مع ذكر المصدر. حادة حتى مستوى شارع في المدينة.',
  'journey.studio.routeLook': 'الخط',
  'journey.studio.routeStyle': 'الشكل',
  'journey.studio.routePlain': 'عادي',
  'journey.studio.routeDrawn': 'مرسوم',
  'journey.studio.routeArc': 'المراحل الطويلة',
  'journey.studio.routeStraight': 'مستقيمة',
  'journey.studio.routeBow': 'مقوّسة',
  'journey.studio.routeDashArcs': 'المقوّسة بخط متقطع',
  'journey.studio.mapStops': 'المحطات',
  'journey.studio.pinDot': 'نقاط',
  'journey.studio.pinPhoto': 'صور',
  'journey.studio.pinPhotoNone': 'لا توجد صور بعد على هذه المحطات، لذا تُرسم كنقاط.',
  'journey.studio.roads': 'الطرق',
  'journey.studio.roadsFetch': 'اتبع الطرق',
  'journey.studio.roadsFollow': 'عبر الطرق',
  'journey.studio.roadsDirect': 'خط مباشر',
  'journey.studio.recommended': 'موصى به',
  'journey.studio.bleed': 'الفيض',
  'journey.studio.safeArea': 'الآمنة',
  'journey.studio.roadsAgain': 'جلب من جديد',
  'journey.studio.roadsClear': 'مسح',
  'journey.studio.roadsBusy': 'جارٍ الجلب',
  'journey.studio.roadsHint': 'اطلب من خدمة توجيه الطريق الذي قُطعت به كل مرحلة. المراحل الطويلة تبقى كما هي.',
  'journey.studio.roadsHave': 'تُحفظ الطرق في هذا الكتاب، فيُطبع الخط نفسه دون اتصال.',
  'journey.studio.mapSourceReliefHint':
    'تضاريس ناسا المظللة، يمكن طباعتها بحرية. تناسب بلدًا أو قارة، وهي خشنة جدًا لمدينة واحدة.',
  'journey.studio.mapPrintDpi': 'تُطبع بنحو',
  'journey.studio.mapPrintDpiLow': 'غير حادة بهذا الحجم، جرّب عرضًا أوسع أو مصدرًا آخر',
  'journey.studio.mapPerTrip': 'رحلة واحدة في كل مرة',
  'journey.studio.mapWholeJourney': 'الرحلة كاملة',
  'journey.studio.mapScope': 'المعروض',
  'journey.studio.mapSourceTiles': 'بلاطات الخريطة',
  'journey.studio.mapSourceStatic': 'Mapbox',
  'journey.studio.mapSourceHint': 'تُجلب عند العرض وتُطبع مع إسنادها',
  'journey.studio.mapZoom': 'التقريب',
  'journey.studio.mapFraming': 'العرض',
  'journey.studio.mapFitStops': 'المحطات',
  'journey.studio.mapFitCountry': 'البلد كامل',
  'journey.studio.mapPadTight': 'ضيق',
  'journey.studio.mapPadNormal': 'عادي',
  'journey.studio.mapPadWide': 'واسع',
  'journey.studio.mapPadFar': 'واسع جدا',
  'journey.studio.mapClipRect': 'داخل إطار',
  'journey.studio.mapClipCountry': 'مقصوص',
  'journey.studio.mapClipNeedsCountry': 'يحتاج بلدا ليقص وفقه',
  'journey.studio.mapCutVector': 'مقصوص',
  'journey.studio.mapCutTiles': 'خريطة مقصوصة',
  'journey.studio.mapZoomAuto': 'ملائم',
  'journey.studio.saving': 'يجري الحفظ',
  'journey.studio.saved': 'تم الحفظ',
  'journey.studio.saveFailed': 'لم يُحفظ',
  'journey.studio.saveRetry': 'إعادة المحاولة',
  'journey.studio.saveConflict': 'حفظ شخص آخر هذا الكتاب',
  'journey.studio.saveTakeTheirs': 'نسختهم',
  'journey.studio.saveKeepMine': 'نسختي',
  'journey.studio.rotate': 'تدوير',
  'journey.studio.rotateLeft': 'تدوير لليسار',
  'journey.studio.rotateRight': 'تدوير لليمين',
  'journey.studio.saveReadOnly': 'للقراءة فقط، لا يتم الحفظ',
  'journey.studio.saveNewer': 'حفظ إصدار أحدث من Studio هذا الكتاب. أعد التحميل لتعديله.',
  'journey.studio.saveReload': 'إعادة التحميل',
  'journey.studio.filterPhotos': 'تصفية الصور',
  'journey.studio.filterAll': 'كل الصور',
  'journey.studio.filterLoose': 'ليست ضمن إدخال',
  'journey.studio.filterRecent': 'رُفعت للتو',
  'journey.studio.filterThisPage': 'هذه الصفحة',
  'journey.studio.entryPhotos': 'الصور',
  'journey.studio.noEntryPhotos': 'لا توجد صور في هذا الإدخال بعد.',
  'journey.studio.noLoosePhotos': 'كل صورة هنا تنتمي إلى إدخال.',
  'journey.studio.uploadPhotos': 'رفع الصور',
  'journey.studio.fromProvider': 'من {name}',
  'journey.studio.fromProviderHint': 'اختر صورًا من {name} وأضفها حيث يذهب الرفع',
  'journey.studio.uploadHint': 'أفلت الصور هنا أو انقر لاختيارها',
  'journey.studio.uploadToEntry': 'ستُضاف الصور الجديدة إلى هذا الإدخال',
  'journey.studio.uploadToGallery': 'ستُضاف الصور الجديدة إلى المعرض',
  'journey.studio.uploading': 'جارٍ رفع {done} من {total}',
  'journey.studio.dropFilesHere': 'أفلت لإضافة الصور',
  'journey.studio.videosSkipped': 'تم تجاهل {count} مقطع فيديو. الكتاب يحتوي على صور فقط.',
  'journey.studio.videosSkipped.zero': 'لم يتم تجاهل أي مقطع فيديو. الكتاب يحتوي على صور فقط.',
  'journey.studio.videosSkipped.one': 'تم تجاهل مقطع فيديو واحد. الكتاب يحتوي على صور فقط.',
  'journey.studio.videosSkipped.two': 'تم تجاهل مقطعَي فيديو. الكتاب يحتوي على صور فقط.',
  'journey.studio.videosSkipped.few': 'تم تجاهل {count} مقاطع فيديو. الكتاب يحتوي على صور فقط.',
  'journey.studio.videosSkipped.many': 'تم تجاهل {count} مقطع فيديو. الكتاب يحتوي على صور فقط.',
  'journey.studio.fillPage': 'ملء الصفحة',
  'journey.studio.fillSpread': 'ملء الصفحتين المتقابلتين',
  'journey.studio.fillHint': 'يمدّ الصورة على الصفحة كاملة بما في ذلك الفيض، ويضعها خلف كل شيء آخر.',
  'journey.studio.stops': 'المحطات',
  'journey.studio.stopsHint': 'كل محطة تُحتسب ضمن المسار والمسافة والدول. أوقف واحدة لاستبعادها، مثل مطار بلدك.',
  'journey.studio.stopOn': 'محتسبة',
  'journey.studio.stopOff': 'مستبعدة',
  'journey.studio.stopToggle': 'احتساب هذه المحطة',
  'journey.studio.stopsFailed': 'تعذّر تغيير المحطة.',
  'journey.editor.statsExcluded': 'استبعاد من المسار',
  'journey.editor.statsExcludedHint':
    'تبقى المحطة في اليوميات لكنها لا تُحتسب ضمن المسافة أو الدول أو الخريطة في Studio.',
  'journey.entry.offRoute': 'خارج المسار',
  'journey.entry.draft': 'مسودة',
  'journey.editor.draft': 'مسودة',
  'journey.editor.draftHint':
    'لا يرى هذا المدخل سواك وسوى المساهمين الآخرين. تستبعده اليوميات المشتركة حتى توقف هذا الخيار.',
  'journey.editor.tripSuggestionHint': 'يقع هذا اليوم ضمن هذه الرحلة. اربطه لتنضم أماكنها إلى هذه اليوميات.',
  'journey.editor.tripSuggestionLater': 'ليس الآن',
  'journey.suggestions.dismiss': 'تجاهل هذا الاقتراح',
  'journey.suggestions.dismissed': 'تم تجاهل الاقتراح',
  'journey.suggestions.restore': 'استعادة الاقتراحات المتجاهَلة',
  'journey.suggestions.restoreCount': 'الاقتراحات المتجاهَلة ({count})',
  'journey.suggestions.restoreCount.zero': 'الاقتراحات المتجاهَلة ({count})',
  'journey.suggestions.restoreCount.one': 'الاقتراحات المتجاهَلة ({count})',
  'journey.suggestions.restoreCount.two': 'الاقتراحات المتجاهَلة ({count})',
  'journey.suggestions.restoreCount.few': 'الاقتراحات المتجاهَلة ({count})',
  'journey.suggestions.restoreCount.many': 'الاقتراحات المتجاهَلة ({count})',
  'journey.suggestions.restored': 'تمت استعادة {count} اقتراح',
  'journey.suggestions.restored.zero': 'لم تتم استعادة أي اقتراح',
  'journey.suggestions.restored.one': 'تمت استعادة اقتراح واحد',
  'journey.suggestions.restored.two': 'تمت استعادة اقتراحين',
  'journey.suggestions.restored.few': 'تمت استعادة {count} اقتراحات',
  'journey.suggestions.restored.many': 'تمت استعادة {count} اقتراحًا',
  'journey.detail.addOnThisDay': 'إضافة مدخل في هذا اليوم',
  'journey.detail.jumpToDay': 'الانتقال إلى {date}',
  'journey.detail.searchPlaceholder': 'ابحث في هذه الرحلة',
  'journey.detail.searchEmpty': 'لا يوجد مدخل يطابق «{query}»',
  'journey.settings.entryFields': 'حقول المدخل',
  'journey.settings.entryFieldsHint': 'أوقف ما لا تستخدمه هذه الرحلة. لا يضيع شيء مما كُتب بالفعل.',
  'journey.settings.showVerdict': 'الإيجابيات والسلبيات',
  'journey.settings.showMood': 'المزاج',
  'journey.settings.showWeather': 'الطقس',
  'journey.entry.suggestion': 'اقتراح',
  'journey.editor.addDetails': '+ تفاصيل',
  'journey.recording.mapLine': 'سُجّل في {date}',
  'journey.recording.keptBy': 'تم حفظ المسار المسجّل: {distance}، نقله {name} في {date}.',
  'journey.recording.keptOn': 'تم حفظ المسار المسجّل: {distance}، نُقل في {date}.',
  'journey.recording.keptRunning': 'لم يكن اليوم قد انتهى بعد حينها.',
  'journey.recording.takeOver': 'نقل التسجيل',
  'journey.recording.takeOverDay': 'تسجيل {date}',
  'journey.recording.sub': 'هذا اليوم فقط، من حسابك في Dawarich. لا يُحفظ شيء حتى تؤكد.',
  'journey.recording.zone': 'المنطقة الزمنية لليوم',
  'journey.recording.zoneHint':
    'يمتد اليوم في هذه المنطقة من منتصف الليل إلى منتصف الليل. اختر المنطقة التي كنت تسافر فيها.',
  'journey.recording.zoneSource': 'من Dawarich',
  'journey.recording.zoneDevice': 'هذا الجهاز',
  'journey.recording.scope': 'التسجيل',
  'journey.recording.loading': 'جارٍ قراءة اليوم من Dawarich…',
  'journey.recording.keptStays': 'يبقى المسار المحفوظ في هذه الرحلة كما هو.',
  'journey.recording.retry': 'أعد المحاولة',
  'journey.recording.empty': 'لم يسجّل Dawarich شيئًا في هذا اليوم في هذه المنطقة الزمنية.',
  'journey.recording.span': 'من {from} إلى {to}',
  'journey.recording.pieces': '{count} مقطع',
  'journey.recording.pieces.zero': 'لا مقاطع',
  'journey.recording.pieces.one': 'مقطع واحد',
  'journey.recording.pieces.two': 'مقطعان',
  'journey.recording.pieces.few': '{count} مقاطع',
  'journey.recording.pieces.many': '{count} مقطعًا',
  'journey.recording.gaps': '{count} انقطاع',
  'journey.recording.gaps.zero': 'لا انقطاعات',
  'journey.recording.gaps.one': 'انقطاع واحد',
  'journey.recording.gaps.two': 'انقطاعان',
  'journey.recording.gaps.few': '{count} انقطاعات',
  'journey.recording.gaps.many': '{count} انقطاعًا',
  'journey.recording.gapsHint': 'حيث يتوقف التسجيل يتوقف الخط أيضًا. لا يُرسم أي طريق لم يُسجَّل.',
  'journey.recording.sourceHint':
    'المسارات هي طرق قسّمها Dawarich حسب وسيلة التنقل. النقاط هي مواقعه الخام، مخففة إلى 600 في اليوم.',
  'journey.recording.sourceTracks': 'مسارات',
  'journey.recording.sourcePoints': 'نقاط',
  'journey.recording.changedSincePreview': 'تغيّر التسجيل في Dawarich أثناء مشاهدتك له. راجعه مرة أخرى ثم احفظه.',
  'journey.recording.truncated': 'أرسل Dawarich جزءًا فقط من هذا اليوم، فالمسار غير مكتمل.',
  'journey.recording.provisional':
    'لم ينتهِ هذا اليوم بعد في هذه المنطقة الزمنية. يمكنك لاحقًا استبدال المسار باليوم كاملًا.',
  'journey.recording.same': 'هذه الرحلة تحفظ هذا التسجيل نفسه بالفعل.',
  'journey.recording.differs':
    'هذه الرحلة تحفظ نسخة أخرى من {date} ({distance}). الاستبدال لا يغيّر أي إدخالات أو نصوص.',
  'journey.recording.audience': 'سيرى {count} شخص آخر في هذه الرحلة المسار على خريطتها. الروابط المشتركة لا تعرضه.',
  'journey.recording.audience.zero': 'لن يرى أحد آخر في هذه الرحلة المسار على خريطتها. الروابط المشتركة لا تعرضه.',
  'journey.recording.audience.one': 'سيرى شخص آخر واحد في هذه الرحلة المسار على خريطتها. الروابط المشتركة لا تعرضه.',
  'journey.recording.audience.two': 'سيرى شخصان آخران في هذه الرحلة المسار على خريطتها. الروابط المشتركة لا تعرضه.',
  'journey.recording.audience.few':
    'سيرى {count} أشخاص آخرين في هذه الرحلة المسار على خريطتها. الروابط المشتركة لا تعرضه.',
  'journey.recording.audience.many':
    'سيرى {count} شخصًا آخر في هذه الرحلة المسار على خريطتها. الروابط المشتركة لا تعرضه.',
  'journey.recording.replace': 'استبدال',
  'journey.recording.alreadyKept': 'محفوظ بالفعل',
  'journey.recording.keep': 'حفظ المسار',
  'journey.recording.remove': 'إزالة المسار',
  'journey.recording.removeTitle': 'إزالة المسار المحفوظ؟',
  'journey.recording.removeMessage':
    'يختفي مسار هذا اليوم من خريطة الرحلة. تبقى الإدخالات والنصوص، ويحتفظ Dawarich بتسجيله الخاص.',
  'journey.recording.keptToast': 'تم حفظ المسار في الرحلة',
  'journey.recording.replacedToast': 'تم استبدال المسار',
  'journey.recording.removedToast': 'تمت إزالة المسار من الرحلة',
  'journey.recording.error.recording_exists': 'هذه الرحلة تحفظ بالفعل تسجيلًا آخر لذلك اليوم.',
  'journey.recording.error.recording_changed': 'تغيّر التسجيل منذ المعاينة.',
  'journey.recording.error.recording_empty': 'لم يسجّل Dawarich شيئًا في ذلك اليوم.',
  'journey.recording.mode.walking': 'مشيًا',
  'journey.recording.mode.running': 'جري',
  'journey.recording.mode.cycling': 'دراجة',
  'journey.recording.mode.driving': 'سيارة',
  'journey.recording.mode.motorcycle': 'دراجة نارية',
  'journey.recording.mode.bus': 'حافلة',
  'journey.recording.mode.train': 'قطار',
  'journey.recording.mode.flying': 'رحلة جوية',
  'journey.recording.mode.boat': 'قارب',
  'journey.recording.mode.stationary': 'ثابت',
  'journey.recording.mode.unknown': 'وسيلة غير معروفة',
  'journey.dayImport.open': 'استيراد اليوم',
  'journey.dayImport.openHint': 'استيراد هذا اليوم مع محطات توقفه',
  'journey.dayImport.openOn': 'استيراد {date} مع محطات التوقف',
  'journey.dayImport.pending': '{count} محطة توقف للمراجعة',
  'journey.dayImport.pending.zero': 'لا محطات توقف للمراجعة',
  'journey.dayImport.pending.one': 'محطة توقف واحدة للمراجعة',
  'journey.dayImport.pending.two': 'محطتا توقف للمراجعة',
  'journey.dayImport.pending.few': '{count} محطات توقف للمراجعة',
  'journey.dayImport.pending.many': '{count} محطة توقف للمراجعة',
  'journey.dayImport.sub': 'محطات توقفك من Dawarich في هذا اليوم. اخترها وأعد تسميتها وادمجها؛ لتصبح مسودات.',
  'journey.dayImport.loading': 'جارٍ قراءة محطات توقف اليوم من Dawarich…',
  'journey.dayImport.map': 'اليوم على الخريطة',
  'journey.dayImport.stays': 'محطات التوقف',
  'journey.dayImport.modeEntries': 'إدخالات',
  'journey.dayImport.modeReport': 'تقرير اليوم',
  'journey.dayImport.reportDefault': 'يوم {date}',
  'journey.dayImport.reportHint':
    'تصبح كل محطات التوقف المختارة إدخالًا واحدًا يسردها مع أوقاتها. يبقى كل مكان محفوظًا للخريطة.',
  'journey.dayImport.reportNeedsTwo': 'اختر محطتي توقف أو أكثر لتقرير اليوم.',
  'journey.dayImport.groupTitle': 'عنوان الإدخال',
  'journey.dayImport.groupPin': 'الموقع على الخريطة',
  'journey.dayImport.noPin': 'بلا موقع على الخريطة',
  'journey.dayImport.join': 'دمج في إدخال واحد',
  'journey.dayImport.split': 'إبقاؤها منفصلة',
  'journey.dayImport.choose': 'استيراد {name}',
  'journey.dayImport.name': 'اسم {name}',
  'journey.dayImport.unconfirmed': 'غير مؤكدة',
  'journey.dayImport.noPlace': 'بلا موقع',
  'journey.dayImport.noPlaceHint': 'لم يسجّل Dawarich موقعًا لمحطة التوقف هذه، لذلك لا يظهر إدخالها على الخريطة.',
  'journey.dayImport.statusHere': 'في {title}',
  'journey.dayImport.statusHereUntitled': 'في اليوميات',
  'journey.dayImport.statusElsewhere': 'مستوردة',
  'journey.dayImport.statusElsewhereHint': 'سبق استيرادها كمكان أو أمنية أو إلى يوميات أخرى.',
  'journey.dayImport.statusSkipped': 'مستبعدة',
  'journey.dayImport.keepRoute': 'احفظ مسار اليوم أيضًا',
  'journey.dayImport.keepRouteHint': 'تم تسجيل {distance}. يراه كل من في الرحلة على الخريطة.',
  'journey.dayImport.routeNone': 'لم يسجّل Dawarich أي مسار في هذا اليوم.',
  'journey.dayImport.routeKept': 'تم حفظ المسار',
  'journey.dayImport.routeDiffers': 'لدى Dawarich الآن نسخة أخرى من المسار. استبدلها بزر مسار اليوم.',
  'journey.dayImport.existing': 'موجود في هذا اليوم',
  'journey.dayImport.untitled': 'إدخال بلا عنوان',
  'journey.dayImport.draft': 'مسودة',
  'journey.dayImport.audience': 'لا تظهر المسودات في الروابط المشتركة. يراها {count} شخص آخر في هذه الرحلة.',
  'journey.dayImport.audience.zero': 'لا تظهر المسودات في الروابط المشتركة. لا يراها أحد آخر في هذه الرحلة.',
  'journey.dayImport.audience.one': 'لا تظهر المسودات في الروابط المشتركة. يراها شخص آخر واحد في هذه الرحلة.',
  'journey.dayImport.audience.two': 'لا تظهر المسودات في الروابط المشتركة. يراها شخصان آخران في هذه الرحلة.',
  'journey.dayImport.audience.few': 'لا تظهر المسودات في الروابط المشتركة. يراها {count} أشخاص آخرين في هذه الرحلة.',
  'journey.dayImport.audience.many': 'لا تظهر المسودات في الروابط المشتركة. يراها {count} شخصًا آخر في هذه الرحلة.',
  'journey.dayImport.draftsNote': 'لا تظهر المسودات في الروابط المشتركة حتى تنشرها. أضف الصور والنص لاحقًا.',
  'journey.dayImport.submit': 'استيراد {count} مسودة',
  'journey.dayImport.submit.zero': 'لا مسودات للاستيراد',
  'journey.dayImport.submit.one': 'استيراد مسودة واحدة',
  'journey.dayImport.submit.two': 'استيراد مسودتين',
  'journey.dayImport.submit.few': 'استيراد {count} مسودات',
  'journey.dayImport.submit.many': 'استيراد {count} مسودة',
  'journey.dayImport.skipped': '{count} مستبعدة',
  'journey.dayImport.skipped.zero': 'لا شيء مستبعد',
  'journey.dayImport.skipped.one': 'واحدة مستبعدة',
  'journey.dayImport.skipped.two': 'اثنتان مستبعدتان',
  'journey.dayImport.skipped.few': '{count} مستبعدات',
  'journey.dayImport.skipped.many': '{count} مستبعدة',
  'journey.dayImport.skipHint':
    'لم تعد محطات التوقف المستبعدة معلّقة في هذا اليوم. يمكنك استعادتها من قائمة محطات توقف Dawarich.',
  'journey.dayImport.problem.nothing': 'اختر محطة توقف واحدة على الأقل.',
  'journey.dayImport.problem.name': 'تحتاج كل محطة توقف مختارة إلى اسم.',
  'journey.dayImport.problem.title': 'يحتاج كل إدخال مدمج وتقرير اليوم إلى عنوان.',
  'journey.dayImport.done': 'تم استيراد {count} مسودة',
  'journey.dayImport.done.zero': 'لم تُستورد أي مسودة',
  'journey.dayImport.done.one': 'تم استيراد مسودة واحدة',
  'journey.dayImport.done.two': 'تم استيراد مسودتين',
  'journey.dayImport.done.few': 'تم استيراد {count} مسودات',
  'journey.dayImport.done.many': 'تم استيراد {count} مسودة',
  'journey.dayImport.alreadyTaken': 'كانت {count} محطة توقف قد نُقلت من قبل. لم يُكتب شيء مرتين.',
  'journey.dayImport.alreadyTaken.zero': 'لم تكن أي محطة توقف قد نُقلت من قبل. لم يُكتب شيء مرتين.',
  'journey.dayImport.alreadyTaken.one': 'كانت محطة توقف واحدة قد نُقلت من قبل. لم يُكتب شيء مرتين.',
  'journey.dayImport.alreadyTaken.two': 'كانت محطتا توقف قد نُقلتا من قبل. لم يُكتب شيء مرتين.',
  'journey.dayImport.alreadyTaken.few': 'كانت {count} محطات توقف قد نُقلت من قبل. لم يُكتب شيء مرتين.',
  'journey.dayImport.alreadyTaken.many': 'كانت {count} محطة توقف قد نُقلت من قبل. لم يُكتب شيء مرتين.',
  'journey.dayImport.failed':
    'لم يُستورد شيء: {reason} تعرض القائمة ما تحتويه اليوميات الآن؛ المحاولة مجددًا لا تكتب شيئًا مرتين.',
  'journey.dayImport.routeFailed': 'أُنشئت المسودات، لكن المسار لم يُحفظ: {reason}',
  'journey.dayImport.routeRetry': 'احفظ المسار مجددًا',
  'journey.dayImport.stale': 'لم يستجب Dawarich: {reason} تُعرض محطات التوقف من آخر مزامنة في {date}.',
  'journey.dayImport.staleNever': 'لم يستجب Dawarich: {reason} تُعرض محطات التوقف التي يعرفها TREK بالفعل.',
  'journey.dayImport.truncated': 'أرسل Dawarich جزءًا من هذا اليوم فقط. قد تكون بعض محطات التوقف مفقودة.',
  'journey.dayImport.empty': 'لم يجد Dawarich أي محطات توقف في هذا اليوم.',
  'journey.prep.lastSuccess': 'آخر جلب {time}.',
  'journey.prep.never': 'لم يتم الجلب بعد. ستبدأ المزامنة التالية في الخلفية ذلك.',
  'journey.prep.failed': 'فشل التحديث الأخير: {reason} يُعرض ما جُلب {time}.',
  'journey.prep.failedNever': 'فشل الجلب الأول: {reason}',
  'journey.prep.notConnected': 'اربط Dawarich في إعداداتك حتى يمكن تحضير أيامك.',
  'journey.prep.noPeriods': 'اربط رحلة لها تواريخ: تُحضَّر أيامها فقط.',
  'journey.prep.syncOff': 'المزامنة في الخلفية متوقفة في إعدادات Dawarich، لذا تُجلب الأيام فقط عندما تطلب ذلك.',
  'journey.prep.fetchNow': 'اجلب الآن',
  'journey.prep.fetching': 'جارٍ الجلب…',
  'journey.prep.fetchFailed': 'تعذّر سؤال Dawarich الآن.',
  'journey.prep.dayRunning': 'اليوم لم ينتهِ بعد، قد تتبعه محطات توقف أخرى.',
  'journey.prep.dayPending': 'لم يتم الجلب بعد.',
  'journey.prep.dayProvisional': 'جُلب {time} قبل انتهاء اليوم، لذا قد تكون بعض محطات التوقف مفقودة.',
  'journey.prep.dayFailed': 'فشل التحديث الأخير، هذه هي الحالة الأقدم.',
  'journey.prep.outOfReach':
    'الرحلات التي انتهت قبل أكثر من {count} يوم لا تُجهَّز في الخلفية. افتح أحد أيامها لجلبه يدويًا.',
  'journey.prep.outOfReach.zero':
    'الرحلات التي انتهت قبل أكثر من {count} يوم لا تُجهَّز في الخلفية. افتح أحد أيامها لجلبه يدويًا.',
  'journey.prep.outOfReach.one':
    'الرحلات التي انتهت قبل أكثر من يوم واحد لا تُجهَّز في الخلفية. افتح أحد أيامها لجلبه يدويًا.',
  'journey.prep.outOfReach.two':
    'الرحلات التي انتهت قبل أكثر من يومين لا تُجهَّز في الخلفية. افتح أحد أيامها لجلبه يدويًا.',
  'journey.prep.outOfReach.few':
    'الرحلات التي انتهت قبل أكثر من {count} أيام لا تُجهَّز في الخلفية. افتح أحد أيامها لجلبه يدويًا.',
  'journey.prep.outOfReach.many':
    'الرحلات التي انتهت قبل أكثر من {count} يومًا لا تُجهَّز في الخلفية. افتح أحد أيامها لجلبه يدويًا.',
  'journey.prep.alreadyRunning': 'هناك عملية جلب جارية بالفعل في الخلفية. ستظهر محطات التوقف بمجرد انتهائها.',
  'journey.dayImport.running': 'هذا اليوم لم ينتهِ بعد. تظهر محطات التوقف المسجلة لاحقًا بمجرد أن تصل إلى Dawarich.',
  'journey.map.layers': 'طبقات الخريطة',
  'journey.map.layer.plan': 'الخطة',
  'journey.map.layer.recorded': 'المسجَّل',
  'journey.map.layer.entries': 'التدوينات',
  'journey.map.layer.photos': 'الصور',
  'journey.map.layer.loading': 'جارٍ التحميل',
  'journey.map.layer.planEmpty': 'لا تحتوي الرحلات المرتبطة على أماكن في أيامها',
  'journey.map.layer.planUnavailable': 'تعذّر تحميل الخطة، ويبقى باقي الخريطة ظاهرًا',
  'journey.map.layer.recordedEmpty': 'لا يوجد مسار مسجَّل بعد',
  'journey.map.layer.recordedUnavailable': 'تعذّر تحميل الأيام المسجَّلة',
  'journey.map.layer.entriesEmpty': 'لا تملك أي تدوينة مكانًا بعد',
  'journey.map.layer.entriesUnavailable': 'تعذّر تحميل محطات تقارير الأيام، وتبقى التدوينات ظاهرة',
  'journey.map.layer.photosEmpty': 'لا توجد صورة بموقع بعد',
  'journey.map.legend': 'مفتاح الخريطة',
  'journey.map.legend.planned': 'مكان مخطَّط',
  'journey.map.legend.entry': 'تدوينة في اليوميات',
  'journey.map.legend.plannedWritten': 'مخطَّط ومكتوب عنه',
  'journey.map.legend.stay': 'محطة في تقرير يومي',
  'journey.map.legend.several': 'عدة عناصر في نقطة واحدة',
  'journey.map.legend.lines': 'المسارات',
  'journey.map.legend.plannedRoute': 'مسار مخطَّط (GPX لرحلة)',
  'journey.map.legend.recordedRoute': 'مسار مسجَّل',
  'journey.map.legend.planIsNoVisit':
    'المكان المخطَّط ليس دليلًا على الزيارة. وحدها التدوينات والصور والتسجيلات تُظهر أين كنت.',
  'journey.map.pick.openEntry': 'فتح التدوينة',
  'journey.map.pick.planned': 'مخطَّط',
  'journey.map.pick.notWritten': 'لم يُكتب عنه شيء بعد.',
  'journey.map.pick.stay': 'محطة',
  'journey.map.pick.partOf': 'جزء من «{title}»',
  'journey.map.pick.here': 'في هذه النقطة',
  'journey.map.pick.back': 'العودة إلى القائمة',
  'journey.map.pick.timeRange': 'من {from} إلى {to}',
  'journey.share.plan': 'خطة الرحلة',
  'journey.share.planHint': 'الأماكن المخطَّطة ومسارات GPX للرحلات المرتبطة على الخريطة',
  'journey.share.recordings': 'المسارات المسجَّلة',
  'journey.share.recordingsHint':
    'الأيام المسجَّلة ومحطات التوقف المأخوذة منها، للأيام التي لها تدوينة منشورة. تُظهر أين كنت ومتى، بما في ذلك مكان إقامتك.',
  'journey.share.needsMap': 'شارك الخريطة لتفعيل هذا',
  'journey.editor.tags': 'الوسوم',
  'journey.studio.assistant.toggle': 'المساعد',
  'journey.studio.assistant.toggleHint': 'صمّم الكتاب مع المساعد',
  'journey.studio.assistant.panel': 'مساعد الكتاب',
  'journey.studio.assistant.welcome': 'كيف تريد أن يبدو الكتاب؟',
  'journey.studio.assistant.readOnly': 'يمكنك عرض هذا الكتاب فقط، لذا أستطيع الإجابة عن الأسئلة لكن لا أغيّر شيئًا.',
  'journey.studio.assistant.notice':
    'يمكن للمساعد رؤية الصفحة التي تعمل عليها. تُرسل هذه الصفحة وحدها إلى {provider} كصورة لا تظهر فيها إلا الصور التي أضفتها بنفسك. لا يمكن التعرّف على من يظهر في صورك.',
  'journey.studio.assistant.noticeAllow': 'اعرض الصفحات',
  'journey.studio.assistant.noticeLater': 'ليس الآن',
};
export default journey;
