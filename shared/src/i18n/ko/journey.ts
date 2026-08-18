import type { TranslationStrings } from '../types';

const journey: TranslationStrings = {
  'journey.search.placeholder': 'Journey 검색…',
  'journey.search.noResults': '"{query}"와(과) 일치하는 Journey가 없습니다',
  'journey.title': 'Journey',
  'journey.subtitle': '여행을 실시간으로 기록하세요',
  'journey.new': '새 Journey',
  'journey.create': '만들기',
  'journey.titlePlaceholder': '어디로 가시나요?',
  'journey.empty': '아직 Journey가 없습니다',
  'journey.emptyHint': '다음 여행을 기록하기 시작하세요',
  'journey.deleted': 'Journey가 삭제되었습니다',
  'journey.createError': 'Journey를 만들 수 없습니다',
  'journey.deleteError': 'Journey를 삭제할 수 없습니다',
  'journey.deleteConfirmTitle': '삭제',
  'journey.deleteConfirmMessage': '"{title}"을(를) 삭제할까요? 이 작업은 취소할 수 없습니다.',
  'journey.deleteConfirmGeneric': '정말로 삭제할까요?',
  'journey.notFound': 'Journey를 찾을 수 없습니다',
  'journey.photos': '사진',
  'journey.timelineEmpty': '아직 정류장이 없습니다',
  'journey.timelineEmptyHint': '체크인을 추가하거나 일기를 작성하여 시작하세요',
  'journey.status.draft': '초안',
  'journey.status.active': '활성',
  'journey.status.completed': '완료됨',
  'journey.status.upcoming': '예정됨',
  'journey.status.archived': '보관됨',
  'journey.checkin.add': '체크인',
  'journey.checkin.namePlaceholder': '위치 이름',
  'journey.checkin.notesPlaceholder': '메모 (선택)',
  'journey.checkin.save': '저장',
  'journey.checkin.error': '체크인을 저장할 수 없습니다',
  'journey.entry.add': '일기',
  'journey.entry.edit': '항목 편집',
  'journey.entry.titlePlaceholder': '제목 (선택)',
  'journey.entry.bodyPlaceholder': '오늘 무슨 일이 있었나요?',
  'journey.entry.save': '저장',
  'journey.entry.error': '항목을 저장할 수 없습니다',
  'journey.photo.add': '사진',
  'journey.photo.uploadError': '업로드 실패',
  'journey.share.share': '공유',
  'journey.share.public': '공개',
  'journey.share.linkCopied': '공개 링크가 복사되었습니다',
  'journey.share.disabled': '공개 공유 비활성화됨',
  'journey.editor.titlePlaceholder': '이 순간에 이름을 붙여주세요...',
  'journey.editor.bodyPlaceholder': '오늘의 이야기를 들려주세요...',
  'journey.editor.placePlaceholder': '위치 (선택)',
  'journey.editor.tagsPlaceholder': '태그: 숨겨진 명소, 최고의 식사, 다시 방문...',
  'journey.visibility.private': '비공개',
  'journey.visibility.shared': '공유됨',
  'journey.visibility.public': '공개',
  'journey.emptyState.title': '여기서 이야기가 시작됩니다',
  'journey.emptyState.subtitle': '장소에 체크인하거나 첫 번째 일기 항목을 작성하세요',
  'journey.frontpage.subtitle': '여행을 영원히 잊지 못할 이야기로 만드세요',
  'journey.frontpage.createJourney': 'Journey 만들기',
  'journey.frontpage.activeJourney': '활성 Journey',
  'journey.frontpage.latestJourney': '최근 Journey',
  'journey.frontpage.allJourneys': '모든 Journey',
  'journey.frontpage.journeys': '개 Journey',
  'journey.frontpage.createNew': '새 Journey 만들기',
  'journey.frontpage.createNewSub': '여행을 선택하고, 이야기를 쓰고, 모험을 공유하세요',
  'journey.frontpage.live': '라이브',
  'journey.frontpage.synced': '동기화됨',
  'journey.frontpage.continueWriting': '계속 쓰기',
  'journey.frontpage.updated': '{time}에 업데이트됨',
  'journey.frontpage.suggestionLabel': '여행이 방금 종료됨',
  'journey.frontpage.suggestionText': '<strong>{title}</strong>을(를) Journey로 만들어보세요',
  'journey.frontpage.dismiss': '닫기',
  'journey.frontpage.journeyName': 'Journey 이름',
  'journey.frontpage.namePlaceholder': '예: 동남아시아 2026',
  'journey.frontpage.selectTrips': '여행 선택',
  'journey.frontpage.tripsSelected': '개 여행 선택됨',
  'journey.frontpage.trips': '개 여행',
  'journey.frontpage.placesImported': '개 장소가 가져와집니다',
  'journey.frontpage.places': '개 장소',
  'journey.detail.backToJourney': 'Journey로 돌아가기',
  'journey.detail.syncedWithTrips': '여행과 동기화됨',
  'journey.detail.addEntry': '항목 추가',
  'journey.detail.jumpToTop': '맨 위로',
  'journey.detail.jumpToLast': '마지막 기록으로',
  'journey.detail.newEntry': '새 항목',
  'journey.detail.editEntry': '항목 편집',
  'journey.detail.noEntries': '아직 항목이 없습니다',
  'journey.detail.noEntriesHint': '여행을 추가하여 스켈레톤 항목으로 시작하세요',
  'journey.detail.noPhotos': '아직 사진이 없습니다',
  'journey.detail.noPhotosHint': '항목에 사진을 업로드하거나 Immich/Synology 라이브러리를 탐색하세요',
  'journey.detail.journeyTab': 'Journey',
  'journey.detail.journeyStats': 'Journey 통계',
  'journey.detail.syncedTrips': '동기화된 여행',
  'journey.detail.noTripsLinked': '아직 연결된 여행이 없습니다',
  'journey.detail.contributors': '기여자',
  'journey.detail.readMore': '더 읽기',
  'journey.detail.prosCons': '장단점',
  'journey.detail.photos': '장',
  'journey.detail.day': '{number}일차',
  'journey.detail.places': '개 장소',
  'journey.stats.days': '일',
  'journey.stats.cities': '도시',
  'journey.stats.entries': '항목',
  'journey.stats.photos': '사진',
  'journey.stats.places': '장소',
  'journey.skeletons.show': '제안 보기',
  'journey.skeletons.hide': '제안 숨기기',
  'journey.verdict.lovedIt': '정말 좋았어요',
  'journey.verdict.couldBeBetter': '더 좋을 수 있었어요',
  'journey.synced.places': '개 장소',
  'journey.synced.synced': '동기화됨',
  'journey.editor.discardChangesConfirm': '저장되지 않은 변경 사항이 있습니다. 취소할까요?',
  'journey.editor.uploadPhotos': '사진 업로드',
  'journey.editor.uploading': '업로드 중...',
  'journey.editor.fromGallery': '갤러리에서',
  'journey.editor.allPhotosAdded': '모든 사진이 이미 추가되었습니다',
  'journey.editor.writeStory': '이야기를 써주세요...',
  'journey.editor.prosCons': '장단점',
  'journey.editor.pros': '장점',
  'journey.editor.cons': '단점',
  'journey.editor.proPlaceholder': '좋은 점...',
  'journey.editor.conPlaceholder': '아쉬운 점...',
  'journey.editor.addAnother': '하나 더 추가',
  'journey.editor.date': '날짜',
  'journey.editor.location': '위치',
  'journey.editor.searchLocation': '위치 검색...',
  'journey.editor.mood': '기분',
  'journey.editor.weather': '날씨',
  'journey.editor.photoFirst': '1번째',
  'journey.editor.makeFirst': '1번째로 설정',
  'journey.editor.searching': '검색 중...',
  'journey.editor.useCurrentLocation': '현재 위치 사용',
  'journey.editor.locationPermissionDenied': '위치 접근이 거부되었습니다. 브라우저 설정에서 허용한 후 다시 시도하세요.',
  'journey.editor.locationTimeout': '위치를 가져오는 데 시간이 초과되었습니다. 다시 시도하세요.',
  'journey.editor.locationUnavailable': '위치를 확인할 수 없습니다.',
  'journey.editor.locationInsecureContext': '위치 기능에는 보안 연결(HTTPS)이 필요합니다.',
  'journey.mood.amazing': '최고!',
  'journey.mood.good': '좋음',
  'journey.mood.neutral': '보통',
  'journey.mood.rough': '힘들었음',
  'journey.weather.sunny': '맑음',
  'journey.weather.partly': '구름 조금',
  'journey.weather.cloudy': '흐림',
  'journey.weather.rainy': '비',
  'journey.weather.stormy': '폭풍',
  'journey.weather.cold': '눈',
  'journey.trips.linkTrip': '여행 연결',
  'journey.trips.searchTrip': '여행 검색',
  'journey.trips.searchPlaceholder': '여행 이름 또는 목적지...',
  'journey.trips.noTripsAvailable': '사용 가능한 여행이 없습니다',
  'journey.trips.link': '연결',
  'journey.trips.tripLinked': '여행이 연결되었습니다',
  'journey.trips.linkFailed': '여행 연결 실패',
  'journey.trips.addTrip': '여행 추가',
  'journey.trips.unlinkTrip': '여행 연결 해제',
  'journey.trips.unlinkMessage':
    '"{title}"을(를) 연결 해제할까요? 이 여행의 동기화된 모든 항목과 사진이 영구 삭제됩니다. 이 작업은 취소할 수 없습니다.',
  'journey.trips.unlink': '연결 해제',
  'journey.trips.tripUnlinked': '여행 연결이 해제되었습니다',
  'journey.trips.unlinkFailed': '여행 연결 해제 실패',
  'journey.trips.noTripsLinkedSettings': '연결된 여행이 없습니다',
  'journey.contributors.invite': '기여자 초대',
  'journey.contributors.searchUser': '사용자 검색',
  'journey.contributors.searchPlaceholder': '사용자 이름 또는 이메일...',
  'journey.contributors.noUsers': '사용자를 찾을 수 없습니다',
  'journey.contributors.role': '역할',
  'journey.contributors.added': '기여자가 추가되었습니다',
  'journey.contributors.addFailed': '기여자 추가 실패',
  'journey.contributors.remove': '기여자 제거',
  'journey.contributors.removeConfirm': '{username}을(를) 이 Journey에서 제거할까요?',
  'journey.contributors.removed': '기여자가 제거되었습니다',
  'journey.contributors.removeFailed': '기여자 제거 실패',
  'journey.share.publicShare': '공개 공유',
  'journey.share.createLink': '공유 링크 만들기',
  'journey.share.linkCreated': '공유 링크가 생성되었습니다',
  'journey.share.createFailed': '링크 생성 실패',
  'journey.share.copy': '복사',
  'journey.share.copied': '복사됨!',
  'journey.share.timeline': '타임라인',
  'journey.share.gallery': '갤러리',
  'journey.share.map': '지도',
  'journey.share.removeLink': '공유 링크 제거',
  'journey.share.linkDeleted': '공유 링크가 삭제되었습니다',
  'journey.share.deleteFailed': '삭제 실패',
  'journey.share.updateFailed': '업데이트 실패',
  'journey.invite.role': '역할',
  'journey.invite.viewer': '뷰어',
  'journey.invite.editor': '편집자',
  'journey.invite.invite': '초대',
  'journey.invite.inviting': '초대 중...',
  'journey.settings.title': 'Journey 설정',
  'journey.settings.coverImage': '커버 이미지',
  'journey.settings.changeCover': '커버 변경',
  'journey.settings.addCover': '커버 이미지 추가',
  'journey.settings.name': '이름',
  'journey.settings.subtitle': '부제목',
  'journey.settings.subtitlePlaceholder': '예: 태국, 베트남 & 캄보디아',
  'journey.settings.endJourney': 'Journey 보관',
  'journey.settings.reopenJourney': 'Journey 복원',
  'journey.settings.archived': 'Journey가 보관되었습니다',
  'journey.settings.reopened': 'Journey가 복원되었습니다',
  'journey.settings.endDescription': '라이브 배지를 숨깁니다. 언제든지 다시 열 수 있습니다.',
  'journey.settings.delete': '삭제',
  'journey.settings.deleteJourney': 'Journey 삭제',
  'journey.settings.deleteMessage': '"{title}"을(를) 삭제할까요? 모든 항목과 사진이 삭제됩니다.',
  'journey.settings.saved': '설정이 저장되었습니다',
  'journey.settings.saveFailed': '저장 실패',
  'journey.settings.coverUpdated': '커버가 업데이트되었습니다',
  'journey.settings.coverFailed': '업로드 실패',
  'journey.settings.failedToDelete': '삭제 실패',
  'journey.entries.deleteTitle': '항목 삭제',
  'journey.photosUploaded': '{count}장 사진이 업로드되었습니다',
  'journey.photosAdded': '{count}장 사진이 추가되었습니다',
  'journey.public.notFound': '찾을 수 없습니다',
  'journey.public.notFoundMessage': '이 Journey가 존재하지 않거나 링크가 만료되었습니다.',
  'journey.public.readOnly': '읽기 전용 · 공개 Journey',
  'journey.public.tagline': '여행 기록 및 탐험 키트',
  'journey.public.sharedVia': '공유 경로',
  'journey.public.madeWith': '으로 만들어짐',
  'journey.pdf.journeyBook': 'Journey 책',
  'journey.pdf.madeWith': 'TREK으로 만들어짐',
  'journey.pdf.day': '일차',
  'journey.pdf.theEnd': '끝',
  'journey.pdf.saveAsPdf': 'PDF로 저장',
  'journey.pdf.pages': '페이지',
  'journey.picker.tripPeriod': '여행 기간',
  'journey.picker.dateRange': '날짜 범위',
  'journey.picker.allPhotos': '모든 사진',
  'journey.picker.albums': '앨범',
  'journey.picker.selected': '선택됨',
  'journey.picker.addTo': '추가',
  'journey.picker.newGallery': '새 갤러리',
  'journey.picker.selectAll': '전체 선택',
  'journey.picker.deselectAll': '전체 해제',
  'journey.picker.noAlbums': '앨범을 찾을 수 없습니다',
  'journey.picker.selectDate': '날짜 선택',
  'journey.picker.search': '검색',
  'journey.editor.uploadingProgress': '업로드 중 {done}/{total}…',
  'journey.editor.uploadFailed': '사진 업로드 실패',
  'journey.editor.uploadPartialFailed':
    '{total}개 중 {failed}개의 사진을 업로드하지 못했습니다 — 다시 저장하여 재시도하세요',
  'journey.photosUploadFailed': '일부 사진을 업로드하지 못했습니다',
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
  'journey.studio.bookName': 'Book name', // en-fallback
  'journey.studio.namePlaceholder': 'Name your book', // en-fallback
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
  'journey.studio.undo': 'Undo', // en-fallback
  'journey.studio.redo': 'Redo', // en-fallback
  'journey.studio.zoomIn': 'Zoom in', // en-fallback
  'journey.studio.zoomOut': 'Zoom out', // en-fallback
  'journey.studio.zoomFit': 'Fit to view', // en-fallback
  'journey.studio.desktopOnly': 'Studio needs a bigger screen', // en-fallback
  'journey.studio.desktopOnlyHint': 'Designing a book asks for room to work, so Studio is desktop only. Your journey and its PDF export work here as usual.', // en-fallback
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
  'journey.studio.frames': 'Picture frames', // en-fallback
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
  'journey.studio.templatesCoverHint': 'Layouts apply to the inside spreads. The cover and the back are designed on their own.', // en-fallback
  'journey.studio.tpl.heroStory': 'Hero and story', // en-fallback
  'journey.studio.tpl.fullBleed': 'One picture, full spread', // en-fallback
  'journey.studio.tpl.twoUp': 'Two full pages', // en-fallback
  'journey.studio.tpl.grid4': 'Four up', // en-fallback
  'journey.studio.tpl.grid6': 'Six up', // en-fallback
  'journey.studio.tpl.strip': 'Strip and text', // en-fallback
  'journey.studio.tpl.quietText': 'Text only', // en-fallback
  'journey.studio.tpl.portraitPair': 'A pair', // en-fallback
  'journey.studio.dropPhotoHere': '사진을 여기로\n끌어다 놓기',
  'journey.studio.searchContent': 'Search photos and entries', // en-fallback
  'journey.studio.noMatches': 'Nothing matches that.', // en-fallback
  'journey.studio.decorations': 'Decoration', // en-fallback
  'journey.studio.quoteMark': 'Quotation mark', // en-fallback
  'journey.studio.circleOutline': 'Outlined circle', // en-fallback
  'journey.studio.roundFrame': 'Rounded frame', // en-fallback
  'journey.studio.shapeKind.rounded': 'Rounded rectangle', // en-fallback
  'journey.studio.shapeKind.triangle': 'Triangle', // en-fallback
  'journey.studio.shapeKind.outline': 'Outline only', // en-fallback
};
export default journey;
