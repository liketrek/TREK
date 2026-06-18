import type { TranslationStrings } from '../types';

const journey: TranslationStrings = {
  'journey.search.placeholder': 'البحث في الرحلات…',
  'journey.search.noResults': 'لا توجد رحلات تطابق "{query}"',
  'journey.status.archived': 'مؤرشف',
  'journey.detail.backToJourney': 'العودة للمجلة',
  'journey.detail.photos': 'صور',
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
  'journey.photosUploaded': 'تم رفع {count} صورة',
  'journey.photosUploadFailed': 'فشل رفع بعض الصور',
  'journey.photosAdded': 'تمت إضافة {count} صورة',
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
  'journey.frontpage.allJourneys': 'All Journeys', // en-fallback
  'journey.frontpage.journeys': 'journeys', // en-fallback
  'journey.frontpage.createNew': 'Create a new Journey', // en-fallback
  'journey.frontpage.createNewSub': 'Pick trips, write stories, share your adventures', // en-fallback
  'journey.frontpage.live': 'Live', // en-fallback
  'journey.frontpage.synced': 'Synced', // en-fallback
  'journey.frontpage.continueWriting': 'Continue writing', // en-fallback
  'journey.frontpage.updated': 'Updated {time}', // en-fallback
  'journey.frontpage.suggestionLabel': 'Trip just ended', // en-fallback
  'journey.frontpage.suggestionText': 'Turn <strong>{title}</strong> into a Journey', // en-fallback
  'journey.frontpage.dismiss': 'Dismiss', // en-fallback
  'journey.frontpage.journeyName': 'Journey Name', // en-fallback
  'journey.frontpage.namePlaceholder': 'e.g. Southeast Asia 2026', // en-fallback
  'journey.frontpage.selectTrips': 'Select Trips', // en-fallback
  'journey.frontpage.tripsSelected': 'trips selected', // en-fallback
  'journey.frontpage.trips': 'trips', // en-fallback
  'journey.frontpage.placesImported': 'places will be imported', // en-fallback
  'journey.frontpage.places': 'places', // en-fallback
  'journey.detail.syncedWithTrips': 'Synced with Trips', // en-fallback
  'journey.detail.addEntry': 'Add Entry', // en-fallback
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
  'journey.synced.places': 'places', // en-fallback
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
};
export default journey;
