import type { TranslationStrings } from '../types';

// English fallback until 'ko' is translated.
const help: TranslationStrings = {
  'help.title': '도움말 및 문서',
  'help.search': '문서 검색…',
  'help.contents': '목차',
  'help.noResults': '일치하는 페이지가 없어요.',
  'help.errorTitle': '페이지를 불러오지 못했어요',
  'help.errorBody': '도움말은 TREK 위키에서 불러와요. 연결 상태를 확인하고 다시 시도하세요.',

  // center
  'help.center.button': '이 화면 도움말',
  'help.center.title': '도움말',
  'help.center.onThisScreen': '이 화면에서',
  'help.center.screens': '화면',
  'help.center.thisScreen': '현재',
  'help.center.subScreens': '하위 화면 {count}개',
  'help.center.subScreensLabel': '하위 화면',
  'help.center.guidesCount': '가이드 {count}개',
  'help.center.goToScreen': '{screen}(으)로 이동',
  'help.center.overview': '개요',
  'help.center.howTo': '이렇게 하려면…',
  'help.center.searchPlaceholder': '가이드와 문서 검색…',
  'help.center.searchEmpty': '“{query}”에 대한 검색 결과가 없어요.',
  'help.center.searchGuides': '가이드',
  'help.center.searchDocs': '문서',
  'help.center.searchError': '지금은 검색을 쓸 수 없어요.',
  'help.center.back': '뒤로',
  'help.center.close': '도움말 닫기',
  'help.center.steps': '{count}단계',
  'help.center.step': '{n}단계',
  'help.center.stepsLabel': '단계',
  'help.center.stepOf': '{total}단계 중 {n}단계',
  'help.center.screenshot': '스크린샷',
  'help.center.result': '결과',
  'help.center.tips': '알아두면 좋아요',
  'help.center.related': '관련 항목',
  'help.center.openDocs': '도움말 및 문서에서 열기',
  'help.center.docsSection': '문서에서',
  'help.center.noContext': '이 화면의 가이드는 아직 없어요.',
  'help.center.noContextHint': '문서를 검색하거나, 찾던 내용을 알려 주세요.',
  'help.center.feedback': '찾는 내용이 없나요?',
  'help.center.feedbackLink': 'GitHub에 알려 주세요',
  'help.center.discord': 'Discord에서 질문하기',
  'help.center.quick': '간단히',
  'help.center.guide': '가이드',
  'help.center.tour': '둘러보기',
  'help.center.imageAlt': '‘{title}’의 {n}단계',

  // ctx
  'help.ctx.dashboard.title': '대시보드',
  'help.ctx.dashboard.summary':
    '대시보드에는 모든 여행이 있어요. 맨 위 탑승권 모양 카드에 진행 중이거나 다음에 떠날 여행이 보이고, 그 아래 줄에 지금까지의 여행 기록이 집계돼요. 카드에는 계획 중, 보관됨, 완료된 여행이 모두 나와요.',
  'help.ctx.dashboard.bullet.1':
    '탑승권: 진행 중이거나 다음에 떠날 여행이 날짜, 동행자, 장소, 카운트다운과 함께 보여요. 클릭하면 여행이 열려요. 오른쪽 위의 버튼 네 개로 편집, 복제, 보관, 삭제를 할 수 있어요.',
  'help.ctx.dashboard.bullet.2':
    '여행 통계: 모든 여행을 합쳐 방문한 국가, 여행 수, 여행한 일수, 비행 거리를 보여 줘요.',
  'help.ctx.dashboard.bullet.3':
    '여행 카드는 ‘예정’, ‘보관됨’, ‘완료됨’으로 걸러서 그리드나 목록으로 볼 수 있어요. 위쪽 검색창에서 제목, 날짜, 여행 속 장소로 모든 여행을 한 번에 찾을 수 있어요. 여행을 편집, 복제, 보관, 삭제하는 버튼은 각 카드 사진의 오른쪽 위에 있어요.',
  'help.ctx.dashboard.bullet.4':
    '오른쪽 위젯: 환율 계산기, 컬렉션(컬렉션 애드온이 켜져 있을 때), 세계 시계, 예정된 예약, 플러그인 위젯. 기본 위젯은 ‘설정’, ‘모양’에서 끌 수 있어요.',
  'help.ctx.dashboard.bullet.5': '“새 여행” 카드나 오른쪽 아래 버튼으로 새 여행을 만들 수 있어요.',

  // create-trip
  'help.guide.create-trip.title': '여행 만들기',
  'help.guide.create-trip.goal': '이름, 날짜, 커버 사진을 정해 새 여행을 시작해요.',
  'help.guide.create-trip.step.1': '‘새 여행’을 클릭하세요. 여행 목록 끝의 카드와 오른쪽 아래 버튼도 똑같아요.',
  'help.guide.create-trip.step.2':
    '여행 이름을 입력하세요. 필수 항목은 이것 하나뿐이고, 나머지는 나중에 추가해도 돼요.',
  'help.guide.create-trip.step.3':
    '시작일과 종료일을 고르세요. TREK가 날짜마다 하루씩 만들어 줘서 바로 일정을 짤 수 있어요. 아직 날짜가 없나요? 둘 다 비워 두고 대신 ‘일수’를 입력하세요.',
  'help.guide.create-trip.step.4':
    '선택 사항: 커버 사진을 추가하세요. 직접 업로드하거나, 끌어다 놓거나 붙여 넣거나, Unsplash에서 여행지를 검색하세요.',
  'help.guide.create-trip.step.5': '‘새 여행 만들기’를 클릭하세요.',
  'help.guide.create-trip.result': '여행이 대시보드에 나타나요. 바로 다음 여행이면 상단의 탑승권에 표시돼요.',
  'help.guide.create-trip.tip.1':
    '날짜는 나중에 바꿀 수 있어요. 이미 예약이 있으면 예약도 날짜에 맞춰 옮길지 TREK이 물어봐요.',
  'help.guide.create-trip.tip.2': '여기서 고른 여행 통화로 모든 비용이 환산돼요. 여행지의 통화를 고르세요.',

  // edit-trip
  'help.guide.edit-trip.title': '여행 편집하기',
  'help.guide.edit-trip.goal': '여행 이름이나 날짜를 바꾸거나 설정을 조정해요.',
  'help.guide.edit-trip.step.1': '여행 카드(또는 탑승권) 오른쪽 위의 연필을 클릭하세요.',
  'help.guide.edit-trip.step.2': '필요한 부분을 바꾸세요: 이름, 설명, 날짜, 커버, 통화, 리마인더, 동행자.',
  'help.guide.edit-trip.step.3': '‘업데이트’를 클릭하세요.',
  'help.guide.edit-trip.result': '여행의 모든 멤버에게 카드가 바로 업데이트돼요.',
  'help.guide.edit-trip.tip.1':
    '예약이 있는 여행의 시작일을 옮기면 예약도 함께 옮길지 물어봐요. 여행 기간을 줄이면 빠질 날과 그날 계획된 내용을 보여 주고, ‘날짜 삭제 후 저장’을 클릭해야 저장돼요.',

  // cover-image
  'help.guide.cover-image.title': '커버 사진 설정하기',
  'help.guide.cover-image.goal': '여행 카드와 탑승권에 보일 사진을 정해요.',
  'help.guide.cover-image.step.1': '여행 카드의 연필 아이콘으로 편집 양식을 여세요.',
  'help.guide.cover-image.step.2':
    '‘커버 이미지’에서 사진을 끌어다 놓거나 붙여 넣거나, 클릭해서 업로드하거나, 여행지를 입력하고 ‘Unsplash 검색’을 클릭하세요.',
  'help.guide.cover-image.step.3': '사진을 고르고 “업데이트”를 클릭하세요.',
  'help.guide.cover-image.result': '사진이 여행과 함께 저장되어 여행이 표시되는 모든 곳에 나와요.',
  'help.guide.cover-image.tip.1': 'Unsplash 검색 사진에는 출처가 자동으로 표시되고, 직접 올린 사진은 내 서버에 남아요.',

  // duplicate-trip
  'help.guide.duplicate-trip.title': '여행 복제하기',
  'help.guide.duplicate-trip.goal': '기존 여행을 새 여행의 템플릿으로 다시 써요.',
  'help.guide.duplicate-trip.step.1': '카드 오른쪽 위의 복제 아이콘을 클릭하세요.',
  'help.guide.duplicate-trip.step.2': '무엇이 복사되고 무엇이 복사되지 않는지 읽은 다음 ‘여행 복사’를 클릭하세요.',
  'help.guide.duplicate-trip.result':
    '대시보드에 사본이 생겨요. 이름은 원래 이름 뒤에 (사본)이 붙고, 이름과 날짜는 바꿀 수 있어요.',
  'help.guide.duplicate-trip.tip.1':
    '날, 장소, 투어와 로드 트립 경로, 예약, 예산 항목, 짐 목록, 할 일, 날 메모가 복사돼요. 짐 목록과 할 일은 체크가 해제된 상태로 복사돼요. 멤버, 채팅, 투표, 파일, 공유 링크는 복사되지 않아요.',

  // archive-trip
  'help.guide.archive-trip.title': '여행 보관 및 복원하기',
  'help.guide.archive-trip.goal': '여행을 삭제하지 않고 목록에서 치웠다가 나중에 복원해요.',
  'help.guide.archive-trip.step.1': '카드 오른쪽 위의 보관 아이콘을 클릭하세요.',
  'help.guide.archive-trip.step.2': '다시 보려면 카드 위 필터를 “보관됨”으로 바꾸세요.',
  'help.guide.archive-trip.step.3':
    '카드에서 ‘복원’을 클릭하면 ‘예정’으로 돌아와요. 날짜가 이미 지났다면 ‘완료됨’으로 돌아와요.',
  'help.guide.archive-trip.result':
    '보관한 여행의 데이터는 모두 그대로 남아요. 대시보드와 전체 여행 캘린더 피드에만 더 이상 표시되지 않아요.',

  // delete-trip
  'help.guide.delete-trip.title': '여행 삭제하기',
  'help.guide.delete-trip.goal': '여행을 완전히 삭제해요.',
  'help.guide.delete-trip.step.1': '카드 오른쪽 위의 휴지통 아이콘을 클릭하세요.',
  'help.guide.delete-trip.step.2': '‘삭제’로 확인하세요. 창에 여행 이름이 나오니 맞는 여행인지 확인할 수 있어요.',
  'help.guide.delete-trip.result':
    '여행과 날, 장소, 예약, 파일이 모두 삭제돼요. 되돌릴 수 없으니, 확실하지 않다면 대신 보관하세요.',

  // filter-and-view
  'help.guide.filter-and-view.title': '완료된 여행 찾기, 격자와 목록 보기 전환하기',
  'help.guide.filter-and-view.goal': '끝난 여행이나 보관한 여행을 보고 원하는 레이아웃을 골라요.',
  'help.guide.filter-and-view.step.1':
    '카드 위의 “예정”, “보관됨”, “완료됨”을 쓰세요. “완료됨”에는 종료일이 지난 모든 여행이 들어가요.',
  'help.guide.filter-and-view.step.2': '목록 아이콘을 클릭하면 간단한 목록으로 바뀌고, 다시 클릭하면 격자로 돌아가요.',
  'help.guide.filter-and-view.result': '대시보드가 이 기기에서 고른 보기 방식을 기억해요.',

  // calendar-feed
  'help.guide.calendar-feed.title': '캘린더에서 모든 여행 구독하기',
  'help.guide.calendar-feed.goal': '진행 중인 모든 여행의 날과 예약을 캘린더 앱에서 동기화된 상태로 봐요.',
  'help.guide.calendar-feed.step.1': '보기 전환 버튼 옆의 캘린더 아이콘을 클릭하세요.',
  'help.guide.calendar-feed.step.2': '‘캘린더 구독 사용’을 클릭하세요. TREK가 비공개 피드 링크를 만들어요.',
  'help.guide.calendar-feed.step.3':
    '‘Google 캘린더에 추가’나 ‘Apple 캘린더 / Outlook에 추가’를 클릭하세요. 다른 캘린더 앱이라면 ‘또는 링크를 직접 복사’를 열고 거기서 링크를 복사하세요.',
  'help.guide.calendar-feed.result':
    '진행 중인 모든 여행이 캘린더에 표시되고 자동으로 업데이트돼요. 보관한 여행과 끝난 지 90일이 넘은 여행은 빠져요.',
  'help.guide.calendar-feed.tip.1':
    '링크는 비밀로 두세요. 링크가 있으면 누구나 피드를 볼 수 있어요. 다른 사람에게 알려졌다면 ‘다시 생성’으로 새 링크를 받으면 이전 링크는 더 이상 동작하지 않아요. ‘끄기’는 링크를 완전히 없애요.',

  // widgets
  'help.guide.widgets.title': '대시보드 위젯 고르기',
  'help.guide.widgets.goal': '통계 줄과 오른쪽 위젯을 보이거나 숨겨요.',
  'help.guide.widgets.step.1': '오른쪽 위 아바타 메뉴를 열고 ‘설정’을 고르세요.',
  'help.guide.widgets.step.2': '‘모양’ 탭으로 이동하세요.',
  'help.guide.widgets.step.3':
    '‘대시보드 위젯’에서 위젯마다 데스크톱과 모바일을 따로 켜거나 끄세요. ‘오른쪽 사이드바’는 오른쪽 열 전체를 한 번에 꺼요.',
  'help.guide.widgets.step.4': '대시보드로 돌아가세요. 변경 사항이 바로 적용돼요.',
  'help.guide.widgets.result':
    '위젯을 숨기면 여행 목록이 더 넓어져요. 오른쪽 사이드바를 통째로 끄면 레이아웃이 가운데로 정렬돼요.',
  'help.guide.widgets.link': '“모양” 설정 열기',

  // currency-widget
  'help.guide.currency-widget.title': '환율 계산하기',
  'help.guide.currency-widget.goal': '현재 환율로 두 통화 사이의 금액을 환산해요.',
  'help.guide.currency-widget.step.1': '금액을 입력하고 통화 두 개를 고르세요.',
  'help.guide.currency-widget.step.2': '가운데 화살표로 두 통화를 맞바꾸고, 둥근 화살표로 환율을 새로 고쳐요.',
  'help.guide.currency-widget.result': '통화 쌍은 계정에 저장돼서 모든 기기에서 같아요.',
  'help.guide.currency-widget.tip.1':
    '환율은 무료 Frankfurter 서비스에서 가져와요. 위젯 모서리의 둥근 화살표를 누르면 최신 환율을 불러와요.',

  // timezones-widget
  'help.guide.timezones-widget.title': '세계 시계 추가하기',
  'help.guide.timezones-widget.goal': '여행지의 현지 시간을 확인해요.',
  'help.guide.timezones-widget.step.1': '‘시간대’ 위젯의 +를 클릭하고 도시(예: Lisbon)를 검색해 목록에서 고르세요.',
  'help.guide.timezones-widget.step.2': '시계를 없애려면 마우스를 올리고 오른쪽에 나타나는 ×를 클릭하세요.',
  'help.guide.timezones-widget.result': '시계는 계정에 저장돼요.',
  'help.guide.search-trips.title': '여행 검색하기',
  'help.guide.search-trips.goal': '이름, 날짜, 여행에 넣은 장소로 여행을 찾아요. 보관된 여행도 포함돼요.',
  'help.guide.search-trips.step.1':
    '카드 위 ‘여행 또는 장소 검색’에 입력하세요. 입력하는 대로 예정, 보관됨, 완료된 여행을 한 번에 걸러 줘요.',
  'help.guide.search-trips.step.2':
    '장소 때문에 검색된 여행은 제목 아래에 그 장소가 보여요. 칸의 x를 클릭하거나 Esc를 누르면 다시 모든 여행이 보여요.',
  'help.guide.search-trips.result': '대시보드에 일치하는 여행만 표시돼요. 검색창을 비우면 모든 여행이 다시 나타나요.',
  'help.guide.search-trips.tip.1':
    '날짜로도 검색할 수 있어요. 2027년 5월이나 2027-05처럼 연도와 월을 입력하면 그달의 여행을 찾아 줘요.',
  'help.guide.search-trips.tip.2':
    '검색하는 동안에는 “예정”, “보관됨”, “완료됨” 전환이 적용되지 않아서, 필터를 잘못 골라 여행이 숨겨지는 일이 없어요.',

  // ── Screen: vacay ──────────────────────────────────────────────────────────
  'help.ctx.vacay.title': 'Vacay',
  'help.ctx.vacay.summary':
    'Vacay는 개인 휴가 플래너예요: 한 해 휴가 일수, 기록한 휴가, 남은 일수를 관리해요. 달력에 한 해 전체가 보이고, 사이드바에는 연도 선택, 함께 계획하는 사람, 공유받은 캘린더, 범례, 휴가 일수가 있어요.',
  'help.ctx.vacay.bullet.1':
    '연간 달력: 월 카드 12개, 하루에 칸 하나. 날을 클릭하면 기록하거나 지워요. 작은 파란 점은 이미 여행이 잡힌 날이에요.',
  'help.ctx.vacay.bullet.2':
    '아래쪽 도구 모음: 내 이름과 색이 있는 첫 번째 버튼으로 휴가를 기록하고, ‘회사 휴일’로 회사 전체가 쉬는 날을 표시해요. ‘반차’와 ‘대체휴무’는 클릭할 때 기록되는 내용을 바꾸고, ‘반차’는 회사 휴일에도 쓸 수 있어요.',
  'help.ctx.vacay.bullet.3':
    '‘휴가 일수’: 선택한 연도의 ‘일’, ‘사용됨’, ‘남음’이 이월 일수, 대체휴무 일수와 함께 보여요. 카드 제목을 클릭하면 접혀요.',
  'help.ctx.vacay.bullet.4':
    '‘인원’은 내 계획을 함께 쓰는 사람들이고, 각자 색이 있어요. ‘공유된 캘린더’는 다른 사람의 휴가를 색 테두리로 보여 주고, 편집할 수는 없어요.',
  'help.ctx.vacay.bullet.5':
    '‘설정’에서는 주말, 주 시작 요일, 이월, 휴가 연도, 회사 휴일, 공휴일과 학교 방학 캘린더를 정하고, 다른 사람과 함께 계획하는 동안에는 ‘퓨전 해제’도 있어요.',
  // log-day
  'help.guide.log-day.title': '휴가일 기록하기',
  'help.guide.log-day.goal': '연간 격자에 휴무일을 표시하고 남은 일수가 바뀌는 걸 확인해요.',
  'help.guide.log-day.step.1':
    '아래쪽 도구 모음의 첫 번째 버튼을 확인하세요. 내 이름과 색이 보이면, 날을 클릭할 때 내 휴가가 하루 기록돼요.',
  'help.guide.log-day.step.2':
    '아무 월 카드에서 날짜를 클릭하세요. 날짜가 내 색으로 채워지고 “사용일”이 하루 늘어나요.',
  'help.guide.log-day.step.3': '같은 날짜를 다시 클릭하면 지워져요.',
  'help.guide.log-day.result':
    '날이 기록돼요. ‘일’, ‘사용됨’, ‘남음’이 바로 바뀌고, 계획을 퓨전한 모든 사람에게도 바로 보여요.',
  'help.guide.log-day.tip.1':
    '‘설정’에서 ‘주말 차단’이 켜져 있으면 주말은 기록할 수 없어요. 전에 기록한 주말은 지울 수 있어요.',
  'help.guide.log-day.tip.2':
    '칸의 파란 점은 내 여행이 그날에 걸쳐 있다는 뜻이라, 휴가와 여행이 맞는지 확인할 수 있어요.',
  // half-day
  'help.guide.half-day.title': '반차 기록하기',
  'help.guide.half-day.goal': '오후만 쉬고 휴가는 반나절만 써요.',
  'help.guide.half-day.step.1': '도구 모음에서 “반차”를 켜세요. 격자의 주황색 점이 반차 표시예요.',
  'help.guide.half-day.step.2': '날짜를 클릭하세요. 0.5일로 기록되고 모서리에 주황색 점이 표시돼요.',
  'help.guide.half-day.step.3': '다 쓰면 “반차”를 다시 끄세요. 설정이 다른 반차를 클릭하면 현재 설정으로 바뀌어요.',
  'help.guide.half-day.result':
    '‘사용됨’이 0.5 늘어요. ‘반차’와 ‘대체휴무’는 따로 동작해서 반일 대체휴무도 기록할 수 있어요.',
  'help.guide.half-day.tip.1': '도구 모음에는 다음 클릭으로 놓일 표시가 항상 보여서, 기록하기 전에 확인할 수 있어요.',
  // comp-day
  'help.guide.comp-day.title': '대체휴무나 유연근무 기록하기',
  'help.guide.comp-day.goal': '휴가 일수를 쓰지 않고 대체휴무를 써요.',
  'help.guide.comp-day.step.1': '도구 모음에서 “대체휴무”를 켜세요. 격자의 빗금 친 원이 대체휴무 표시예요.',
  'help.guide.comp-day.step.2': '날짜를 클릭하세요. 단색 대신 내 색의 빗금으로 채워져요.',
  'help.guide.comp-day.result': '대체휴무일은 휴가 일수 타일 옆에 따로 집계되고 “남음”을 줄이지 않아요.',
  'help.guide.comp-day.tip.1': '초과근무를 휴가로 쓰는 경우, 유연근무, 대휴처럼 휴가가 아닌 쉬는 날에 쓰세요.',
  // entitlement
  'help.guide.entitlement.title': '휴가 일수 정하기',
  'help.guide.entitlement.goal': '한 해 휴가 일수를 Vacay에 알려 줘요.',
  'help.guide.entitlement.step.1':
    '사이드바의 ‘휴가 일수’ 카드에서 내 줄의 ‘일’ 타일을 클릭하세요. 카드가 접혀 있으면 제목을 클릭해 펼치세요.',
  'help.guide.entitlement.step.2': '일수를 입력하고 Enter를 누르세요. 이전 값을 유지하려면 Esc를 누르세요.',
  'help.guide.entitlement.result': '“남음”은 휴가 일수, 이월분, 사용한 날을 바탕으로 다시 계산돼요.',
  'help.guide.entitlement.tip.1': '연도마다 휴가 일수가 따로 있어서 여기서 바꾸면 선택한 연도에만 적용돼요.',
  // years
  'help.guide.years.title': '연도 추가하고 전환하기',
  'help.guide.years.goal': '내년을 미리 계획하거나 작년을 돌아봐요.',
  'help.guide.years.step.1': '연도 오른쪽 +를 클릭하면 다음 해가, 왼쪽 +를 클릭하면 이전 해가 추가돼요.',
  'help.guide.years.step.2': '화살표나 아래 연도 칩으로 연도를 바꾸세요.',
  'help.guide.years.step.3':
    '연도를 삭제하려면 칩에 마우스를 올리고 작은 빼기를 클릭하세요. 그 연도의 기록도 모두 삭제되니 신중하게 확인하세요.',
  'help.guide.years.result': '연도마다 휴가 일수와 기록이 따로 있어요. 이월로 한 해와 다음 해가 이어져요.',
  // company-holidays
  'help.guide.company-holidays.title': '회사 휴일 표시하기',
  'help.guide.company-holidays.goal': '누구의 휴가 일수도 쓰지 않고 회사 전체가 쉬는 날을 막아 둬요.',
  'help.guide.company-holidays.step.1':
    '“설정”을 열고 “회사 휴일”이 켜져 있는지 확인하세요. 기본으로 켜져 있어요. 켜져 있을 때만 도구 모음에 이 모드가 나와요.',
  'help.guide.company-holidays.step.2': '달력으로 돌아와 도구 모음을 ‘회사 휴일’로 바꾸세요.',
  'help.guide.company-holidays.step.3': '날을 클릭하세요. 주황색으로 바뀌고 범례에 나타나요. 다시 클릭하면 해제돼요.',
  'help.guide.company-holidays.result': '계획을 퓨전한 모든 사람에게 회사 휴일이 보이고, ‘남음’은 줄지 않아요.',
  'help.guide.company-holidays.tip.1': '퓨전한 사람은 누구나 회사 휴일을 편집할 수 있으니, 누가 관리할지 정해 두세요.',
  // public-holidays
  'help.guide.public-holidays.title': '공휴일 보기',
  'help.guide.public-holidays.goal': '내 나라나 지역의 공휴일을 격자에 표시해요.',
  'help.guide.public-holidays.step.1': '“설정”을 열고 “공휴일”을 켜세요.',
  'help.guide.public-holidays.step.2':
    '‘캘린더 추가’를 클릭하고 국가를, 필요하면 지역도 고르세요. 색과 레이블을 정할 수도 있어요. 그다음 ‘추가’를 클릭하세요.',
  'help.guide.public-holidays.step.3': '“설정”을 닫으세요. 공휴일이 격자와 범례에 나타나요.',
  'help.guide.public-holidays.result': '공휴일은 캘린더 색으로 표시되고 휴가 일수에서 빠지지 않아요.',
  'help.guide.public-holidays.tip.1': '캘린더를 여러 개 추가할 수 있어요. 예를 들어 내 지역과 퓨전한 동료의 지역.',
  // school-holidays
  'help.guide.school-holidays.title': '학교 방학 보기',
  'help.guide.school-holidays.goal': '내 지역의 학교 방학을 내 휴가와 함께 봐요.',
  'help.guide.school-holidays.step.1': '“설정”을 열고 “School Holidays”를 켜세요.',
  'help.guide.school-holidays.step.2':
    '‘캘린더 추가’를 클릭하고 국가를 고르세요. 국가 안에서 캘린더가 나뉘어 있으면 지역이나 그룹도 고른 뒤 ‘추가’를 클릭하세요.',
  'help.guide.school-holidays.step.3':
    '‘설정’을 닫으세요. 학교 방학은 캘린더 색으로 옅게 칠해지고, 해당 날 아래쪽에 색 막대가 생겨요.',
  'help.guide.school-holidays.result': '학교 방학은 캘린더에 표시만 될 뿐, 누구의 휴가 일수도 줄이지 않아요.',
  'help.guide.school-holidays.tip.1':
    '원하는 지역이 없나요? 관리자가 “관리자”, “개인 설정”, “학교 방학”에서 학교 방학을 직접 관리할 수 있어요.',
  // weekends
  'help.guide.weekends.title': '주말 막기와 주 시작 요일 설정하기',
  'help.guide.weekends.goal': '주말을 집계에서 빼고, 원하는 요일로 한 주를 시작해요.',
  'help.guide.weekends.step.1': '‘설정’을 여세요.',
  'help.guide.weekends.step.2': '‘주말 차단’을 켜고 ‘주말 요일’에서 주말로 칠 요일을 고르세요.',
  'help.guide.weekends.step.3': '‘주 시작 요일’에서 ‘월’이나 ‘일’을 고르세요.',
  'help.guide.weekends.result': '차단된 날은 달력에서 회색으로 보이고, 실수로 기록할 수 없어요.',
  // leave-year
  'help.guide.leave-year.title': '휴가 연도 설정하기',
  'help.guide.leave-year.goal': '1월부터 12월까지가 아니라 회계연도나 입사일 기준으로 휴가 일수를 계산해요.',
  'help.guide.leave-year.step.1': '“설정”을 열고 “휴가 연도”를 찾으세요.',
  'help.guide.leave-year.step.2':
    '“캘린더”, “회계연도”(시작 월과 일 지정), “입사일”(입사한 날짜 지정) 중에서 고르세요.',
  'help.guide.leave-year.result': '휴가 일수, 사용일, 이월이 그 기간 기준으로 계산되고, 달력도 그 첫 달부터 시작해요.',
  'help.guide.leave-year.tip.1': '이 설정은 개인 설정이에요. 퓨전한 계획에서도 각자 자기 휴가 연도와 숫자를 유지해요.',
  // carry-over
  'help.guide.carry-over.title': '남은 일수 이월하기',
  'help.guide.carry-over.goal': '기간이 끝날 때 남은 일수를 다음 기간으로 넘겨요.',
  'help.guide.carry-over.step.1': '“설정”을 여세요.',
  'help.guide.carry-over.step.2': '“이월”을 켜세요.',
  'help.guide.carry-over.result': '이월된 일수가 모든 연도에 걸쳐 다시 계산되어 휴가 일수 아래에 표시돼요.',
  'help.guide.carry-over.tip.1': '끄면 모든 이월 잔액이 0으로 돌아가요.',
  // invite
  'help.guide.invite.title': '다른 사람과 함께 계획하기',
  'help.guide.invite.goal': '다른 TREK 사용자와 계획을 합쳐서 서로의 휴가를 한 달력에서 봐요.',
  'help.guide.invite.step.1': '‘인원’ 카드에서 사람 아이콘을 클릭하세요.',
  'help.guide.invite.step.2': '사용자를 고르고 ‘초대 전송’을 클릭하세요.',
  'help.guide.invite.step.3':
    '상대방은 알림을 받고, 다음에 Vacay를 열 때 ‘퓨전 요청’을 받아요. 그때까지 초대는 대기 중으로 보이고, 마우스를 올리면 취소할 수 있어요.',
  'help.guide.invite.result':
    '두 계획이 하나로 합쳐져요. 사람마다 색이 정해지고, 서로의 휴가일을 대신 기록할 수 있으며, 모든 내용이 실시간으로 동기화돼요.',
  'help.guide.invite.tip.1': '퓨전을 되돌리려면 ‘설정’에서 ‘해제’를 클릭하세요. 모두의 항목이 각자 계획으로 돌아가요.',
  'help.guide.invite.tip.2': '상대가 내 휴무일만 보면 된다면 병합하지 말고 캘린더를 공유하세요.',
  // share-calendar
  'help.guide.share-calendar.title': '캘린더를 읽기 전용으로 공유하기',
  'help.guide.share-calendar.goal': '내 계획을 바꿀 권한은 주지 않고, 내가 언제 쉬는지만 보여 줘요.',
  'help.guide.share-calendar.step.1': '‘공유된 캘린더’ 카드에서 공유 아이콘을 클릭하세요.',
  'help.guide.share-calendar.step.2': '사용자를 고르고 ‘공유’를 클릭하세요. 상대방이 수락할 필요는 없어요.',
  'help.guide.share-calendar.step.3':
    '나와 공유된 캘린더는 카드 맨 위에 보여요: 클릭하면 숨기거나 보이고, 마우스를 올려 x를 클릭하면 삭제돼요. ‘내가 공유하는 대상’에서 이름에 마우스를 올리고 ‘공유 중지’를 클릭하세요.',
  'help.guide.share-calendar.result':
    '상대방 달력에 내 휴가가 색 테두리로 보여요. 상대방은 공유받은 내용을 편집할 수 없어요.',
  'help.guide.share-calendar.tip.1':
    '공유와 병합은 서로 별개예요. 한 사람과 병합한 상태에서 다른 사람들과 공유할 수도 있어요.',
  'help.guide.share-calendar.tip.2': '테두리가 있는 날에 마우스를 올리면 누가 얼마나 쉬는지 볼 수 있어요.',

  // ── Screen: atlas ─────────────────────────────────────────────────────────────────────
  'help.ctx.atlas.title': 'Atlas',
  'help.ctx.atlas.summary':
    'Atlas는 내가 여행한 곳을 세계 지도로 보여 줘요. 여행으로 다녀온 나라는 모두 색칠되고, TREK을 쓰기 전에 다녀온 나라는 직접 추가할 수 있어요. 확대하면 지역이 보이고, 아직 가 보고 싶은 곳은 버킷 리스트로 관리하며, 아래쪽 반투명 패널에서 내 통계를 볼 수 있어요.',
  'help.ctx.atlas.bullet.1':
    '지도: 다녀온 국가는 국가마다 정해진 색으로, 예정된 국가는 점선 테두리로, 버킷 리스트 국가는 빗금으로, 나머지는 회색으로 보여요. 국가에 마우스를 올리면 여행, 장소, 첫 방문과 마지막 방문이 보여요.',
  'help.ctx.atlas.bullet.2':
    '위쪽 검색: 국가나 장소를 입력하세요. 가 보지 않은 국가는 팝업이 열리고, 가 본 국가는 패널에 카드가 나타나요. 장소를 고르면 지도에서 그 지역이 열려서 표시할 수 있어요.',
  'help.ctx.atlas.bullet.3':
    '오른쪽 위 ‘예정된 국가 표시’: 다가오는 여행의 국가를 보여 줘요. 예정된 여행이 있을 때만 스위치가 보여요.',
  'help.ctx.atlas.bullet.4':
    '아래쪽 패널: ‘통계’ 탭에는 국가(옆에 예정된 국가), 지역, 여행, 장소, 도시, 일수, 대륙, 연속 기록, 올해 여행이 있어요. ‘버킷 리스트’ 탭에는 아직 가고 싶은 곳이 있고, 투어 애드온을 쓰면 ‘투어’ 탭에서 다녀온 투어의 거리와 오르막을 볼 수 있어요.',
  'help.ctx.atlas.bullet.5':
    '지역: 가까이 확대하면 지도에 주와 도가 보여요. 하나를 클릭해 표시하거나, 표시를 해제하거나, 버킷 리스트에 추가할 수 있어요.',
  'help.ctx.atlas.bullet.6':
    'Dawarich: 애드온을 연결하면 통계 왼쪽 패널에서 기록을 바탕으로 위시리스트를 완료 처리하고 국가를 추가해요. 내가 확인한 뒤에만 반영돼요.',
  // mark-country
  'help.guide.mark-country.title': '나라를 방문함으로 표시하기',
  'help.guide.mark-country.goal': 'TREK을 쓰기 전에 다녀온 나라를 추가해 지도와 집계에 포함해요.',
  'help.guide.mark-country.step.1': '지도 위쪽 검색창에 나라 이름을 입력하세요.',
  'help.guide.mark-country.step.2': '목록에서 고르세요. 지도가 그 나라로 이동하고 팝업이 열려요.',
  'help.guide.mark-country.step.3': '‘방문으로 표시’를 고르세요.',
  'help.guide.mark-country.result':
    '국가가 지도에 색으로 표시되고 ‘국가’ 수가 하나 늘어요. 색은 고정이라서, 국가를 더 표시해도 다른 국가의 색은 바뀌지 않아요.',
  'help.guide.mark-country.tip.1': '지도에서 회색 국가를 클릭해도 같은 팝업이 열려요. 작은 국가는 검색이 더 정확해요.',
  'help.guide.mark-country.tip.2':
    '직접 표시한 나라는 그 나라로 가는 여행의 날짜와 관계없이 항상 방문한 나라로 집계돼요.',
  // unmark-country
  'help.guide.unmark-country.title': '표시한 나라 지우기',
  'help.guide.unmark-country.goal': '직접 표시한 나라를 지도에서 지워요.',
  'help.guide.unmark-country.step.1':
    '나라를 검색해서 고르거나 지도에서 클릭하세요. 직접 표시한 나라라면 팝업에서 제거할지 물어봐요.',
  'help.guide.unmark-country.step.2': '‘제거’로 확인하세요.',
  'help.guide.unmark-country.result': '국가가 다시 회색이 되고 더 이상 집계되지 않아요.',
  'help.guide.unmark-country.tip.1':
    '이 방법으로는 직접 표시한 국가만 제거할 수 있어요. 여행이나 장소가 있는 국가는 그 여행이나 장소를 삭제하기 전까지 표시가 남아요. 직접 표시한 국가는 패널의 상세 카드에도 ‘제거’가 있어요.',
  // country-details
  'help.guide.country-details.title': '한 나라에서 한 일 보기',
  'help.guide.country-details.goal': '방문한 나라를 열고 그 나라에 갔던 여행으로 이동해요.',
  'help.guide.country-details.step.1': '지도 위쪽 검색창에 다녀온 국가를 입력하세요.',
  'help.guide.country-details.step.2':
    '고르세요. 지도가 그곳으로 이동하고 아래쪽 패널에 카드가 나타나요. 카드에는 국기, 장소, 여행, 방문한 지역 배지와 처음 세 여행의 칩이 있어요.',
  'help.guide.country-details.result': '여행 칩을 클릭하면 플래너에서 그 여행이 열려요.',
  'help.guide.country-details.tip.1':
    '지도에서 나라에 마우스를 올리면 같은 숫자와 함께 첫 방문과 마지막 방문이 나와요.',
  // planned-countries
  'help.guide.planned-countries.title': '갈 예정인 국가 보기',
  'help.guide.planned-countries.goal': '다가오는 여행의 국가를 방문으로 집계하지 않고 지도에 보여 줘요.',
  'help.guide.planned-countries.step.1': '오른쪽 위 ‘예정된 국가 표시’를 켜세요. 옆의 숫자는 예정된 국가 수예요.',
  'help.guide.planned-countries.step.2':
    '예정된 나라를 검색해서 선택하세요. 패널에 “예정”이 표시되고, 지도 툴팁에 언제 가는지 나와요.',
  'help.guide.planned-countries.result':
    '예정된 나라는 점선 테두리로 표시되어 이미 다녀온 나라와 헷갈리지 않아요. 스위치 설정은 그대로 기억돼요.',
  'help.guide.planned-countries.tip.1':
    '그 나라로 가는 여행이 시작되면 방문한 나라로 집계돼요. 진행 중인 여행도 포함돼요. 날짜가 없는 여행은 통계에 아예 포함되지 않아요.',
  'help.guide.planned-countries.tip.2': '이 스위치는 다가오는 여행이 있을 때만 나와요.',
  // regions
  'help.guide.regions.title': '지역 표시하기',
  'help.guide.regions.goal': '국가뿐 아니라 다녀온 주, 도, 현도 표시해요.',
  'help.guide.regions.step.1':
    '주와 도 경계가 보일 때까지 국가를 확대하세요. 국가를 검색해서 고르면 충분히 가까이 이동해요.',
  'help.guide.regions.step.2': '지역을 클릭하세요. 마우스를 올리면 지역 이름이 보여요. 팝업에 지역과 그 국가가 나와요.',
  'help.guide.regions.step.3': '“방문으로 표시”를 선택하세요.',
  'help.guide.regions.result':
    '지역이 그 나라의 색으로 채워져요. 지역을 표시하면 아직 방문으로 표시되지 않은 나라도 방문한 나라로 집계돼요.',
  'help.guide.regions.tip.1':
    '방문한 지역을 클릭하면 “제거”가 나와요. 직접 표시했든 장소 때문에 추가됐든 마찬가지예요.',
  'help.guide.regions.tip.2': '실제 장소가 있는 지역은 자동으로 표시돼요. 따로 할 건 없어요.',
  // search-place
  'help.guide.search-place.title': '장소를 찾아 지역 표시하기',
  'help.guide.search-place.goal': '도시가 어느 지역에 있는지 몰라도 Munich를 검색해서 Bavaria를 표시해요.',
  'help.guide.search-place.step.1':
    '검색창에 도시, 명소, 주소를 입력하세요. 국가가 먼저 나오고, 일치하는 장소는 그 아래 ‘장소’에 나와요.',
  'help.guide.search-place.step.2': '장소를 고르세요. 지도가 그곳으로 이동하고 그 지점이 속한 지역을 찾아요.',
  'help.guide.search-place.step.3':
    '그 지역에 “방문으로 표시”를 선택하거나, 아직 가 보지 않았다면 “버킷 리스트에 추가”를 선택하세요.',
  'help.guide.search-place.result':
    '지역이 표시되고 나라도 함께 표시돼요. 지도 데이터에 지역 정보가 없는 나라는 나라 자체가 표시돼요.',
  'help.guide.search-place.tip.1': '장소는 TREK의 다른 화면과 같은 검색을 쓰므로 관리자가 설정한 제공자를 사용해요.',
  // bucket-country
  'help.guide.bucket-country.title': '나라를 버킷 리스트에 추가하기',
  'help.guide.bucket-country.goal': '다녀온 국가와 따로, 가고 싶은 국가 목록을 지도에 둬요.',
  'help.guide.bucket-country.step.1': '국가를 검색해서 고르거나 지도에서 클릭하세요.',
  'help.guide.bucket-country.step.2': '‘버킷 리스트에 추가’를 고르세요.',
  'help.guide.bucket-country.step.3': '언제 갈지 이미 정했다면 월과 연도를 고른 뒤 “버킷 리스트에 추가”로 확인하세요.',
  'help.guide.bucket-country.result':
    '그 나라는 방문한 뒤 갖게 될 색의 빗금으로 표시되고, 패널의 “버킷 리스트” 탭에 나타나요.',
  'help.guide.bucket-country.tip.1': '나라가 목록에 들어가면 같은 팝업에 “버킷 리스트에서 제거”가 나와요.',
  'help.guide.bucket-country.tip.2':
    '목표 날짜마다 항목이 하나씩이에요. 같은 나라를 서로 다른 두 달로 넣을 수는 있지만, 같은 달로 두 번 넣을 수는 없어요.',
  // bucket-place
  'help.guide.bucket-place.title': '버킷 리스트에 장소 추가하기',
  'help.guide.bucket-place.goal': '가고 싶은 도시, 명소, 주소를 좌표와 목표 날짜와 함께 저장해요.',
  'help.guide.bucket-place.step.1': '아래쪽 패널에서 ‘버킷 리스트’ 탭을 여세요.',
  'help.guide.bucket-place.step.2': '“장소 추가”를 클릭하세요.',
  'help.guide.bucket-place.step.3':
    '이름을 입력하고 검색 버튼을 누른 뒤 일치하는 결과를 고르면 장소에 좌표가 들어가요. 검색 없이 이름만 입력해도 돼요.',
  'help.guide.bucket-place.step.4': '원하면 월과 연도를 고르고 “추가”를 클릭하세요.',
  'help.guide.bucket-place.result':
    '장소가 목표 날짜와 함께 버킷 리스트 맨 위에 보여요. 마우스를 올리면 삭제용 ×가 나타나요.',
  'help.guide.bucket-place.tip.1':
    '위시에 좌표가 있어야 나중에 Dawarich가 완료로 표시할 수 있어요. 기록에서 내가 그곳에 갔던 게 확인되면 표시해 줘요.',
  // stats
  'help.guide.stats.title': '통계 보기',
  'help.guide.stats.goal': '패널의 숫자가 무엇을 세고 무엇을 세지 않는지 알아봐요.',
  'help.guide.stats.step.1':
    '‘국가’는 실제로 다녀온 서로 다른 국가 수예요. 예정된 국가는 숫자 아래에 따로 보이고 여기에 포함되지 않아요. ‘지역’은 다녀온 주와 도의 수예요. ‘여행’, ‘장소’, ‘일’은 모든 여행을 합친 값이에요. ‘도시’는 장소 주소로 계산하므로 추정치예요.',
  'help.guide.stats.step.2':
    '대륙별로 다녀온 국가 수가 나와요. 남극은 다녀온 뒤에 줄에 나타나요. 이어서 연속 기록(여행이 한 번 이상 있었던 연속 연도 수)과 올해 다녀온 여행 수가 보여요.',
  'help.guide.stats.result': '여행을 계획하면 숫자가 자동으로 업데이트돼요. 여기서 따로 관리할 건 없어요.',
  'help.guide.stats.tip.1':
    '도시는 따로 조회하지 않고 주소 텍스트에서 가져와요. 그래서 “Osteria Francescana, Italy”처럼 짧은 주소나 도·현 단위로 끝나는 주소는 도시가 아니라 지역으로 집계될 수 있어요.',
  'help.guide.stats.tip.2': '직접 표시한 나라는 “국가”와 대륙 수에는 집계되지만 여행, 장소, 일수는 늘지 않아요.',
  // dawarich-countries
  'help.guide.dawarich-countries.title': '기록에서 나라 추가하기',
  'help.guide.dawarich-countries.goal': 'Dawarich로 지난 1년 동안 있었던 국가를 찾고, 확인한 국가를 지도에 추가해요.',
  'help.guide.dawarich-countries.step.1':
    'Dawarich 애드온이 연결돼 있으면 지도 아래쪽 통계 왼쪽에 타일 두 개가 있는 Dawarich 패널이 나타나요. ‘국가’를 클릭하세요.',
  'help.guide.dawarich-countries.step.2':
    '창이 ‘국가’ 탭으로 열려요. ‘국가 찾기’를 클릭하세요. TREK가 최근 12개월 기록에 있는 국가와 도시를 한 달씩 읽어서 조금 걸릴 수 있어요. 아직 Atlas에 없는 국가가 국기, 도시 수, 첫 도시 이름과 함께 나오고, 모두 기본으로 체크돼 있어요. 빼려면 줄을 클릭하세요.',
  'help.guide.dawarich-countries.step.3':
    '오른쪽 아래 버튼으로 확인하세요. 다섯 행을 체크하면 버튼에 “국가 5곳 추가”라고 표시돼요. 대화 상자에 몇 곳이 추가됐는지 나오고, 대화 상자를 닫으면 지도는 이미 업데이트되어 있어요.',
  'help.guide.dawarich-countries.result':
    '확인한 나라가 지도에 색칠되고 “국가”에 집계되며, Dawarich에서 가져온 것으로 기록돼요. 직접 표시한 나라는 바뀌지 않아요.',
  'help.guide.dawarich-countries.tip.1':
    'Atlas에 이미 방문한 나라로 표시된 곳은 직접 표시했든, 여행에서 왔든, 이전 확인에서 왔든 제외돼요. 그래서 내가 한 표시는 바뀌지 않아요. 예전에 Atlas에서 지운 나라는 여기서 확인하면 다시 추가돼요.',
  'help.guide.dawarich-countries.tip.2':
    'TREK이 나라 이름을 매칭하지 못하면 그 이름은 버리지 않고 행 아래에 표시돼요. “다시 확인”을 누르면 Dawarich에 다시 요청해요. 목록 아래 안내에 최근 12개월을 확인했다고 나와요. 이 기간은 바꿀 수 없어요.',
  // dawarich-wishes
  'help.guide.dawarich-wishes.title': '기록으로 위시리스트 체크하기',
  'help.guide.dawarich-wishes.goal': '버킷 리스트 중 실제로 가 본 곳을 찾아서, 간 날짜와 함께 다녀옴으로 표시해요.',
  'help.guide.dawarich-wishes.step.1': '지도 아래쪽 통계 왼쪽의 Dawarich 패널에서 ‘위시리스트’를 클릭하세요.',
  'help.guide.dawarich-wishes.step.2':
    '대화 상자가 “위시리스트” 탭으로 열려요. “위시리스트 확인”을 클릭하면 TREK이 좌표가 있는 모든 항목을 기준으로 기록을 살펴봐요. 도달한 위시는 얼마나 가까이 갔는지, 얼마나 머물렀는지, 어느 날이었는지와 함께 표시되고 기본으로 체크되어 있어요. 이미 완료 처리한 항목에는 “이미 완료 처리됨”이 표시돼요. 목록 아래 안내에는 좌표가 없는 항목 수와 함께 기준이 나와요: 250 m 이내에서 20분 이상 머무르면 도달한 것으로 봐요.',
  'help.guide.dawarich-wishes.step.3':
    '오른쪽 아래 버튼으로 확인하세요. 두 행을 체크하면 버튼에 “2개 완료 처리”라고 표시돼요. 그런 다음 대화 상자를 닫고 옆 패널의 “버킷 리스트” 탭을 여세요.',
  'help.guide.dawarich-wishes.result':
    '위시마다 오늘 날짜가 아니라 머문 날짜가 적힌 초록색 체크가 붙어요. 툴팁에는 “Dawarich 기록을 바탕으로 완료 처리됨”이라고 나와요. 날짜를 클릭하면 되돌릴 수 있어요.',
  'help.guide.dawarich-wishes.tip.1':
    '차로 지나간 건 포함되지 않아요. 장소 가까이에서 일정 시간 머물러야 해요. 조건을 채운 방문이 여러 번이면 가장 오래 머문 방문을 써요. 좌표가 없는 위시는 확인할 수 없으니, 이름만 넣지 말고 “장소 추가”의 검색으로 장소를 추가하세요.',
  'help.guide.dawarich-wishes.tip.2':
    '한 번 확인할 때 최대 50개 항목을 보고, 아직 체크하지 않은 것부터 봐요. 더 있으면 TREK가 알려 줘요. 이미 체크한 항목은 원래 날짜를 그대로 유지해요.',

  // ── Screen: collections ───────────────────────────────────────────────────────────────
  'help.ctx.collections.title': '컬렉션',
  'help.ctx.collections.summary':
    '컬렉션은 여행 밖에 있는 내 라이브러리예요: 찾아서 간직하고 싶은 장소를 이름 붙인 목록으로 모으고, 장소마다 ‘아이디어’, ‘가고 싶은 곳’, ‘방문함’ 상태가 있어요. 투어가 켜져 있으면 여행에서 저장한 투어 전체도 담을 수 있어요. 장소와 투어는 여행과 연결되지 않고 복사만 되기 때문에, 목록과 여행은 서로 영향을 주지 않아요.',
  'help.ctx.collections.bullet.1':
    '왼쪽 목록 열에 내 목록, 나와 공유된 목록, 아직 답하지 않은 초대, 그리고 내가 소유한 목록을 모두 합친 ‘모든 저장 항목’이 있어요. 맨 위에 ‘새 목록’과 파일 가져오기가 있어요.',
  'help.ctx.collections.bullet.2':
    '열린 목록의 상단에는 색, 커버, 설명, 링크, 멤버가 있고, 오른쪽에 ‘편집’(소유자만), ‘내보내기’, ‘공유’가 있어요. 나와 공유된 목록이면 ‘공유’ 버튼에 ‘공유됨’이 표시돼요.',
  'help.ctx.collections.bullet.3':
    '장소 위의 필터 줄: 장소를 추가하는 +, ‘상태’, ‘카테고리’, ‘평점’, ‘정렬’ 드롭다운, ‘선택’용 체크박스 아이콘, ‘여행에서 가져오기’용 구름 아이콘이 있어요. 레이블 필터는 지도가 보이지 않을 때만 이 줄에 나와요.',
  'help.ctx.collections.bullet.4':
    '장소 줄: 사진, 이름과 주소, 레이블과 카테고리, 오른쪽의 상태 버튼. 상태 버튼을 한 번 클릭하면 다음 상태로 바뀌어요.',
  'help.ctx.collections.bullet.5':
    '오른쪽 지도: 좌표가 있는 장소마다 핀이 있어요. 위쪽 바에는 ‘지도 확대’(지도가 꽉 차면 ‘목록 표시’), 레이블 관리 버튼이 있는 레이블 필터, ‘장소 검색’ 칸이 있어요. 핀을 클릭하면 그 장소가 열려요.',
  'help.ctx.collections.bullet.6':
    '상세 시트: 줄을 클릭하면 커버, 카테고리, 상태, 별점, 레이블, 설명, 링크가 보여요. 커버의 카메라로 사진을 바꿔요. 맨 아래에 ‘편집’, ‘여행에 복사’, 내비게이션 버튼, ‘목록에서 제거’가 있어요.',
  // create-list
  'help.guide.create-list.title': '목록 만들기',
  'help.guide.create-list.goal': '이름, 색, 커버를 정해 새 목록을 만들고 장소를 담을 준비를 해요.',
  'help.guide.create-list.step.1': '목록 사이드바 맨 위의 “새 목록”을 클릭하세요.',
  'help.guide.create-list.step.2':
    '목록 이름을 정하고 색을 고르세요. 커버 이미지, 설명, 링크는 선택 사항이라 나중에 “편집”으로 추가해도 돼요.',
  'help.guide.create-list.step.3': '‘생성’을 클릭하세요.',
  'help.guide.create-list.result': '목록이 빈 채로 열리고, ‘장소 추가’와 ‘여행에서 가져오기’ 두 가지로 채울 수 있어요.',
  'help.guide.create-list.tip.1': '커버는 직접 올린 사진이나 같은 창의 Unsplash 검색으로 찾은 사진을 쓸 수 있어요.',
  // add-place
  'help.guide.add-place.title': '장소 추가하기',
  'help.guide.add-place.goal': '장소를 찾아 이름, 카테고리, 상태, 메모와 함께 열린 목록에 한 번에 저장해요.',
  'help.guide.add-place.step.1':
    '장소 위 필터 줄 맨 앞의 +를 클릭하세요. 아직 비어 있는 목록이면 페이지 가운데의 ‘장소 추가’를 클릭하세요.',
  'help.guide.add-place.step.2': '검색창에 장소를 입력하고 결과를 고르세요. 이름, 주소, 좌표가 결과에서 채워져요.',
  'help.guide.add-place.step.3':
    '상태를 정하고, 원하면 카테고리, 설명, 링크도 넣은 뒤 “추가”를 클릭하세요. 다음 장소를 넣을 수 있게 대화 상자가 열린 채로 있고, “취소”를 누르면 닫혀요.',
  'help.guide.add-place.result': '장소가 목록에 나타나고, 좌표가 있으면 지도에도 핀으로 보여요.',
  'help.guide.add-place.tip.1':
    '여행 안에서는 장소 상세나 장소 메뉴의 ‘컬렉션에 저장’으로 여행을 벗어나지 않고 여행 장소를 목록에 넣을 수 있어요.',
  'help.guide.add-place.tip.2':
    '내 목록이거나 내가 편집자 또는 관리자인 목록이어야 해요. ‘모든 저장 항목’이나 보기만 가능한 목록에는 +가 없어요.',
  // import-from-trip
  'help.guide.import-from-trip.title': '여행에서 장소 가져오기',
  'help.guide.import-from-trip.goal': '장소를 하나씩 저장하지 말고 여행의 장소를 한 번에 목록으로 가져와요.',
  'help.guide.import-from-trip.step.1':
    '필터 줄에서 구름 화살표 모양의 가져오기 버튼을 클릭하세요. 빈 목록에서는 같은 버튼이 “장소 추가” 옆에 있어요.',
  'help.guide.import-from-trip.step.2': '내 여행 중 하나를 고르세요.',
  'help.guide.import-from-trip.step.3':
    '원하는 장소를 체크하세요. 이미 목록에 있는 장소는 회색으로 보여요. 처음에는 여행의 어느 날에도 들어가지 않은 장소가 선택돼 있고, 모든 장소가 이미 어떤 날에 들어가 있으면 새 장소 전체가 선택돼요. ‘새 항목만’을 켜면 목록에 이미 있는 장소가 숨겨져요.',
  'help.guide.import-from-trip.step.4': '“가져오기”를 클릭하세요. 버튼에 추가될 개수가 항상 표시돼요.',
  'help.guide.import-from-trip.result':
    '장소가 이름, 주소, 좌표, 설명, 카테고리와 함께 목록으로 복사돼요. 여행은 바뀌지 않아요.',
  'help.guide.import-from-trip.tip.1':
    '이름이나 좌표가 같은 중복은 TREK가 자동으로 건너뛰어서, 두 번 가져와도 괜찮아요.',
  'help.guide.import-from-trip.tip.2':
    '여행의 장소 목록에서는 선택 모드의 ‘컬렉션에 저장’으로 직접 고른 장소만 저장할 수도 있어요.',
  // place-status
  'help.guide.place-status.title': '장소 상태 정하기',
  'help.guide.place-status.goal': '아이디어 단계인 곳, 후보에 오른 곳, 다녀온 곳을 구분해 관리해요.',
  'help.guide.place-status.step.1':
    '장소 행 오른쪽 끝의 상태 배지를 클릭하세요. “아이디어”가 “가고 싶은 곳”으로 바뀌어요.',
  'help.guide.place-status.step.2': '한 번 더 클릭하면 “방문함”이 되고, 다시 클릭하면 “아이디어”로 돌아가요.',
  'help.guide.place-status.result': '상태 버튼과 색이 바로 바뀌고, 목록 위 상태 필터의 개수도 바뀌어요.',
  'help.guide.place-status.tip.1': '상태는 컬렉션에만 있어요. 장소를 여행에 복사해도 상태는 복사되지 않아요.',
  'help.guide.place-status.tip.2':
    '여행에서 ‘컬렉션에 저장’을 누르면 ‘목록에 저장’이 열리고, 장소가 들어 있는 목록마다 상태 버튼이 보여요. 장소 패널의 선택 바에는 ‘내 목록에서 방문함으로 표시’가 있어요.',
  // place-detail
  'help.guide.place-detail.title': '저장한 장소 열기',
  'help.guide.place-detail.goal': '장소의 모든 정보와 할 수 있는 작업을 확인해요: 편집, 여행으로 복사, 길 찾기, 삭제.',
  'help.guide.place-detail.step.1': '장소 줄을 클릭하세요. 목록 옆에 상세 시트가 열리고 지도가 그 장소로 이동해요.',
  'help.guide.place-detail.step.2':
    '맨 아래에 ‘편집’, ‘여행에 복사’, 지도 앱에서 장소를 여는 내비게이션 버튼, ‘목록에서 제거’가 있어요. 커버의 카메라로 자동 사진을 내 사진으로 바꿔요.',
  'help.guide.place-detail.result':
    '“편집”을 누르면 시트에서 바로 이름, 카테고리, 라벨, 주소, 좌표, 설명, 링크를 바꿀 수 있어요.',
  'help.guide.place-detail.tip.1':
    '장소에 자체 사진이 없으면 커버를 자동으로 가져와요. 직접 올리는 사진은 JPG, PNG, GIF, WebP, HEIC 형식으로 20MB까지 돼요. 카메라 옆 휴지통 아이콘으로 자동 사진으로 되돌려요.',
  'help.guide.place-detail.tip.2':
    '나를 포함한 모든 멤버가 상태 아래에 별점을 남길 수 있어요. 필터 줄의 ‘평점’ 필터는 평균을 써요.',
  // labels
  'help.guide.labels.title': '라벨로 장소 묶기',
  'help.guide.labels.goal': '공통 카테고리와 별도로, 동네나 날짜처럼 목록만의 라벨을 붙여요.',
  'help.guide.labels.step.1':
    '지도 위 레이블 옆의 ‘레이블 추가’를 클릭하세요(목록에 레이블이 있으면 ‘레이블 관리’). 지도가 보이지 않으면 버튼은 필터 줄 끝에 있어요.',
  'help.guide.labels.step.2':
    '이름을 입력하고 색을 고른 뒤 “레이블 추가”를 클릭하세요. 기존 라벨의 이름이나 색을 바꾸거나 삭제하는 것도 같은 대화 상자에서 해요.',
  'help.guide.labels.step.3':
    '‘선택’을 켜고 장소를 체크한 뒤 선택 바에서 ‘레이블 지정’을 클릭하세요. 레이블을 고르고 ‘레이블 지정’으로 확정하면 돼요. 장소 하나만이라면 상세 시트의 ‘편집’에서도 레이블을 추가할 수 있어요.',
  'help.guide.labels.step.4':
    '지도 위의 레이블을 하나 이상 클릭하면, 그중 하나라도 붙은 장소만 목록과 지도에 보여요. 레이블을 다시 클릭하면 필터에서 빠져요.',
  'help.guide.labels.result':
    '레이블이 붙은 장소는 줄에 레이블이 보여요. 레이블 필터는 뷰어를 포함한 모든 멤버가 쓸 수 있어요.',
  'help.guide.labels.tip.1': '레이블은 만든 목록에 속해요. 장소를 다른 목록으로 옮기면 레이블은 빠져요.',
  'help.guide.labels.tip.2': '레이블을 관리하고 지정하려면 목록 편집 권한이 필요해요.',
  // filter-select
  'help.guide.filter-select.title': '장소 필터링하고 선택하기',
  'help.guide.filter-select.goal': '목록을 필터링하고 여러 장소를 한 번에 바꿔요.',
  'help.guide.filter-select.step.1':
    '필터 줄의 드롭다운을 쓰세요: 상태, 카테고리, 최소 평점, 정렬 순서. 상태와 카테고리에는 선택지마다 해당하는 장소 수가 보여요.',
  'help.guide.filter-select.step.2':
    '드롭다운 뒤의 체크박스 아이콘 ‘선택’을 클릭하세요. 줄마다 체크박스가 생기고 선택 바가 나타나요.',
  'help.guide.filter-select.step.3':
    '장소를 체크하거나 ‘모두 선택’으로 필터에 보이는 장소를 모두 고른 뒤 ‘레이블 지정’, ‘목록으로 이동’, ‘목록에 복제’, ‘여행에 복사’, ‘삭제’ 중 하나를 고르세요. 이동과 삭제는 목록 소유자나 관리자만 할 수 있어요.',
  'help.guide.filter-select.result':
    '선택한 장소 전체에 작업이 한 번에 적용돼요. 오른쪽의 ×를 누르면 선택 모드가 닫혀요.',
  'help.guide.filter-select.tip.1':
    '“모두 선택”은 필터에 맞는 장소만 선택해요. “가고 싶은 곳” 전체를 처리하려면 “가고 싶은 곳”으로 필터링한 다음 “모두 선택”을 클릭하세요.',
  // copy-to-trip
  'help.guide.copy-to-trip.title': '장소를 여행에 복사하기',
  'help.guide.copy-to-trip.goal': '저장한 장소를 내 여행에 들를 곳으로 추가해요.',
  'help.guide.copy-to-trip.step.1':
    '‘선택’을 켜고 장소를 체크하거나, 장소 하나를 열어 상세 시트의 ‘여행에 복사’를 쓰세요.',
  'help.guide.copy-to-trip.step.2': '선택 바에서 “여행에 복사”를 클릭하세요.',
  'help.guide.copy-to-trip.step.3': '여행을 고르세요. 목록이 길면 검색창으로 좁힐 수 있어요.',
  'help.guide.copy-to-trip.result':
    '장소가 이름, 설명, 카테고리, 메모, 가격, 좌표, 사진, 태그와 함께 그 여행의 장소 목록에 추가돼요. 컬렉션은 바뀌지 않아요.',
  'help.guide.copy-to-trip.tip.1': '공유 목록의 뷰어도 할 수 있어요. 목록의 장소를 복사할 뿐 목록은 바뀌지 않아요.',
  // share-list
  'help.guide.share-list.title': '목록 공유하기',
  'help.guide.share-list.goal': '이 TREK의 다른 사람들과 실시간으로 목록을 함께 계획해요.',
  'help.guide.share-list.step.1': '내 목록 헤더의 ‘공유’를 클릭하세요.',
  'help.guide.share-list.step.2': '사용자를 고르고 역할을 정하세요: “뷰어”, “편집자”, “관리자”.',
  'help.guide.share-list.step.3':
    '‘초대 보내기’를 클릭하세요. 상대방이 목록 레일이나 알림에서 초대를 수락할 때까지 대기 중으로 보여요.',
  'help.guide.share-list.result':
    '상대가 수락하면 그 사람의 “공유됨”에 목록이 나타나고, 모든 변경이 실시간으로 동기화돼요. 멤버와 역할은 같은 대화 상자에서 계속 바꿀 수 있어요.',
  'help.guide.share-list.tip.1':
    '‘뷰어’는 보고, 평점을 매기고, 장소를 자기 여행으로 복사할 수 있어요. ‘편집자’는 장소와 레이블을 추가하고 편집해요. ‘관리자’는 이동과 삭제도 할 수 있어요.',
  'help.guide.share-list.tip.2':
    '사람을 초대하거나 내보내는 건 소유자만 할 수 있어요. 멤버는 공유 목록에서 직접 나갈 수 있어요.',
  // export-list
  'help.guide.export-list.title': '목록을 파일로 내보내기',
  'help.guide.export-list.goal': '다른 TREK 서버를 쓰는 사람에게 목록을 주거나, 지도 앱에서 열어요.',
  'help.guide.export-list.step.1': '목록 헤더의 ‘내보내기’를 클릭하세요.',
  'help.guide.export-list.step.2':
    '다른 TREK에서 레이블과 상태까지 쓰려면 ‘TREK 목록’을, OsmAnd, Organic Maps, Garmin처럼 웨이포인트를 읽는 앱에서 쓰려면 GPX를 고르세요.',
  'help.guide.export-list.result': '파일이 다운로드돼요. 공유 목록의 멤버라면 누구나 내보낼 수 있어요.',
  'help.guide.export-list.tip.1':
    '좌표가 없는 장소는 GPX 웨이포인트로 만들 수 없어서 빠져요. 몇 개가 빠졌는지 TREK이 알려 줘요.',
  'help.guide.export-list.tip.2':
    '평점, 멤버, 업로드한 사진은 일부러 내보내지 않아요. 목록이 아니라 이 TREK에 속한 정보이기 때문이에요.',
  // import-file
  'help.guide.import-file.title': '파일에서 목록 가져오기',
  'help.guide.import-file.goal': 'TREK 목록 파일이나 GPX 파일을 새 목록으로, 또는 기존 목록에 가져와요.',
  'help.guide.import-file.step.1': '목록 레일의 ‘새 목록’ 옆, 업로드 화살표가 있는 가져오기 버튼을 클릭하세요.',
  'help.guide.import-file.step.2':
    '파일을 고르세요. 가져오기 전에 TREK가 파일 내용을 보여 줘요: 이름, 장소 수, 레이블 수.',
  'help.guide.import-file.step.3':
    '‘새 목록’을 그대로 두고 원하면 이름을 바꾼 뒤 ‘가져오기’를 클릭하세요. 또는 ‘목록에 추가’를 골라 편집할 수 있는 목록에 장소를 넣고 ‘리스트에 추가’를 클릭하세요.',
  'help.guide.import-file.result':
    '가져온 장소가 담긴 목록이 열려요. 목록으로 가져오면 장소가 추가되기만 해요. 이미 있던 장소의 상태, 메모, 라벨은 그대로예요.',
  'help.guide.import-file.tip.1':
    'GPX에서는 이름이 있는 웨이포인트가 모두 장소가 돼요. 트랙은 선이라서 제외되고, 그게 몇 개였는지 미리 보기에 나와요.',
  'help.guide.import-file.tip.2':
    'TREK 목록도 GPX도 아닌 파일은 거부되고, TREK이 이유를 알려 줘요. 장소 하나를 읽을 수 없으면 파일 전체가 아니라 그 장소만 건너뛰어요.',
  // edit-list
  'help.guide.edit-list.title': '목록 편집하거나 삭제하기',
  'help.guide.edit-list.goal': '목록 이름, 색, 커버, 설명, 링크를 바꾸거나 목록을 삭제해요.',
  'help.guide.edit-list.step.1': '목록 헤더의 ‘편집’을 클릭하세요. 소유자에게만 보여요.',
  'help.guide.edit-list.step.2':
    '원하는 내용을 바꾸고 ‘저장’을 클릭하세요. 왼쪽 아래 휴지통 아이콘인 ‘목록 삭제’를 누르면 확인 후 목록과 그 안의 모든 장소가 삭제돼요.',
  'help.guide.edit-list.result': '상단 헤더에 새 색, 커버, 설명이 바로 반영돼요.',
  'help.guide.edit-list.tip.1': '목록 삭제는 되돌릴 수 없어요. 사본을 남기려면 먼저 내보내세요.',
  // all-saved
  'help.guide.all-saved.title': '라이브러리 전체 검색하기',
  'help.guide.all-saved.goal': '내가 소유한 모든 목록의 장소를 한 번에 봐요.',
  'help.guide.all-saved.step.1':
    '목록 레일에서 ‘모든 저장 항목’을 클릭하세요. 내가 소유하거나 함께 소유한 모든 목록의 장소를 한 화면에 보여 줘요.',
  'help.guide.all-saved.step.2':
    '지도 위 ‘장소 검색’에 입력하고 다른 목록처럼 필터를 쓰세요. 여기서도 ‘선택’을 쓸 수 있어요: 여러 목록에 걸쳐 이동, 복제, 여행으로 복사, 삭제.',
  'help.guide.all-saved.result':
    '저장한 모든 장소를 한곳에서 볼 수 있어요. 추가할 목록이 하나로 정해지지 않아서 여기서는 장소를 추가하거나 가져올 수 없어요.',
  'help.guide.all-saved.tip.1': '레이블과 저장한 투어는 목록마다 따로라서 ‘모든 저장 항목’에서는 둘 다 쓸 수 없어요.',

  // ── Screen: journey ───────────────────────────────────────────────────────────────────
  'help.ctx.journey.title': '여정',
  'help.ctx.journey.summary':
    'Journey는 사진 중심의 여행 일기예요. Journey마다 여행 하나 이상과 연결되고, 이야기, 사진, 기분, 날씨가 담긴 항목으로 하루하루 채워요. 이 화면에 내 Journey가 나오고, 하나를 열어 쓰면 돼요.',
  'help.ctx.journey.bullet.1':
    '맨 위 배너에 진행 중이거나 가장 최근의 Journey가 항목, 사진, 장소 수와 함께 보여요. ‘계속 쓰기’로 오늘 날짜에서 열어요. 여행이 막 끝났다면 그 위의 ‘여행이 방금 종료됨’ 배너에서 그 여행을 Journey로 만들자고 제안해요.',
  'help.ctx.journey.bullet.2':
    '‘모든 Journey’ 아래에는 Journey마다 카드가 하나씩 있고 커버, 상태, 날짜, 개수가 보여요. 배너에 나온 Journey는 여기에 다시 나오지 않아요. 카드를 클릭하면 열려요.',
  'help.ctx.journey.bullet.3': '그리드의 마지막 카드 ‘새 Journey 만들기’로 여행에서 Journey를 시작해요.',
  // create-journey
  'help.guide.create-journey.title': 'Journey 만들기',
  'help.guide.create-journey.goal': '여행의 일기를 시작해요. 여행의 장소가 이미 제안으로 들어가 있어요.',
  'help.guide.create-journey.step.1': '격자의 마지막 카드 “새 Journey 만들기”를 클릭하세요.',
  'help.guide.create-journey.step.2':
    '이름을 정하고, 원하면 부제목도 넣은 뒤 연결할 여행을 체크하세요. 카운터에 추가될 장소 수가 나와요.',
  'help.guide.create-journey.step.3': '‘Journey 만들기’를 클릭하세요.',
  'help.guide.create-journey.result':
    '일기가 열려요. 연결된 여행의 모든 장소가 계획된 날마다 한 번씩 타임라인에 제안으로 나타나고, 각각에 기록을 쓸 수 있어요.',
  'help.guide.create-journey.tip.1': '여행은 나중에 ‘Journey 설정’에서 더 연결할 수 있어요.',
  'help.guide.create-journey.tip.2': '여행 없는 Journey도 만들 수 있어요. 그때는 항목을 직접 추가해요.',
  // open-journey
  'help.guide.open-journey.title': 'Journey 열기',
  'help.guide.open-journey.goal': '일기를 열고 어디서 열리는지 확인해요.',
  'help.guide.open-journey.step.1':
    '카드를 클릭하세요. 카드마다 커버, 날짜, 그리고 Journey에 담긴 기록, 사진, 장소 수가 나와요.',
  'help.guide.open-journey.result':
    '진행 중인 Journey는 오늘 날짜로 열리고, 오늘 쓴 항목이 아직 없으면 오늘 전의 마지막 항목에서 열려요. 끝난 Journey는 처음부터 열려요.',
  'help.guide.open-journey.tip.1': '‘Journey 설정’에서 따로 정하지 않으면 Journey의 첫 사진이 커버가 돼요.',
  // continue-writing
  'help.guide.continue-writing.title': '진행 중인 Journey 이어 쓰기',
  'help.guide.continue-writing.goal': '진행 중인 Journey의 오늘 페이지를 바로 열어요.',
  'help.guide.continue-writing.step.1':
    '상단 배너의 “계속 쓰기”를 클릭하세요. 배너에는 진행 중인 Journey가, 진행 중인 게 없으면 가장 최근 Journey가 표시돼요.',
  'help.guide.continue-writing.result':
    '일기가 오늘 날짜로 열려요. 아직 쓴 게 없으면 오늘 이전의 마지막 기록에서 열려요.',
  'help.guide.continue-writing.tip.1':
    '여행이 막 끝났다면 이 배너 위에 ‘여행이 방금 종료됨’ 배너가 보여요. ‘Journey 만들기’는 그 여행이 선택된 Journey를 시작하고, ‘닫기’는 이 브라우저에서 제안을 숨겨요.',

  // ── Screen: journey-detail ────────────────────────────────────────────────────────────
  'help.ctx.journey-detail.title': 'Journey',
  'help.ctx.journey-detail.summary':
    '열린 Journey 하나예요: 왼쪽에 날짜별 타임라인, 오른쪽에 계획, 기록, 항목, 사진 레이어를 켜고 끌 수 있는 지도가 있어요. 헤더에는 개수, 스튜디오, 제안 스위치, ‘Journey 설정’용 ⋯가 있어요. 그 아래 도구 모음으로 항목을 추가해요.',
  'help.ctx.journey-detail.bullet.1':
    '헤더: 뒤로 화살표와 상태 배지, 커버, 제목과 부제, 날, 장소, 항목, 사진 개수, 그리고 오른쪽에 스튜디오, 제안을 숨기거나 보여 주는 눈 아이콘, ‘Journey 설정’용 ⋯가 있어요.',
  'help.ctx.journey-detail.bullet.2':
    '도구 모음: ‘타임라인’과 ‘갤러리’ 탭, ‘이 여행에서 검색’, ‘항목 추가’. ‘갤러리’에서는 ‘항목 추가’ 대신 ‘업로드’가 있어요.',
  'help.ctx.journey-detail.bullet.3':
    '‘타임라인’: 날마다 번호, 장소 수, 그날 항목을 추가하는 +가 있는 섹션이 있어요. 그 아래에 사진, 기분, 날씨, 이야기가 담긴 항목 카드와 여행에서 온 점선 제안 카드가 있고, 제안 카드마다 닫는 ×가 있어요.',
  'help.ctx.journey-detail.bullet.4':
    '지도: 위쪽 레이어 바로 ‘계획’(속이 빈 핀과 여행의 점선 GPX 경로), ‘기록’(Dawarich에서 저장한 실선 경로), ‘항목’(날짜순 가는 점선으로 이어진 날짜 색 핀), ‘사진’을 켜고 꺼요. 옆의 (i)에서 모든 기호를 설명해요.',
  'help.ctx.journey-detail.bullet.5':
    '‘Journey 설정’(⋯): 커버, 이름과 부제, 상태, GPX 트랙, 기록된 날, 사진으로 만든 장소, 항목 필드, 숨긴 제안, 동기화된 여행, 기여자와 여행 멤버 중 누가 접근할지, 공개 공유, 보관과 삭제.',
  'help.ctx.journey-detail.bullet.6':
    '긴 타임라인 맨 아래에는 ‘맨 위로’, 원하는 날이나 항목으로 바로 가는 일수 표시, ‘마지막 기록으로’가 있어요.',
  // add-entry
  'help.guide.add-entry.title': '항목 쓰기',
  'help.guide.add-entry.goal': '제목, 본문, 기분, 날씨로 하루의 이야기를 남겨요.',
  'help.guide.add-entry.step.1':
    '도구 모음의 ‘항목 추가’를 클릭하거나, 날 헤더 오른쪽 끝의 +를 눌러 그날에서 시작하세요.',
  'help.guide.add-entry.step.2':
    '항목에 제목을 붙이고 글을 쓰세요. 글 위 도구 모음으로 굵게, 기울임, 제목, 인용, 링크, 목록을 Markdown으로 넣어요.',
  'help.guide.add-entry.step.3':
    '오른쪽 열에서 날짜와 시간을 확인하고, 위치를 검색하거나 현재 위치를 쓰고, 기분과 날씨를 고르세요.',
  'help.guide.add-entry.step.4': '“저장”을 클릭하세요.',
  'help.guide.add-entry.result': '기록이 타임라인의 해당 날짜와 지도의 핀으로 나타나요. 헤더의 개수도 업데이트돼요.',
  'help.guide.add-entry.tip.1': '제안에 기록을 쓸 때도 같은 편집기를 쓰고, 장소는 이미 정해져 있어요.',
  'help.guide.add-entry.tip.2':
    '장소가 있는 항목에는 ‘경로에서 제외’ 옵션이 있어요. 항목은 Journey에 남지만 거리와 국가에 포함되지 않고, 스튜디오 지도에도 보이지 않아요.',
  // entry-photos
  'help.guide.entry-photos.title': '기록에 사진과 동영상 추가하기',
  'help.guide.entry-photos.goal': '하루에 사진을 추가해요. 첫 사진이 항목의 커버가 돼요.',
  'help.guide.entry-photos.step.1': '항목 카드의 ⋯로 메뉴를 열고 ‘편집’을 고르세요.',
  'help.guide.entry-photos.step.2':
    '‘사진 업로드’를 클릭하고 파일을 고르세요. ‘갤러리에서’는 이미 Journey 갤러리에 있는 사진을 가져오고, 외부 사진은 연결된 Immich나 Synology 라이브러리에서 그날 사진을 찾아요.',
  'help.guide.entry-photos.step.3':
    '사진에 마우스를 올리고 “1번째로 설정”을 클릭해 커버를 고른 다음 “저장”을 클릭하세요.',
  'help.guide.entry-photos.result': '사진이 카드와 갤러리에 표시되고, 첫 번째 사진이 어디서나 썸네일로 쓰여요.',
  'help.guide.entry-photos.tip.1':
    '동영상도 같은 방법으로 기록에 추가해요. mp4, m4v, webm, mov 파일을 500MB까지 올릴 수 있고, 원본 그대로 저장돼요.',
  'help.guide.entry-photos.tip.2':
    'iPhone의 HEIC 파일은 업로드할 때 JPEG로 변환되고, 이때 GPS와 카메라 메타데이터가 지워져요.',
  // suggestions
  'help.guide.suggestions.title': '제안 쓰거나 넘기기',
  'help.guide.suggestions.goal': '여행의 장소를 항목으로 만들고, 쓰지 않을 건 넘겨요.',
  'help.guide.suggestions.step.1':
    '제안은 점선 테두리에 ‘항목 추가’ 버튼이 있는 카드예요. 연결된 여행에서 그날 계획한 장소를 보여 줘요. 클릭하면 장소와 날이 미리 채워진 편집기가 열려요.',
  'help.guide.suggestions.step.2':
    '쓰지 않을 카드 오른쪽 끝의 ×를 클릭하세요. 카드는 삭제되지 않고 타임라인에서만 빠지며, 여행 동기화가 다시 제안하지 않아요.',
  'help.guide.suggestions.step.3':
    '마음이 바뀌었나요? 헤더의 ⋯로 ‘Journey 설정’을 여세요. ‘넘긴 제안 되돌리기’에 개수가 보이고, 누르면 모두 되돌아와요.',
  'help.guide.suggestions.result':
    '타임라인에는 쓰고 싶은 항목만 남아요. 읽는 동안에는 헤더의 눈 아이콘으로 제안을 한 번에 모두 숨길 수 있어요.',
  'help.guide.suggestions.tip.1': '이틀에 걸쳐 계획한 장소는 두 날 모두에 제안이 생겨요.',
  'help.guide.suggestions.tip.2': '제안은 통계에 포함되지 않아요. 직접 쓴 기록만 포함돼요.',
  // add-on-day
  'help.guide.add-on-day.title': '지난 날짜에 기록 추가하기',
  'help.guide.add-on-day.goal': '지난 날의 기록을 나중에 날짜를 고칠 필요 없이 써요.',
  'help.guide.add-on-day.step.1': '그날 헤더 오른쪽 끝의 +를 클릭하세요.',
  'help.guide.add-on-day.step.2': '그 날짜가 정해진 채로 편집기가 열려요. 평소처럼 쓰고 “저장”하세요.',
  'help.guide.add-on-day.result': '항목이 바로 알맞은 날에 들어가요.',
  'help.guide.add-on-day.tip.1':
    '하루 안에서 순서를 바꾸려면 항목에 마우스를 올리세요. 왼쪽에 ‘위로 이동’과 ‘아래로 이동’이 나타나요.',
  // pros-cons
  'help.guide.pros-cons.title': '평가 추가하기',
  'help.guide.pros-cons.goal': '좋았던 점과 아쉬웠던 점으로 하루를 정리해요.',
  'help.guide.pros-cons.step.1':
    '편집기에서 본문 아래의 “장단점”을 찾으세요. “장점”이나 “단점”에 한 가지를 입력하고, 다음 항목은 “더 추가”로 넣으세요.',
  'help.guide.pros-cons.step.2': '저장하세요. 카드에서 ‘더 보기’를 누르면 이야기와 평가가 짧은 목록 두 개로 펼쳐져요.',
  'help.guide.pros-cons.result': '본문 아래에 좋았던 점과 아쉬운 점이 표시되어 한눈에 볼 수 있어요.',
  'help.guide.pros-cons.tip.1': '평가를 쓰지 않는 Journey라면 “Journey 설정”의 “기록 항목”에서 이 섹션을 끌 수 있어요.',
  // search-journey
  'help.guide.search-journey.title': '긴 일기에서 찾기',
  'help.guide.search-journey.goal': '몇 주 치를 스크롤하지 않고 항목을 찾아요.',
  'help.guide.search-journey.step.1':
    '도구 모음의 ‘이 여행에서 검색’에 입력하세요. 입력하는 대로 제목, 이야기, 장소, 태그로 타임라인이 걸러져요. 악센트와 대소문자는 구분하지 않아요.',
  'help.guide.search-journey.step.2':
    '대신 특정 날로 바로 가려면 타임라인 아래쪽 ‘맨 위로’와 ‘마지막 기록으로’ 사이의 일수 표시를 클릭하세요.',
  'help.guide.search-journey.result':
    '타임라인이 고른 날이나 항목으로 스크롤되고 지도도 따라 움직여요. 검색창을 지우기 전까지는 일치하는 항목만 보여요.',
  'help.guide.search-journey.tip.1': '진행 중인 Journey는 오늘 페이지로 열려서, 보통 지금 페이지가 이미 보여요.',
  'help.guide.search-journey.tip.2': '헤더의 눈 아이콘으로 제안을 숨기면 내가 쓴 항목만 보여요.',
  // gallery-map
  'help.guide.gallery-map.title': '갤러리와 지도 둘러보기',
  'help.guide.gallery-map.goal': 'Journey 전체를 사진으로, 그리고 지도 위 장소로 봐요.',
  'help.guide.gallery-map.step.1':
    '도구 모음에서 “갤러리”로 전환하세요. 모든 기록의 사진과 갤러리에 직접 올린 사진이 모두 나와요. 사진을 클릭하면 라이트박스로 열려요.',
  'help.guide.gallery-map.step.2':
    '오른쪽의 ‘업로드’로 갤러리에 사진을 추가해요. Immich나 Synology가 연결돼 있으면 라이브러리 이름이 적힌 버튼으로 거기서 사진을 고를 수 있어요.',
  'help.guide.gallery-map.result':
    '핀은 그날 색으로 보이고, 날짜순으로 가는 점선으로 이어져요. 지도 위쪽 레이어 바로 무엇을 표시할지 바꿔요.',
  'help.guide.gallery-map.tip.1':
    '여행의 GPX 트랙은 지도의 ‘계획’ 레이어에 점선으로 보여요. ‘Journey 설정’의 ‘여행의 모든 GPX 트랙 표시’로 끌 수 있어요.',
  'help.guide.gallery-map.tip.2':
    '“갤러리”와 “지도”를 모두 공유하면 위치 정보가 있는 갤러리 사진이 공개 지도에도 나타나요.',
  // entry-fields
  'help.guide.entry-fields.title': '항목 필드 끄기',
  'help.guide.entry-fields.goal': '이 Journey에서 쓰는 필드만 편집기에 보여 줘요.',
  'help.guide.entry-fields.step.1': '헤더 오른쪽 위의 ⋯를 클릭해 ‘Journey 설정’을 여세요.',
  'help.guide.entry-fields.step.2': '‘기록 항목’에서 ‘기분’, ‘날씨’, ‘좋은 점과 아쉬운 점’을 끄세요.',
  'help.guide.entry-fields.result':
    '편집기에 이 항목들이 더 이상 표시되지 않아요. 쓴 내용은 사라지지 않고, 항목을 다시 켜면 저장된 값이 다시 보여요. 공유한 Journey에서도 같은 항목이 숨겨져요.',
  'help.guide.entry-fields.tip.1': '스위치는 Journey마다 따로 적용돼서 출장과 휴가를 다르게 설정할 수 있어요.',
  // link-trip
  'help.guide.link-trip.title': '다른 여행 연결하기',
  'help.guide.link-trip.goal': '두 번째 여행의 장소를 일기에 제안으로 추가해요.',
  'help.guide.link-trip.step.1': '헤더 오른쪽 위의 ⋯를 클릭해 ‘Journey 설정’을 여세요.',
  'help.guide.link-trip.step.2': '‘동기화된 여행’에서 ‘여행 추가’를 클릭하세요.',
  'help.guide.link-trip.step.3': '이름이나 목적지로 여행을 검색하고 옆의 ‘링크’를 클릭하세요.',
  'help.guide.link-trip.result':
    '여행의 장소가 해당 날짜에 제안으로 타임라인에 나타나고, GPX 트랙과 함께 지도의 ‘계획’ 레이어에 추가돼요.',
  'help.guide.link-trip.tip.1': '연결된 여행 옆의 휴지통을 누르면 확인 후 연결이 해제돼요. 작성한 항목은 남아요.',
  'help.guide.link-trip.tip.2': '날짜가 있는 항목은 그날에 걸친 여행이 몇 개든 한 번만 집계돼요.',
  // share-public
  'help.guide.share-public.title': 'Journey 공개로 공유하기',
  'help.guide.share-public.goal': 'TREK 계정이 없는 사람에게 읽기 전용 링크를 줘요.',
  'help.guide.share-public.step.1': '헤더의 ⋯로 ‘Journey 설정’을 열고 ‘공개 공유’까지 스크롤하세요.',
  'help.guide.share-public.step.2': '‘공유 링크 만들기’를 클릭하세요.',
  'help.guide.share-public.step.3':
    '방문자에게 보여 줄 것을 고르세요: ‘타임라인’, ‘갤러리’, ‘지도’. ‘지도’에서 ‘여행 계획’은 계획한 장소와 경로를, ‘기록된 경로’는 기록한 날의 경로를 더해요. ‘복사’로 링크를 클립보드에 복사해요.',
  'help.guide.share-public.result':
    '링크가 있는 사람은 켜 둔 섹션만 볼 수 있어요. “기록 항목”에서 끈 항목은 거기서도 숨겨져요.',
  'help.guide.share-public.tip.1':
    '사진은 ‘갤러리’와 ‘지도’가 모두 켜져 있을 때만 공개 지도에 보여요. ‘지도’가 꺼져 있으면 서버가 사진을 보내기 전에 좌표를 지워요.',
  'help.guide.share-public.tip.2': '공유를 그만두려면 ‘복사’ 옆의 ‘링크 삭제’를 클릭하세요.',
  // contributors
  'help.guide.contributors.title': '함께 쓰기',
  'help.guide.contributors.goal': '다른 여행자도 자기 기록과 사진을 추가할 수 있게 해요.',
  'help.guide.contributors.step.1': '헤더의 ⋯로 ‘Journey 설정’을 열고 ‘기여자’를 찾으세요.',
  'help.guide.contributors.step.2': '“기여자 초대”를 클릭하고 이름이나 이메일로 사용자를 검색하세요.',
  'help.guide.contributors.step.3': '‘뷰어’나 ‘편집자’를 고르고 ‘초대’를 클릭하세요.',
  'help.guide.contributors.result':
    '그 사람의 목록에 Journey가 나타나고, 그 사람이 쓴 항목에는 이름이 붙어요. 기여자를 빼려면 옆의 ×를 클릭하세요.',
  'help.guide.contributors.tip.1': '기여자는 이 TREK를 쓰는 사람용이에요. 그 밖의 사람에게는 공개 링크가 있어요.',
  // studio
  'help.guide.studio.title': 'Journey를 포토북으로 만들기',
  'help.guide.studio.goal': '일기를 인쇄용 페이지로 만들어요.',
  'help.guide.studio.step.1': '헤더의 “Studio”를 클릭하세요. Journey 위에 디자이너가 열려요.',
  'help.guide.studio.step.2': '돌아가려면 상단 바 오른쪽 끝의 ×를 클릭하세요. 보던 곳으로 돌아가요.',
  'help.guide.studio.result':
    '왼쪽에 사이드바와 패널, 작업 영역에 펼침면, 오른쪽에 속성이 있어요. 자동 레이아웃은 기록으로 책을 만들고, 내보내기는 인쇄용 PDF를 만들어요.',
  'help.guide.studio.tip.1': 'Studio는 창 너비가 1024px 이상이어야 쓸 수 있고, 휴대폰에서는 제공되지 않아요.',
  'help.guide.studio.tip.2':
    '책의 권한은 Journey와 같아요: Journey를 읽을 수 있으면 책을 열 수 있고, Journey를 편집할 수 있으면 책을 저장할 수 있어요.',
  // archive-journey
  'help.guide.archive-journey.title': 'Journey 보관하거나 삭제하기',
  'help.guide.archive-journey.goal': '끝난 Journey를 마무리하거나 영구 삭제해요.',
  'help.guide.archive-journey.step.1': '헤더 오른쪽 위의 ⋯를 클릭해 ‘Journey 설정’을 여세요.',
  'help.guide.archive-journey.step.2':
    '맨 아래 “Journey 보관”을 누르면 Journey가 끝나고 보관됨으로 표시돼요. “Journey 복원”으로 되돌릴 수 있어요. “삭제”를 누르면 확인 후 모든 기록과 사진이 함께 삭제돼요.',
  'help.guide.archive-journey.result':
    '보관한 Journey도 계속 읽고 공유할 수 있어요. 다만 더 이상 오늘 날짜로 열리지 않아요.',
  'help.guide.archive-journey.tip.1': '삭제는 되돌릴 수 없어요. Journey와 연결됐던 여행은 바뀌지 않아요.',
  'help.guide.archive-journey.tip.2': '커버, 이름, 부제목은 같은 대화 상자 맨 위에 있어요.',
  'help.guide.journey-status.title': 'Journey 상태 정하기',
  'help.guide.journey-status.goal': '여행 날짜를 따르지 않고 Journey를 초안, 라이브, 완료됨으로 직접 정해요.',
  'help.guide.journey-status.step.1': 'Journey 헤더 오른쪽 위의 ⋯를 클릭해 ‘Journey 설정’을 여세요.',
  'help.guide.journey-status.step.2': '“상태”에서 “초안”, “라이브”, “완료됨” 중 하나를 고르세요. 바로 저장돼요.',
  'help.guide.journey-status.result':
    'Journey가 고른 상태로 유지돼요: ‘초안’과 ‘완료됨’은 카드와 헤더에 배지로 보이고, ‘라이브’ Journey는 Journey 목록 맨 위 배너에 보여요.',
  'help.guide.journey-status.tip.1':
    '“자동”을 고르면 다시 연결된 여행의 날짜를 따라가요. 연결된 여행이 없으면 자동 Journey는 초안으로 남아요.',
  'help.guide.journey-status.tip.2': '직접 정한 상태는 여행 날짜가 바뀌어도 다시 바꿀 때까지 유지돼요.',

  // ── Screen: journey-studio ────────────────────────────────────────────────────────────
  'help.ctx.journey-studio.title': '스튜디오',
  'help.ctx.journey-studio.summary':
    'TREK Studio는 Journey를 인쇄할 수 있는 포토북으로 만들어 줘요. Journey 위에 열리며, 왼쪽에는 사이드바와 패널, 가운데에는 작업 중인 펼침면, 오른쪽에는 속성이 있어요. 자동 레이아웃은 기록으로 첫 초안을 만들고, 테마는 책에 색과 글꼴을 입히고, 어시스턴트는 페이지 디자인을 함께해요. 그 뒤에는 무엇이든 옮기고, 자르고, 스타일을 바꿀 수 있고, 모든 단계를 실행 취소할 수 있어요.',
  'help.ctx.journey-studio.bullet.1':
    '상단 바: 왼쪽에는 Journey의 표지와 이름이 있어요. 오른쪽에는 이 책에 함께 있는 사람과 저장 여부, 페이지 형식, 실행 취소, 다시 실행, 붙여넣기, 자동 레이아웃, 어시스턴트, 도움말, 내보내기, 그리고 스튜디오를 닫는 버튼이 있어요.',
  'help.ctx.journey-studio.bullet.2':
    '왼쪽 사이드바: 페이지, 콘텐츠(Journey의 사진과 기록), 레이아웃, 요소(텍스트, 도형, 선, 프레임, 아이콘, 스티커), 여행(Journey로 만드는 숫자, 지도, 국가, 표시), 그리고 떨어져 있는 테마와 레이어가 있어요.',
  'help.ctx.journey-studio.bullet.3':
    '작업 영역: 도련과 안전 영역이 표시된 현재 펼침면이에요. 아래 확대/축소 바에는 화면에 맞추기, 책 보기, 이 펼침면 내려받기가 있어요.',
  'help.ctx.journey-studio.bullet.4':
    '오른쪽 속성: 선택한 요소의 모든 것을 다뤄요. 위치, 크기, 자르기부터 색, 효과, 쌓는 순서, 잠금까지예요. 아무것도 선택하지 않았을 때는 페이지 배경, 테마, 쪽 번호, 문서가 보여요.',
  'help.ctx.journey-studio.bullet.5':
    '책은 인쇄된 책과 같은 구성이에요. 표지, 표지 안쪽 빈 면과 마주 보는 낱쪽 첫 페이지, 펼침면, 낱쪽 마지막 페이지, 뒤표지 순이에요. 쪽 번호는 첫 페이지부터 세고 보이는 그대로 인쇄돼요.',
  'help.ctx.journey-studio.bullet.6':
    '여러 사람이 동시에 디자인할 수 있어요: 서로의 포인터가 이름과 함께 보여요. 다른 사람이 바꾼 버전에 저장하면 TREK가 그 작업을 덮어쓰지 않고 충돌로 알려 줘요.',
  'help.ctx.journey-studio.bullet.7':
    '테마: 책 전체의 모습을 하나로 맞춰요. 종이, 잉크, 강조색 세 가지, 글꼴, 모티프가 포함돼요. 테마에 연결된 요소는 테마를 바꾸면 함께 바뀌어요.',
  'help.ctx.journey-studio.bullet.8':
    '어시스턴트: 관리자가 AI를 설정해 두었다면 상단 바의 말풍선으로 어시스턴트를 열 수 있어요. 어시스턴트가 함께 페이지를 배치하고, 캡션을 쓰고, 책의 스타일을 바꿔 줘요. 어시스턴트가 한 변경은 모두 실행 취소 단계가 돼요.',
  // studio-auto-layout
  'help.guide.studio-auto-layout.title': '책 자동으로 만들기',
  'help.guide.studio-auto-layout.goal': '클릭 한 번으로 일기의 기록과 사진을 모아 완성된 초안을 만들어요.',
  'help.guide.studio-auto-layout.step.1': '상단 바에서 Auto layout을 클릭하세요.',
  'help.guide.studio-auto-layout.step.2':
    '“책 전체”를 고르면 제목과 페이지 설정은 유지한 채 모든 페이지를 새로 만들어요. “이 페이지”는 화면에 있는 펼침면만 다시 만들고, 기록으로 만든 펼침면에서만 나와요.',
  'help.guide.studio-auto-layout.step.3':
    '페이지 레일을 살펴보세요. 이전 버전이 더 마음에 들면 실행 취소로 레이아웃 전체를 되돌릴 수 있어요.',
  'help.guide.studio-auto-layout.result':
    '항목마다 펼침면이 하나씩 순서대로 만들어지고, 사진, 제목, 글이 알아서 배치돼요. 요소는 편집하기 전까지 항목과 연결돼 함께 바뀌어요.',
  'help.guide.studio-auto-layout.tip.1': '두 항목 모두 일반적인 실행 취소 단계라서, 써 보고 되돌릴 수 있어요.',
  'help.guide.studio-auto-layout.tip.2':
    '자동 레이아웃이 요소를 항목에 연결하면, 그 항목을 수정할 때 요소도 바뀌어요. Properties에서 요소를 바꾸면 연결이 끊겨요.',
  // studio-pages
  'help.guide.studio-pages.title': '펼침면 추가, 이동, 삭제하기',
  'help.guide.studio-pages.goal': '책을 한 페이지씩 편집해요.',
  'help.guide.studio-pages.step.1':
    '사이드바에서 페이지를 여세요. 썸네일이 책을 순서대로 보여 줘요. 표지, 첫 페이지, 펼침면, 마지막 페이지, 뒤표지 순이에요. 첫 페이지와 마지막 페이지는 제본된 책을 펼쳤을 때처럼 표지 안쪽 빈 면 옆에 그려져요.',
  'help.guide.studio-pages.step.2':
    '맨 아래 “페이지 추가”는 마지막 페이지 앞에 새 펼침면을 추가해요. 두 썸네일 사이의 +를 누르면 그 위치에 넣어요.',
  'help.guide.studio-pages.step.3':
    '썸네일에 마우스를 올리면 작업이 보여요: ‘앞으로 이동’, ‘뒤로 이동’, ‘페이지 복제’, ‘페이지 삭제’. 썸네일을 클릭하면 그 펼침면이 작업 공간에 열려요.',
  'help.guide.studio-pages.result':
    '표지, 첫 페이지와 마지막 페이지, 뒤표지는 자리가 고정돼요. 새 펼침면은 항상 그 사이에 추가돼요.',
  'help.guide.studio-pages.tip.1': '위쪽 바의 Book view는 제본될 모습대로 책 전체를 낱장으로 보여 줘요.',
  'help.guide.studio-pages.tip.2': '쪽 번호는 아무것도 선택하지 않은 상태에서 Properties의 Document에서 켜요.',
  // studio-layouts
  'help.guide.studio-layouts.title': '펼침면에 레이아웃 적용하기',
  'help.guide.studio-layouts.goal': '사진과 텍스트 프레임이 미리 배치된 레이아웃을 펼침면에 적용해요.',
  'help.guide.studio-layouts.step.1':
    '사이드바에서 레이아웃을 여세요. 디자인된 페이지가 먼저 나와요. 책의 테마로 꾸민 표지와 펼침면 전체이고, 스타일 칩으로 하나의 분위기만 골라 볼 수 있어요. 내 레이아웃과 기본 제공이 그 아래에 같은 격자로 이어져요.',
  'help.guide.studio-layouts.step.2':
    '하나를 클릭하세요. 작업 공간의 펼침면에 이 레이아웃의 프레임이 적용되고, 기존 사진과 글이 그 안에 배치돼요.',
  'help.guide.studio-layouts.result':
    '빈 프레임은 콘텐츠 자리예요: Content에서 사진을 끌어다 놓거나 Add to this page를 쓰세요.',
  'help.guide.studio-my-layouts.title': '페이지를 나만의 레이아웃으로 저장하기',
  'help.guide.studio-my-layouts.goal': '책의 다른 페이지에서 만든 배치를 다시 써요.',
  'help.guide.studio-my-layouts.step.1': '페이지를 마음에 드는 대로 배치한 뒤 사이드바에서 레이아웃을 여세요.',
  'help.guide.studio-my-layouts.step.2':
    '내 레이아웃 아래의 이 페이지를 레이아웃으로 저장을 클릭하세요. 페이지가 카드로 목록에 나타나요.',
  'help.guide.studio-my-layouts.tip.1':
    '다른 페이지에서 내 레이아웃을 클릭하면, 그 페이지의 사진과 글은 그대로 두고 같은 방식으로 배치돼요.',
  'help.guide.studio-my-layouts.result':
    '레이아웃은 책과 함께 저장되고 같은 종류의 페이지에서 보여요. 표지용은 표지에, 펼침면용은 펼침면에 나와요.',
  'help.guide.studio-layouts.tip.1': '레이아웃 적용도 다른 작업처럼 실행 취소할 수 있어요.',
  // studio-content
  'help.guide.studio-content.title': '페이지에 사진과 기록 넣기',
  'help.guide.studio-content.goal': 'Journey의 사진과 기록을 펼침면에 넣어요.',
  'help.guide.studio-content.step.1':
    '사이드바에서 Content를 여세요. Photos에는 Journey의 모든 사진이, Entries에는 기록과 그 글이 나와요.',
  'help.guide.studio-content.step.2':
    '사진을 펼침면이나 빈 프레임으로 끌어다 놓거나, 그 아래 ‘이 페이지에 추가’를 클릭하세요. ‘사진 업로드’는 아직 Journey에 없는 사진을 추가하고, ‘Immich에서’나 ‘Synology에서’는 연결된 라이브러리에서 사진을 골라요.',
  'help.guide.studio-content.step.3':
    '기록 아래의 Title, Story, Place를 누르면 그 글이 텍스트 요소로 페이지에 들어가요. 날짜와 좌표는 표시로 추가되고, 기록의 사진도 거기에 나와요.',
  'help.guide.studio-content.result': '끌어다 놓은 사진은 사진 요소가 돼요. 글은 편집하기 전까지 항목과 연결돼 있어요.',
  'help.guide.studio-theme.title': '책에 테마 입히기',
  'help.guide.studio-theme.goal': '책 전체의 색과 글꼴을 한 번에 정해요.',
  'help.guide.studio-theme.step.1':
    '사이드바에서 테마를 여세요. 각 카드는 테마를 작은 페이지로 보여 줘요. 종이, 글꼴, 강조색 세 가지가 담겨 있어요.',
  'help.guide.studio-theme.step.2':
    '테마를 클릭해서 써 보세요. 카드 아래에서 팔레트를 바꾸고, 다른 글꼴을 고르고, 모티프와 장식을 선택할 수 있어요.',
  'help.guide.studio-theme.step.3': '책에 적용을 클릭하세요. 화면에 보이는 펼침면에만 쓰려면 이 페이지에 적용이에요.',
  'help.guide.studio-theme.tip.1':
    '테마에 연결된 요소는 테마의 색과 글꼴을 가져오고, 테마를 바꾸면 따라 바뀌어요. 아직 연결되지 않은 것도 스타일 변경을 쓰면 나머지를 먼저 연결해요.',
  'help.guide.studio-theme.tip.2': '사진에서 색 가져오기는 Journey의 사진으로 팔레트를 만들어요.',
  'help.guide.studio-theme.result':
    '책에서 연결된 색과 글꼴이 모두 한꺼번에 바뀌고, 테마 적용은 실행 취소 한 단계예요.',
  'help.guide.studio-content.tip.1': 'Content 위쪽 검색창으로 두 목록을 모두 걸러요.',
  'help.guide.studio-content.tip.2':
    '컴퓨터 바탕화면에서 파일을 작업 공간에 끌어다 놓으면, TREK가 업로드와 배치를 한 번에 해요.',
  // studio-elements
  'help.guide.studio-elements.title': '텍스트, 도형, 아이콘, 스티커 추가하기',
  'help.guide.studio-elements.goal': '사진과 이야기 외에 장식 요소로 펼침면을 꾸며요.',
  'help.guide.studio-elements.step.1':
    '사이드바에서 요소를 여세요. 추가할 수 있는 것이 텍스트, 도형, 선, 프레임, 아이콘, 스티커의 여섯 탭으로 나뉘어 있어요.',
  'help.guide.studio-elements.step.2':
    '텍스트 스타일이나 디자인된 제목, 도형, 선, 빈 프레임, 아이콘, 스티커를 클릭하세요. 모두 펼침면 가운데에 놓이니 그 뒤에 옮기면 돼요.',
  'help.guide.studio-elements.result':
    '텍스트 요소를 더블클릭하면 입력할 수 있어요. Properties에서 글꼴, 굵기, 크기, 간격, 정렬을 정해요.',
  'help.guide.studio-stickers.title': '스티커로 꾸미기',
  'help.guide.studio-stickers.goal': '명소와 음식부터 동물과 화살표까지 일러스트를 추가해요.',
  'help.guide.studio-stickers.step.1': '사이드바에서 요소를 열고 스티커를 고르세요.',
  'help.guide.studio-stickers.step.2': '단어로 검색하거나 선반을 둘러본 뒤, 스티커를 클릭해서 펼침면에 놓으세요.',
  'help.guide.studio-stickers.tip.1': '스티커를 선택하면 속성에서 각 부분의 색을 바꾸고 좌우로 뒤집을 수 있어요.',
  'help.guide.studio-stickers.result': '스티커는 그림이라서 어떤 크기에서도 선명해요.',
  'help.guide.studio-elements.tip.1': '프레임은 빈 사진 자리예요. 사진은 나중에 끌어다 놓으면 돼요.',
  // studio-travel
  'help.guide.studio-travel.title': '지도, 숫자, 국가, 표시 추가하기',
  'help.guide.studio-travel.goal': '여행 자체를 페이지 위의 디자인된 요소로 바꿔요.',
  'help.guide.studio-travel.step.1':
    '사이드바에서 여행을 여세요. 추가할 수 있는 것이 숫자, 지도, 국가, 표시의 네 탭으로 나뉘어 있어요.',
  'help.guide.studio-travel.step.2':
    '각 카드는 내 Journey의 숫자를 테마 색으로 보여 줘요. 요약은 포스터, 티켓, 도로 표지판, 주행 거리계로, 지도는 번호가 붙은 경유지나 한 국가만 잘라낸 모양으로, 국가는 스탬프, 엽서, 핀으로, 날짜나 거리는 스탬프, 태그, 리본으로 나와요.',
  'help.guide.studio-travel.step.3':
    '카드를 클릭하세요. 요소가 펼침면 가운데에 놓이니 그 뒤에 옮기고 크기를 바꾸면 돼요.',
  'help.guide.studio-travel.result':
    '요소가 펼침면에 나타나요. 속성에서 모양을 바꿀 수 있고, 숫자, 지도, 국가는 Journey가 바뀔 때마다 갱신돼요.',
  'help.guide.studio-text-effects.title': '텍스트에 효과 넣기',
  'help.guide.studio-text-effects.goal': '제목에 윤곽선, 그림자, 곡선을 주거나 글자를 패턴으로 채워요.',
  'help.guide.studio-text-effects.step.1': '페이지의 텍스트 요소를 클릭해서 선택하세요.',
  'help.guide.studio-text-effects.step.2':
    '속성에서 효과를 열어 윤곽선, 그림자, 하이라이트를 더하거나 글자를 그라데이션이나 패턴으로 채우세요. 배치에서는 줄을 곡선으로 만들고 상자에 맞출 수 있어요.',
  'help.guide.studio-text-effects.tip.1': '맞추기는 텍스트가 상자에 들어올 때까지 줄여서, 긴 제목도 넘치지 않아요.',
  'help.guide.studio-text-effects.result': '효과가 텍스트와 함께 그려지므로 인쇄해도 화면과 똑같아요.',
  'help.guide.studio-background.title': '페이지 배경 바꾸기',
  'help.guide.studio-background.goal': '페이지를 단색, 그라데이션, 패턴으로 칠하거나 사진을 깔아요.',
  'help.guide.studio-background.step.1':
    '페이지의 빈 곳을 클릭해서 아무것도 선택되지 않게 하세요. 속성 맨 위에 페이지 배경이 있어요.',
  'help.guide.studio-background.step.2':
    '종이, 단색, 그라데이션, 패턴 중 하나와 색을 고르거나, 배경으로 쓸 사진에서 사진을 클릭하세요.',
  'help.guide.studio-background.tip.1': '모든 페이지에 적용을 누르면 책의 모든 페이지에 같은 배경이 들어가요.',
  'help.guide.studio-background.result': '배경은 도련까지 이어져서 페이지 가장자리까지 인쇄돼요.',
  'help.guide.studio-layers.title': '레이어로 정렬하고, 숨기고, 잠그기',
  'help.guide.studio-layers.goal': '펼침면의 모든 것을 쌓인 순서대로 보고 거기서 작업해요.',
  'help.guide.studio-layers.step.1': '사이드바에서 레이어를 여세요. 목록의 맨 위가 페이지의 맨 앞이에요.',
  'help.guide.studio-layers.step.2':
    '행을 끌어서 순서를 바꾸고, 눈 아이콘으로 요소를 숨기고, 잠금으로 제자리에 고정하세요. 여러 개를 선택해 그룹으로 묶으면 함께 움직여요.',
  'help.guide.studio-layers.tip.1': '행을 더블클릭하면 요소에 고유한 이름을 붙일 수 있어요.',
  'help.guide.studio-layers.tip.2': '숨긴 요소는 PDF에서 빠져요.',
  'help.guide.studio-layers.result': '요소가 많은 페이지도 편집하기 쉽고, 끝낸 부분이 실수로 움직이지 않아요.',
  'help.guide.studio-travel.tip.1':
    '지도 아래의 경유지에는 경로의 모든 경유지가 나열돼요. 집 근처 공항처럼 지도와 숫자에서 빼고 싶은 것은 꺼 두세요.',
  'help.guide.studio-travel.tip.2':
    '국가 지도는 그 국가의 경유지만 보여 주므로, 여행이 긴 비행으로 시작했더라도 국가가 페이지를 가득 채워요.',
  // studio-properties
  'help.guide.studio-properties.title': '선택한 요소 편집하기',
  'help.guide.studio-properties.goal': '인스펙터로 요소를 옮기고, 자르고, 꾸미고, 겹쳐 쌓아요.',
  'help.guide.studio-properties.step.1':
    '펼침면에서 요소를 클릭하세요. 크기와 회전을 조절하는 핸들이 나타나고, 드래그하면 위치를 옮길 수 있어요.',
  'help.guide.studio-properties.step.2':
    '오른쪽 Properties에 선택한 항목의 설정이 나와요: 위치와 크기, 프레임 안에 남길 부분을 정하는 초점이 있는 Crop, Fill 또는 Fit, Look 필터, Corner radius, Frame style, 겹침 순서, Lock.',
  'help.guide.studio-properties.step.3':
    '“복제”와 “삭제”는 인스펙터 맨 위에 있어요. 상단 바의 실행 취소로 이 변경을 모두 되돌릴 수 있어요.',
  'help.guide.studio-properties.result':
    '잠긴 요소는 페이지에서 선택하거나 옮길 수 없어요. 다른 요소를 작업하는 동안 완성한 레이아웃을 지켜 줘요.',
  'help.guide.studio-properties.tip.1':
    'Shift를 누른 채 클릭하면 여러 요소를 선택할 수 있고, 인스펙터에서 한꺼번에 편집해요.',
  'help.guide.studio-properties.tip.2':
    '자동 레이아웃이 배치한 요소를 편집하면 항목과의 연결이 끊겨서, 그 항목을 나중에 바꿔도 따라가지 않아요.',
  // studio-format
  'help.guide.studio-format.title': '페이지 규격 고르기',
  'help.guide.studio-format.goal': '레이아웃을 만들기 전에 책의 인쇄 크기를 정해요.',
  'help.guide.studio-format.step.1':
    '상단 바에서 편집 도구 옆에 있는 페이지 형식을 클릭하세요. 형식의 이름과 모양이 보여요.',
  'help.guide.studio-format.step.2':
    'Square 21 × 21 cm, Square 30 × 30 cm, A4 또는 A5 가로나 세로 중에서 고르거나, 너비와 높이를 밀리미터로 직접 입력하세요. 도련과 안전 여백은 그 아래에 있어요.',
  'help.guide.studio-format.result': '모든 펼침면이 그 크기로 그려지고, 기본 재단 여백은 3mm, 안전 영역은 5mm예요.',
  'help.guide.studio-format.tip.1':
    '판형을 먼저 바꾼 다음 Auto layout을 실행하세요. Auto layout은 실행할 때 설정된 판형을 써요.',
  'help.guide.studio-format.tip.2': '인쇄소에 재단 여백과 안전 영역 값을 물어보고 그 값을 입력하세요.',
  // studio-export
  'help.guide.studio-export.title': '책을 PDF로 내보내기',
  'help.guide.studio-export.goal': '인쇄용 파일이나 화면에서 볼 파일을 받아요.',
  'help.guide.studio-export.step.1': '상단 바에서 Export를 클릭하세요.',
  'help.guide.studio-export.step.2':
    '인쇄소에 맡길 때 필요한 “낱쪽”(읽는 순서대로 한 장에 한 페이지) 또는 책을 펼친 모양대로 두 페이지씩 담는 “펼침면”을 고르세요. “재단선”을 켜면 모든 가장자리에 도련이 더해지고 자를 위치가 표시돼요.',
  'help.guide.studio-export.step.3':
    '“인쇄 화면”을 클릭하세요. 브라우저에 페이지가 열리면 “PDF로 저장”을 골라 파일을 만드세요.',
  'help.guide.studio-export.result': '창에서 알려 준 장수만큼, 정한 페이지 규격으로 PDF가 만들어져요.',
  'help.guide.studio-export.tip.1': 'Studio처럼 PDF도 데스크톱에서만 만들 수 있어요.',
  'help.guide.studio-export.tip.2':
    '교정용이면 재단선 없이 ‘펼침면’으로, 인쇄소용이면 재단선을 넣어 ‘낱쪽’으로 내보내세요.',
  // studio-spread-file
  'help.guide.studio-spread-file.title': '펼침면을 다른 책에서 다시 쓰기',
  'help.guide.studio-spread-file.goal': '마음에 드는 디자인을 한 Journey의 책에서 다른 책으로 복사해요.',
  'help.guide.studio-spread-file.step.1':
    '펼침면을 작업 영역에 띄운 상태에서 확대 바 오른쪽 끝의 “이 펼침면 내려받기”를 클릭하세요. 파일에는 사진이 아니라 디자인만 들어가요.',
  'help.guide.studio-spread-file.step.2':
    '다른 책에서 Pages를 열고 “페이지 추가” 옆의 “가져오기”를 클릭한 다음 파일을 고르세요.',
  'help.guide.studio-spread-file.result':
    '펼침면이 프레임과 글꼴 스타일과 함께 들어와요. 새 Journey의 사진을 프레임에 끌어다 놓으세요.',
  'help.guide.studio-spread-file.tip.1': '펼침면 디자인 파일이 아니면 TREK가 거부하고 이유를 보여 줘요.',

  // ── Screen: settings (all tabs) ───────────────────────────────────────────────────────
  'help.ctx.settings.title': '설정',
  'help.ctx.settings.summary':
    '내 개인 설정이에요. 왼쪽 사이드바에 주제별로 탭이 있어요. 대부분의 스위치는 바꾸는 즉시 적용되고, ‘저장’ 버튼이 있는 양식은 ‘저장’을 눌러야 저장돼요. 여기서 바꾼 내용은 다른 사람의 TREK에 영향을 주지 않아요.',
  'help.ctx.settings.bullet.1':
    '왼쪽 사이드바: ‘화면’, ‘모양’, ‘지도’, ‘알림’, ‘통합’, ‘오프라인’, ‘계정’. 플러그인이 활성화되면 ‘플러그인’이 생기고, 운영자가 숨기지 않았다면 ‘정보’도 있어요. 맨 아래에 버전이 보여요.',
  'help.ctx.settings.bullet.2':
    '처음에는 ‘화면’이 열려요. 언어, 장소 이름 언어, 단위, 시간 형식, 주 시작 요일, 표시 통화, 그리고 여행 지도 동작이 있어요. ‘모양’에는 테마, 색상, 가독성, 글자 크기, 대시보드 위젯이 있어요.',
  'help.ctx.settings.bullet.3':
    '‘지도’에서는 지도 엔진과 스타일을 정하고, ‘알림’에서는 어떤 이벤트를 어느 채널로 받을지 정해요. ‘통합’에서는 사진 라이브러리, AirTrail, Dawarich, wanderer를 연결하고 API 키와 MCP도 관리해요. ‘오프라인’에서는 이 기기에 무엇을 저장할지 정해요.',
  'help.ctx.settings.bullet.4': '“계정”에서는 프로필, 비밀번호, 2단계 인증, 패스키를 관리하고 계정을 삭제할 수 있어요.',
  'help.ctx.settings-display.title': '화면',
  'help.ctx.settings-display.summary':
    'TREK가 어떤 화면으로 시작할지, 어떤 언어와 단위를 쓸지, 여행 지도와 예약이 어떻게 동작할지 정해요. 바꾸면 바로 적용돼요.',
  'help.ctx.settings-display.bullet.1':
    '‘시작’: ‘시작 화면’을 ‘대시보드’나 ‘진행 중인 여행’으로 정해요. ‘진행 중인 여행’을 고르면 ‘시작 탭’에서 그 여행이 열릴 탭을 골라요.',
  'help.ctx.settings-display.bullet.2':
    '언어 및 지역: ‘표시 통화’(환산하지 않으려면 ‘여행 통화’), ‘언어’, ‘장소 이름’, ‘온도 단위’, ‘거리 단위’, ‘시간 형식’, ‘주 시작 요일’.',
  'help.ctx.settings-display.bullet.3':
    '여행 및 지도: ‘장소 열기 앱’, ‘날 제목에 날짜를 먼저 표시’, ‘예약 경로 레이블’, ‘예약 경로 항상 표시’, ‘계획되지 않은 장소를 작은 마커로 표시’, ‘지도에서 장소 탐색’, ‘예약 코드 흐리게’, ‘숙소 기준으로 경로 최적화’.',
  'help.ctx.settings-appearance.title': '모양',
  'help.ctx.settings-appearance.summary':
    '이 계정에서 TREK이 보이는 방식이에요: 라이트 또는 다크, 강조색, 반투명 효과와 애니메이션, 글자 크기, 대시보드에 표시할 위젯. 모두 바로 적용되고 로그인하는 모든 기기에 반영돼요.',
  'help.ctx.settings-appearance.bullet.1':
    '‘테마’: ‘색상 모드’(‘라이트’, ‘다크’, ‘자동’), 색상 스키마, 그리고 ‘직접 설정’에서는 라이트와 다크 모드용 강조 색을 대비 확인과 함께 정해요.',
  'help.ctx.settings-appearance.bullet.2':
    '‘실험적’으로 표시된 가독성: 투명도, 동작 줄이기, 밀도, 그리고 ‘전체’ 슬라이더와 크게, 중간, 보통, 작게 슬라이더가 각각 있는 ‘글자 크기’.',
  'help.ctx.settings-appearance.bullet.3':
    '대시보드 위젯: 데스크톱(‘히어로 아래’, ‘오른쪽 사이드바’)과 모바일(‘히어로 아래’, ‘페이지 하단’) 스위치가 따로 있어요.',
  'help.ctx.settings-appearance.bullet.4': '카드 아래의 ‘기본값으로 초기화’는 탭 전체를 기본값으로 되돌려요.',
  'help.ctx.settings-map.title': '지도',
  'help.ctx.settings-map.summary':
    '여행 계획과 Journey 지도를 어떤 엔진과 스타일로 그릴지 정해요. Leaflet은 기본 래스터 지도이고, Mapbox GL은 내 토큰으로 3D 건물과 지형을 더하며, MapLibre GL은 토큰 없이 OpenFreeMap 벡터 타일을 그려요. Atlas는 항상 Leaflet을 써요.',
  'help.ctx.settings-map.bullet.1':
    '‘지도 공급자’: Leaflet, Mapbox GL(실험적), MapLibre GL이 있고, 옵션마다 짧은 설명이 있어요.',
  'help.ctx.settings-map.bullet.2':
    'Leaflet용 ‘지도 템플릿’과 ‘CARTO API 키’, 두 GL 엔진용 ‘지도 스타일’, 그리고 Mapbox GL용 ‘Mapbox 액세스 토큰’.',
  'help.ctx.settings-map.bullet.3':
    'Mapbox GL 전용: ‘3D 건물 및 지형’과 ‘고품질 모드’. ‘지도 저장’ 위에 실시간 미리보기가 보이고, ‘지도 저장’으로 선택을 저장해요.',
  'help.ctx.settings-notifications.title': '알림',
  'help.ctx.settings-notifications.summary':
    'TREK가 앱 밖에서 나에게 연락하는 방법이에요. 맨 위 표에서 이벤트별 줄과 채널별 열로 무엇을 어디로 보낼지 정해요. 그 아래에 웹훅, ntfy, 이 기기의 푸시, 플러그인 채널 카드가 있어요.',
  'help.ctx.settings-notifications.bullet.1':
    '‘알림’: 채널마다 이벤트를 켜거나 꺼요. 자물쇠는 관리자가 그 항목을 모두에게 꺼 뒀다는 뜻이에요.',
  'help.ctx.settings-notifications.bullet.2':
    '‘웹훅 URL’: Discord, Slack 또는 직접 만든 웹훅이고, ‘테스트’와 ‘저장’이 있어요.',
  'help.ctx.settings-notifications.bullet.3':
    'Ntfy: ‘Ntfy 토픽’, 선택 항목인 ‘Ntfy 서버 URL’과 액세스 토큰, 그리고 ‘테스트’와 ‘저장’.',
  'help.ctx.settings-notifications.bullet.4':
    '‘이 기기의 푸시 알림’: ‘이 기기에서 켜기’는 지금 쓰는 브라우저에만 적용되고, ‘테스트 전송’은 테스트 알림을 보내요. 플러그인 채널은 설정을 마칠 때까지 ‘설정하기’로 보여요.',
  'help.ctx.settings-integrations.title': '통합',
  'help.ctx.settings-integrations.summary':
    '외부에서 TREK에 연결되는 모든 것이에요: Journey용 사진 라이브러리, 항공편용 AirTrail, 실제로 다녀온 곳을 위한 Dawarich, 트레일용 wanderer, 다른 소프트웨어용 읽기 전용 API 키, AI 클라이언트용 MCP. 다른 서비스와의 연결은 관리자가 켜야 보여요.',
  'help.ctx.settings-integrations.bullet.1':
    'Immich와 Synology Photos, AirTrail, Dawarich, wanderer: 카드마다 주소와 키, ‘저장’과 ‘연결 테스트’, ‘연결됨’ 또는 ‘연결되지 않음’ 배지가 있어요.',
  'help.ctx.settings-integrations.bullet.2':
    '‘API 키’: 공개 API용 읽기 전용 키예요. 키마다 고른 영역만 읽을 수 있고, 복사할 ‘엔드포인트’가 함께 있어요.',
  'help.ctx.settings-integrations.bullet.3':
    '‘MCP 설정’: ‘MCP 엔드포인트’, 그리고 ‘OAuth 2.1 클라이언트’ 아래에 등록한 클라이언트, 복사할 ‘클라이언트 설정’, ‘취소’ 버튼이 있는 ‘활성 OAuth 세션’.',
  'help.ctx.settings-integrations.bullet.4':
    '‘API 토큰’: MCP에 연결하는 예전 방식으로 ‘지원 중단 예정’으로 표시돼요. 대신 ‘OAuth 2.1 클라이언트’를 쓰세요.',
  'help.ctx.settings-offline.title': '오프라인',
  'help.ctx.settings-offline.summary':
    '연결이 없어도 여행을 열 수 있도록 TREK이 이 기기에 저장하는 데이터, 그리고 오프라인에서 한 변경이 다른 곳의 변경과 충돌할 때 어떻게 되는지 알려 줘요.',
  'help.ctx.settings-offline.bullet.1':
    '‘오프라인 모드’: ‘오프라인 모드 강제 사용’은 먼저 전부 내려받은 뒤 캐시로만 동작하고, 변경 사항은 대기열에 쌓아 둬요.',
  'help.ctx.settings-offline.bullet.2':
    '‘오프라인 준비’: ‘오프라인 사용을 위해 다운로드’로 여행 데이터, 문서, 지도 타일을 내려받고, ‘지금 다시 동기화’로 직접 다시 동기화해요.',
  'help.ctx.settings-offline.bullet.3':
    '‘오프라인에 저장할 항목’: ‘지도 타일을 오프라인에 저장’과 여행별 스위치가 있어요. 끝난 여행은 직접 켜야만 저장돼요.',
  'help.ctx.settings-offline.bullet.4':
    '‘동기화 충돌’은 두 변경이 충돌할 때만 나타나고, ‘내 버전’, ‘상대 버전 유지’, ‘충돌이 발생하면’이 있어요. ‘오프라인 캐시’는 여행 수와 대기 중이거나 실패한 변경 수를 보여 주고, ‘다시 시도’, ‘취소’, ‘캐시 지우기’가 있어요.',
  'help.ctx.settings-account.title': '계정',
  'help.ctx.settings-account.summary':
    '이 TREK의 내 계정과 로그인 방법이에요. 프로필 사진, 사용자 이름과 이메일, 비밀번호, 2단계 인증, 패스키가 있어요. ‘계정 삭제’는 ‘계정’ 카드 하단에 있어요.',
  'help.ctx.settings-account.bullet.1':
    '‘계정’: 사진의 카메라 아이콘을 클릭해 사진을 올리고, 빨간 휴지통으로 삭제해요. ‘사용자 이름’과 ‘이메일’은 ‘프로필 저장’으로 저장돼요.',
  'help.ctx.settings-account.bullet.2':
    '‘비밀번호 변경’: 현재 비밀번호, 새 비밀번호 두 번(입력하는 동안 규칙이 하나씩 체크돼요), 그다음 ‘비밀번호 업데이트’. 이 TREK가 SSO로만 로그인하면 이 카드는 보이지 않아요.',
  'help.ctx.settings-account.bullet.3':
    '인증 앱과 백업 코드를 쓰는 “2단계 인증 (2FA)”, 비밀번호 없이 로그인하는 “패스키”.',
  'help.ctx.settings-account.bullet.4':
    '‘계정 삭제’는 ‘계정’ 카드 하단 왼쪽에 있고, 확인을 거쳐요. 관리자가 한 명뿐이면 자기 자신을 삭제할 수 없어요.',
  // language-region
  'help.guide.language-region.title': '언어, 단위, 통화 정하기',
  'help.guide.language-region.goal': 'TREK을 내 언어와 내 지역의 표시 형식으로 사용해요.',
  'help.guide.language-region.step.1':
    '‘언어 및 지역’에서 칩 줄의 ‘언어’를 고르세요. 로그인한 모든 기기에서 TREK 언어가 바로 바뀌어요.',
  'help.guide.language-region.step.2':
    '‘장소 이름’은 장소 검색, 제안, 주소에 쓰일 언어를 정해요. ‘앱과 동일’은 화면 언어를 따라요.',
  'help.guide.language-region.result':
    '날짜, 거리, 금액이 익숙한 형식으로 보여요. ‘비용’에서는 금액이 표시 통화로 보일 뿐이고, 입력한 금액은 바뀌지 않아요.',
  'help.guide.language-region.tip.1': '‘여행 통화’는 환산하지 않고 여행마다 그 여행의 통화로 보여 줘요.',
  'help.guide.language-region.tip.2': '언어에 따라 Vacay와 일기의 요일, 월 이름도 바뀌어요.',
  // travel-map-prefs
  'help.guide.travel-map-prefs.title': '여행 지도와 날 제목 설정하기',
  'help.guide.travel-map-prefs.goal': '모든 여행에서 여행 지도에 무엇을 보여 줄지, 날 헤더를 어떻게 표시할지 정해요.',
  'help.guide.travel-map-prefs.step.1':
    '‘여행 및 지도’에서 ‘장소 열기 앱’은 길 안내 버튼이 바로 열 지도 앱을 정해요. ‘매번 묻기’를 고르면 매번 앱을 고를 수 있어요. ‘날 제목에 날짜를 먼저 표시’는 날 제목마다 달력 날짜를 먼저 보여 줘요.',
  'help.guide.travel-map-prefs.step.2':
    '‘예약 경로 항상 표시’는 모든 항공편, 기차 등의 예약을 지도에 그리고, ‘예약 경로 레이블’은 양 끝에 역이나 공항 이름을 붙여요. ‘계획되지 않은 장소를 작은 마커로 표시’는 아직 날에 넣지 않은 장소를 작게 줄여서 계획한 들를 곳이 잘 보이게 해요.',
  'help.guide.travel-map-prefs.result': '다시 바꿀 때까지 모든 여행의 지도에 이 설정이 적용돼요.',
  'help.guide.travel-map-prefs.tip.1':
    '이 설정은 여행별이 아니라 계정별이에요. 공유 여행의 멤버는 각자 자기 설정대로 봐요.',
  'help.guide.travel-map-prefs.tip.2': '관리자가 모두의 기본값을 정할 수 있지만, 여기서 바꾼 설정은 나에게 적용돼요.',
  // startup
  'help.guide.startup.title': 'TREK 시작 화면 고르기',
  'help.guide.startup.goal': '매번 대시보드가 아니라 가장 자주 쓰는 화면으로 TREK를 열어요.',
  'help.guide.startup.step.1': '‘화면’ 맨 위 ‘시작’에서 ‘시작 화면’을 ‘대시보드’나 ‘진행 중인 여행’으로 정하세요.',
  'help.guide.startup.step.2': '‘진행 중인 여행’을 고르면 ‘시작 탭’이 나타나요. 그 여행이 열릴 탭을 고르세요.',
  'help.guide.startup.result': '다음에 TREK를 열면 그 화면이 바로 열려요.',
  'help.guide.startup.tip.1':
    '‘진행 중인 여행’은 오늘 진행 중이거나 다음에 다가오는 여행이에요. 대시보드 맨 위에 보이는 여행과 같아요.',
  // theme-scheme
  'help.guide.theme-scheme.title': '테마와 강조 색 정하기',
  'help.guide.theme-scheme.goal': 'TREK를 라이트, 다크 또는 기기 설정에 맞추고, 원하는 색으로 꾸며요.',
  'help.guide.theme-scheme.step.1':
    '‘테마’에서 ‘색상 모드’를 ‘라이트’, ‘다크’, ‘자동’ 중 하나로 정하세요. ‘자동’은 기기 설정을 따라요.',
  'help.guide.theme-scheme.step.2':
    '색상 스키마를 고르세요: ‘기본’, 고대비, 인디고, 틸, 로즈, ‘호박색’, 바이올렛, ‘직접 설정’.',
  'help.guide.theme-scheme.step.3':
    '‘직접 설정’에서는 색 점 하나를 고르거나 ‘라이트’와 ‘다크’에 각각 강조 색을 따로 정하세요. 옆의 표시에 대비가 좋은지 낮은지 나와요.',
  'help.guide.theme-scheme.result':
    '버튼, 링크, 강조 표시가 어디서나 강조색으로 바뀌고, 로그인하는 모든 기기에 적용돼요.',
  'help.guide.theme-scheme.tip.1':
    '내비게이션 바에도 라이트와 다크 모드를 빠르게 바꾸는 스위치가 있어요. 같은 테마 설정이에요.',
  'help.guide.theme-scheme.tip.2': '기본 화면이 잘 안 보이면 High contrast 스킴을 고르세요.',
  // readability
  'help.guide.readability.title': '가독성과 글자 크기 조정하기',
  'help.guide.readability.goal': '유리 효과와 움직임은 줄이고, 여백이나 글자는 키워요.',
  'help.guide.readability.step.1':
    '‘가독성’에서 투명도는 유리 패널을 불투명하게 바꾸고, 동작 줄이기는 애니메이션을 최소화하며, 밀도는 넉넉하게 또는 촘촘하게를 골라요.',
  'help.guide.readability.step.2':
    '‘글자 크기’: ‘전체’를 끌어 모든 글자 크기를 한 번에 바꾸거나, 크게, 중간, 보통, 작게를 하나씩 정하세요. 크기마다 예시가 보여서 끄는 동안 결과를 확인할 수 있어요.',
  'help.guide.readability.result': '지도 패널과 Journey를 포함해 앱 전체에 바로 적용돼요.',
  'help.guide.readability.tip.1':
    '기기에서 동작 줄이기를 켜면 TREK 일부는 이미 애니메이션을 줄여요. ‘동작 줄이기’는 나머지 부분의 애니메이션도 줄여요.',
  'help.guide.readability.tip.2':
    '글자 크기는 타이포그래피 단계에 따라 적용되므로 잘리는 부분이 없어요. 공간이 모자라면 줄이 바뀌어요.',
  // dashboard-widgets
  'help.guide.dashboard-widgets.title': '대시보드 위젯 고르기',
  'help.guide.dashboard-widgets.goal': '쓰는 위젯만 데스크톱과 휴대폰에서 따로 보여 줘요.',
  'help.guide.dashboard-widgets.step.1':
    '‘대시보드 위젯’의 데스크톱에는 ‘히어로 아래’와 ‘오른쪽 사이드바’의 위젯이 있어요. ‘오른쪽 사이드바’를 끄면 열 전체가 숨겨지고 대시보드가 가운데로 정렬돼요. 다시 켜기 전까지 그 위젯들은 흐리게 보여요.',
  'help.guide.dashboard-widgets.step.2':
    '휴대폰 대시보드용으로 모바일에는 ‘히어로 아래’와 ‘페이지 하단’ 스위치가 따로 있어요.',
  'help.guide.dashboard-widgets.result':
    '대시보드가 바로 바뀌어요. 오른쪽 사이드바를 끄면 대시보드가 가운데로 정렬돼요.',
  'help.guide.dashboard-widgets.tip.1': '애드온 위젯은 관리자가 그 애드온을 켜 뒀을 때만 보여요.',
  'help.guide.dashboard-widgets.tip.2': '대시보드는 기기마다 그리드 또는 목록 보기와 정렬 순서를 기억해요.',
  // map-provider
  'help.guide.map-provider.title': '지도 엔진과 스타일 고르기',
  'help.guide.map-provider.goal': '기본 지도, 벡터 타일, Mapbox 3D 지도 중에서 골라 써요.',
  'help.guide.map-provider.step.1':
    '‘지도 공급자’에서 어떤 래스터 타일이든 쓰는 기본 2D 지도라면 Leaflet을, 3D 건물과 지형이 있는 벡터 타일이라면 Mapbox GL을, 토큰 없이 OpenFreeMap 벡터 타일을 쓰려면 MapLibre GL을 고르세요.',
  'help.guide.map-provider.step.2':
    'Leaflet이면 ‘지도 템플릿’을, GL 엔진이면 ‘지도 스타일’을 고르거나 직접 URL을 붙여 넣으세요. Mapbox GL에는 ‘Mapbox 액세스 토큰’이, CARTO 템플릿에는 ‘CARTO API 키’가 필요해요. 칸 아래 링크에서 발급받는 곳을 알려 줘요.',
  'help.guide.map-provider.step.3':
    'Mapbox GL이라면 ‘3D 건물 및 지형’을 켜고, 기기 성능이 충분하면 ‘고품질 모드’도 켜세요. 미리보기를 확인한 뒤 ‘지도 저장’을 클릭하세요.',
  'help.guide.map-provider.result': '여행 계획과 Journey 지도가 고른 엔진을 써요. Atlas는 항상 Leaflet을 써요.',
  'help.guide.map-provider.tip.1': '토큰이 없으면 Mapbox GL은 빈 지도 대신 Leaflet을 써요.',
  'help.guide.map-provider.tip.2': '오프라인용으로 저장하는 지도 타일은 다운로드할 때 사용 중인 공급자에서 받아요.',
  // notification-channels
  'help.guide.notification-channels.title': '알림 받을 곳 설정하기',
  'help.guide.notification-channels.goal': '여행 알림과 협업 이벤트를 휴대폰이나 다른 도구에서 받아요.',
  'help.guide.notification-channels.step.1':
    '웹훅이라면 Discord, Slack 또는 직접 만든 ‘웹훅 URL’을 붙여 넣고 ‘테스트’를 클릭한 다음 ‘저장’하세요.',
  'help.guide.notification-channels.step.2':
    'ntfy라면 ‘Ntfy 토픽’을 입력하고, 직접 운영하는 서버가 있으면 ‘Ntfy 서버 URL’과 액세스 토큰도 넣으세요. ‘테스트’는 바로 메시지를 보내고, ‘저장’은 설정을 저장해요.',
  'help.guide.notification-channels.step.3':
    '맨 위 ‘알림’ 카드에서 채널마다 이벤트를 켜거나 끄세요. 자물쇠는 관리자가 모두에게 꺼 뒀다는 뜻이에요. 플러그인 채널은 설정을 마칠 때까지 ‘설정하기’로 보이고, ‘테스트 전송’으로 시험해 볼 수 있어요.',
  'help.guide.notification-channels.result':
    '이벤트가 켜 둔 채널로 전송돼요. ‘앱 내’ 열에서 상단 바의 벨에 무엇을 보여 줄지 정해요.',
  'help.guide.notification-channels.tip.1': '여행별 ‘리마인더’(출발 며칠 전)는 여행 편집 양식에서 정해요.',
  'help.guide.notification-channels.tip.2':
    '관리자가 모두를 위한 기본 ntfy 서버를 미리 넣어 둘 수 있어요. 토픽은 직접 정해요.',
  // photo-providers
  'help.guide.photo-providers.title': '사진 라이브러리 연결하기',
  'help.guide.photo-providers.goal': 'Journey에서 Immich나 Synology Photos의 그날 사진을 불러와요.',
  'help.guide.photo-providers.step.1':
    '‘통합’에서 Immich나 Synology Photos 카드를 찾아 필요한 정보를 입력하세요: Immich는 ‘서버 URL’과 API 키, Synology Photos는 ‘사용자 이름’과 ‘비밀번호’. Immich는 Journey 사진을 올릴 때 Immich 라이브러리에도 복사할 수 있어요.',
  'help.guide.photo-providers.step.2': '‘연결 테스트’를 클릭한 다음 ‘저장’을 클릭하세요. 배지가 ‘연결됨’으로 바뀌어요.',
  'help.guide.photo-providers.result':
    '기록 편집기의 “External photos” 탭에서 연결된 라이브러리의 해당 날짜 사진을 찾아 줘요. 기록 위치에서 가까운 사진부터 보여 줘요.',
  'help.guide.photo-providers.tip.1':
    '연결은 내 계정에만 적용돼요. Journey의 다른 멤버는 각자 자기 라이브러리를 연결해요.',
  'help.guide.photo-providers.tip.2':
    '사진에 GPS 정보가 없는 제공자도 쓸 수 있어요. 이때는 목록이 시간순으로 정렬돼요.',
  // api-keys
  'help.guide.api-keys.title': 'API 키 만들기',
  'help.guide.api-keys.goal': '다른 소프트웨어가 공개 API로 내 여행을 읽을 수 있게 해요.',
  'help.guide.api-keys.step.1':
    '‘API 키’에서 ‘키 만들기’를 클릭하고, 어디에 쓸지 알 수 있는 ‘이름’을 붙인 뒤 ‘이 키가 읽을 수 있는 항목’에서 필요한 영역만 남기세요. 그리고 ‘생성’을 클릭하세요.',
  'help.guide.api-keys.step.2':
    '‘API 키를 만들었습니다’에서 키를 복사하세요. 키는 한 번만 보여요. ‘완료’를 클릭하세요. 호출할 ‘엔드포인트’는 목록 아래에 나와요.',
  'help.guide.api-keys.result':
    '키를 가진 소프트웨어는 고른 영역을 읽기만 하고, 아무것도 바꿀 수 없어요. 목록에 키마다 만든 시각과 마지막 사용 시각이 보이고, 휴지통으로 삭제해요.',
  'help.guide.api-keys.tip.1': '도구마다 키를 하나씩 쓰면, 다른 도구에 영향 없이 키 하나만 취소할 수 있어요.',
  'help.guide.api-keys.tip.2': 'AI 클라이언트가 내용을 바꾸게 하려면 대신 OAuth로 MCP를 쓰세요. API 키는 읽기만 해요.',
  // mcp-oauth
  'help.guide.mcp-oauth.title': 'MCP로 AI 어시스턴트 연결하기',
  'help.guide.mcp-oauth.goal': 'Claude, IDE 등 MCP 클라이언트가 내 여행에 접근하게 해요.',
  'help.guide.mcp-oauth.step.1': '‘MCP 설정’에서 클라이언트에 넣을 ‘MCP 엔드포인트’를 복사하세요.',
  'help.guide.mcp-oauth.step.2':
    '‘OAuth 2.1 클라이언트’에서 ‘새 클라이언트’를 클릭하고 Claude Desktop이나 Cursor 같은 빠른 프리셋을 고르거나, ‘앱 이름’, ‘리디렉션 URI’, ‘허용 권한 범위’를 직접 입력하세요. 브라우저가 없는 서버라면 머신 클라이언트를 고르세요. ‘클라이언트 등록’을 클릭하고 ‘클라이언트 시크릿’을 복사하세요. 한 번만 보여요.',
  'help.guide.mcp-oauth.step.3':
    '클라이언트마다 ‘시크릿 교체’와 ‘클라이언트 삭제’가 있어요. ‘활성 OAuth 세션’에는 로그인한 클라이언트가 ‘취소’ 버튼과 함께 나열돼요. ‘클라이언트 설정’을 펼치면 JSON을 쓰는 클라이언트용 스니펫이 준비돼 있어요.',
  'help.guide.mcp-oauth.result':
    '클라이언트는 권한 범위가 허용하는 만큼 내 계정으로 데이터를 읽고 바꿀 수 있고, 모든 작업은 내 이름으로 표시돼요.',
  'help.guide.mcp-oauth.tip.1':
    '“권한 범위”로 클라이언트가 할 수 있는 일을 제한해요. 더 필요해질 때까지는 읽기 범위만 주세요.',
  'help.guide.mcp-oauth.tip.2': '관리자가 인스턴스 전체에서 MCP를 끌 수 있어요. 그러면 이 섹션이 나오지 않아요.',
  // offline-prepare
  'help.guide.offline-prepare.title': '여행을 오프라인으로 저장하기',
  'help.guide.offline-prepare.goal': '인터넷 연결이 끊기기 전에 여행과 지도를 이 기기에 저장해요.',
  'help.guide.offline-prepare.step.1':
    '‘오프라인에 저장할 항목’에서 ‘지도 타일을 오프라인에 저장’을 켜 두고, 이 기기에 저장할 여행을 켜세요. 끝난 여행은 직접 켜야만 저장돼요.',
  'help.guide.offline-prepare.step.2':
    '다시 맨 위 ‘오프라인 준비’에서 ‘오프라인 사용을 위해 다운로드’를 클릭하세요. 여행 데이터, 문서, 지도 타일을 내려받고 몇 개의 여행을 저장했는지 알려 줘요.',
  'help.guide.offline-prepare.step.3':
    '‘오프라인 모드 강제 사용’은 한 번 더 내려받은 뒤 이 기기만으로 동작해요. 떠나기 전에 모두 잘 저장됐는지 확인할 수 있어요.',
  'help.guide.offline-prepare.result':
    '인터넷 연결 없이도 여행이 열려요. 바꾼 내용은 대기열에 저장되고, 다시 온라인이 되면 전송돼요.',
  'help.guide.offline-prepare.tip.1': '지도 타일이 용량을 가장 많이 차지해요. 끄면 여행 데이터와 문서만 저장해요.',
  'help.guide.offline-prepare.tip.2': '오프라인에서 가장 매끄럽게 시작하려면 브라우저에서 TREK를 앱으로 설치하세요.',
  // offline-conflicts
  'help.guide.offline-conflicts.title': '동기화 충돌 시 남길 버전 정하기',
  'help.guide.offline-conflicts.goal':
    '오프라인에서 한 변경과 다른 곳에서 한 변경이 충돌할 때 TREK이 어떻게 처리할지 정해요.',
  'help.guide.offline-conflicts.step.1':
    '오프라인에서 바꾼 내용이 더 새로운 변경과 충돌하면 ‘오프라인’ 위쪽에 ‘동기화 충돌’이 나타나요. 변경마다 ‘내 버전’이나 ‘상대 버전 유지’를 클릭하세요.',
  'help.guide.offline-conflicts.step.2':
    '같은 카드의 ‘충돌이 발생하면’에서 다음부터 어떻게 할지 정해요: ‘매번 묻기’, ‘항상 내 버전 유지’, ‘항상 서버 버전 유지’.',
  'help.guide.offline-conflicts.result':
    '‘매번 묻기’를 고르면 내가 선택할 때까지 충돌이 ‘동기화 충돌’에 남아 있어요. 나머지 두 옵션에서는 TREK가 자동으로 해결해요.',
  'help.guide.offline-conflicts.tip.1':
    '“캐시 지우기”는 이 기기에 저장된 사본만 지워요. 서버의 데이터는 바뀌지 않아요.',
  // profile
  'help.guide.profile.title': '프로필 바꾸기',
  'help.guide.profile.goal': '이름, 이메일, 사진을 바꿔요.',
  'help.guide.profile.step.1':
    '‘계정’ 카드에서 사진의 카메라 아이콘을 클릭해 사진을 올리세요. 빨간 휴지통을 누르면 사진이 삭제되고 이니셜이 다시 보여요.',
  'help.guide.profile.step.2': '사진 아래에서 ‘사용자 이름’과 ‘이메일’을 수정하세요.',
  'help.guide.profile.result': '공유한 여행을 포함해 모든 곳에서 이름과 사진이 바로 바뀌어요.',
  'help.guide.profile.tip.1': 'SSO로 연결된 계정에는 SSO 배지와 함께 어느 제공자와 ‘연결됨’인지 보여요.',
  // password
  'help.guide.password.title': '비밀번호 바꾸기',
  'help.guide.password.goal': '새 비밀번호를 설정해요.',
  'help.guide.password.step.1':
    '‘비밀번호 변경’에서 ‘현재 비밀번호’를 입력하고, ‘새 비밀번호’와 ‘새 비밀번호 확인’에 같은 값을 입력하세요. 입력하는 동안 아래 목록에서 규칙이 하나씩 체크돼요.',
  'help.guide.password.step.2': '“비밀번호 업데이트”를 클릭하세요.',
  'help.guide.password.result':
    '새 비밀번호는 바로 적용돼요. 다른 모든 기기에서 로그아웃되고, MCP API 토큰이 삭제되며, OAuth 클라이언트는 다시 로그인해야 해요. 지금 쓰는 기기는 로그인 상태가 유지돼요.',
  'help.guide.password.tip.1': '이 TREK가 SSO로만 로그인하면 TREK 비밀번호도, ‘비밀번호 변경’ 카드도 없어요.',
  // mfa
  'help.guide.mfa.title': '2단계 인증 켜기',
  'help.guide.mfa.goal': '인증 앱의 코드로 계정을 보호해요.',
  'help.guide.mfa.step.1': '‘2단계 인증 (2FA)’에서 ‘인증 앱 설정’을 클릭하세요.',
  'help.guide.mfa.step.2':
    '앱으로 QR 코드를 스캔하거나 시크릿을 직접 입력한 뒤, 앱에 나오는 6자리 코드를 입력하고 ‘2FA 활성화’를 클릭하세요.',
  'help.guide.mfa.step.3':
    '‘코드 복사’, ‘TXT 다운로드’, ‘인쇄 / PDF’ 중 하나로 백업 코드를 저장하고 ‘확인’을 클릭하세요. 코드는 각각 한 번만 쓸 수 있어요. 휴대폰이 없을 때 코드를 쓰세요.',
  'help.guide.mfa.result': '로그인할 때마다 비밀번호 다음에 코드를 물어봐요.',
  'help.guide.mfa.tip.1': '‘2FA 비활성화’에는 비밀번호와 현재 코드 또는 사용하지 않은 백업 코드가 필요해요.',
  'help.guide.mfa.tip.2': '관리자가 모든 사용자에게 2FA를 필수로 지정할 수 있어요. 그러면 여기서 끌 수 없어요.',
  // passkeys
  'help.guide.passkeys.title': '패스키로 로그인하기',
  'help.guide.passkeys.goal': '비밀번호 대신 기기의 지문, 얼굴 인식, PIN으로 로그인해요.',
  'help.guide.passkeys.step.1':
    '‘패스키’에서 ‘패스키 추가’를 클릭하고, 현재 비밀번호를 확인한 뒤 어떤 기기인지 알 수 있는 이름을 붙이고, 기기 안내를 따르세요.',
  'help.guide.passkeys.step.2':
    '패스키마다 ‘동기화됨’인지 ‘이 기기’ 전용인지, 마지막으로 언제 썼는지 보여요. ‘이름 바꾸기’로 이름을 바꾸고, 삭제 버튼은 비밀번호를 입력하면 삭제해요.',
  'help.guide.passkeys.result': '로그인 페이지에 패스키가 나와요. 비밀번호로도 계속 로그인할 수 있어요.',
  'help.guide.passkeys.tip.1':
    '패스키는 기기나 기기의 비밀번호 관리자에 저장돼요. 그러니 기기마다 패스키를 하나씩 추가하세요.',
  'help.guide.passkeys.tip.2':
    '패스키는 관리자가 켜야 보여요. 서버에 WebAuthn 도메인이 설정되기 전에는 ‘패스키 추가’ 대신 그 안내가 카드에 나와요.',
  // delete-account
  'help.guide.delete-account.title': '계정 삭제하기',
  'help.guide.delete-account.goal': '내 계정과 나만의 데이터를 삭제해요.',
  'help.guide.delete-account.step.1': '‘계정’ 카드 하단 왼쪽의 ‘계정 삭제’를 클릭한 다음 ‘영구 삭제’를 클릭하세요.',
  'help.guide.delete-account.result':
    '계정과 함께 내가 소유한 여행, 장소, 파일이 삭제돼요. 다른 사람이 소유한 여행은 남아요.',
  'help.guide.delete-account.tip.1':
    '관리자가 나 하나뿐이면 TREK에 ‘삭제 불가’가 표시돼요. 먼저 다른 사용자를 관리자로 지정하세요.',
  'help.guide.delete-account.tip.2': '되돌릴 수 없어요. 확인하기 전에 남기고 싶은 데이터를 내보내세요.',

  // ── Screen: admin (all tabs) ──────────────────────────────────────────────────────────
  'help.ctx.admin.title': '관리자',
  'help.ctx.admin.summary':
    'TREK 인스턴스 전체와 모든 사용자에 대한 설정이에요. 누가 어떻게 로그인할지, 어떤 기능을 켤지, 파일을 어디에 저장할지, 서버가 사람들에게 어떻게 연락할지, 어떻게 백업할지를 정해요. 이 페이지는 관리자에게만 보여요. 사이드바에서 탭이 ‘사용자’, ‘구성’, ‘통합’, ‘유지 관리’로 묶여 있고, 탭마다 화면이 따로 있어요.',
  'help.ctx.admin.bullet.1':
    '헤더 오른쪽에 사용자, 여행, 장소, 파일 수가 보여요. 더 새로운 TREK 버전이 나오면 그 아래에 ‘업데이트 가능’ 배너가 떠요.',
  'help.ctx.admin.bullet.2': '‘사용자’와 ‘기본값’: 계정, 초대 링크, 권한, 그리고 새 계정의 시작 설정과 지도.',
  'help.ctx.admin.bullet.3':
    '‘개인 설정’, ‘설정’, ‘애드온’, ‘플러그인’, ‘스토리지’: 짐 템플릿, 카테고리, 학교 방학, 로그인, 패스키, 2FA, API 키, 검색 제공자, 기능 모듈, 외부 플러그인, 업로드 저장 위치.',
  'help.ctx.admin.bullet.4':
    '‘알림’, ‘MCP 접근’, GitHub: 사용자가 고를 수 있는 채널과 기본값, AI 클라이언트의 토큰과 세션, 릴리스 내역.',
  'help.ctx.admin.bullet.5': '“백업”과 “감사”: 수동 백업과 예약 백업, 보안 관련 이벤트 로그.',
  'help.ctx.admin-users.title': '사용자',
  'help.ctx.admin-users.summary':
    '이 TREK의 모든 계정과 역할, 이메일, 마지막 활동 시각, 가입이 닫힌 인스턴스에서 가입하게 해 주는 초대 링크, 그리고 여행에서 누가 무엇을 할 수 있는지 관리해요.',
  'help.ctx.admin-users.bullet.1':
    '표: 사용자, 이메일, 역할, 생성일, ‘마지막 활동’이 있고, 줄마다 ‘사용자 편집’과 ‘사용자 삭제’가 있어요. 아바타의 초록 점은 지금 접속 중이라는 뜻이고, 내 줄에는 ‘(나)’가 보여요.',
  'help.ctx.admin-users.bullet.2':
    '‘사용자’ 카드 오른쪽 위의 ‘사용자 만들기’로 계정을 직접 추가해요. 비밀번호는 내가 정해서 사용자에게 알려 주면 돼요.',
  'help.ctx.admin-users.bullet.3':
    '아래 ‘초대 링크’: 사용 횟수 제한과 만료일이 있는 가입 링크예요. 원하면 새 사용자가 가입할 때 참여할 여행도 지정할 수 있어요.',
  'help.ctx.admin-users.bullet.4':
    '맨 아래 ‘권한 설정’: 작업마다 누가 할 수 있는지(‘모든 사람’, ‘여행 멤버’, ‘여행 소유자’, ‘관리자만’) 정해요. 카드 위쪽 ‘저장’을 클릭해 저장하세요.',
  'help.ctx.admin-defaults.title': '기본값',
  'help.ctx.admin-defaults.summary':
    '새 계정이 처음 갖는 값이라 아무도 따로 설정할 필요가 없어요: 색상 모드, 단위, 시간 형식, 주 시작 요일, 표시 통화, 예약 코드 흐리게, 그리고 지도와 지도 키, 경로 서버.',
  'help.ctx.admin-defaults.bullet.1':
    '왼쪽 ‘기본 사용자 설정’: ‘색상 모드’, ‘온도 단위’, ‘거리 단위’, ‘시간 형식’, ‘주 시작 요일’, ‘표시 통화’, ‘예약 코드 흐리게’.',
  'help.ctx.admin-defaults.bullet.2':
    '오른쪽 ‘지도’: ‘지도 템플릿’, ‘공유 CARTO 키’, ‘자체 경로 서버’와 ‘자체 Valhalla 인스턴스’, 미리보기, 그리고 ‘지도 엔진’과 ‘지도 스타일’, ‘공유 Mapbox 토큰’, ‘3D 건물 & 지형’, ‘고품질 모드’.',
  'help.ctx.admin-config.title': '개인 설정',
  'help.ctx.admin-config.summary':
    '인스턴스의 모든 여행이 함께 쓰는 설정이에요: 짐 목록 템플릿, 장소와 컬렉션에 쓰는 카테고리, Vacay가 쓰는 학교 방학 목록.',
  'help.ctx.admin-config.bullet.1':
    '“짐 목록 템플릿”: 카테고리와 항목으로 구성된 이름 있는 목록으로, 여행의 짐 목록을 이걸로 시작할 수 있어요.',
  'help.ctx.admin-config.bullet.2':
    '‘카테고리’: 장소 상세부터 컬렉션까지 TREK 전체에서 쓰는 카테고리의 이름, 아이콘, 색이에요. 미리보기가 있는 창에서 하나씩 편집해요.',
  'help.ctx.admin-config.bullet.3': '학교 방학: 국가와 지역별 방학 기간 목록으로, 누구나 Vacay에서 고를 수 있어요.',
  'help.ctx.admin-settings.title': '설정',
  'help.ctx.admin-settings.summary':
    '사람들이 어떻게 로그인하는지, 서버가 어떤 외부 서비스를 쓸 수 있는지 정해요. 왼쪽: ‘인증 방법’, ‘패스키 로그인’, ‘2단계 인증 (2FA) 요구’, 싱글 사인온(OIDC). 오른쪽: ‘허용된 파일 형식’과 검색 및 대중교통 제공자가 있는 ‘API 키’. ‘위험 구역’은 맨 아래에 있어요.',
  'help.ctx.admin-settings.bullet.1':
    '‘인증 방법’: ‘비밀번호 로그인’, ‘비밀번호 회원가입’, 그리고 OIDC를 설정하면 ‘SSO 로그인’과 ‘SSO 자동 프로비저닝’. ‘2단계 인증 (2FA) 요구’는 카드가 따로 있어요.',
  'help.ctx.admin-settings.bullet.2':
    '‘패스키 로그인’: ‘패스키 로그인 활성화’, ‘Relying Party ID (도메인)’, ‘허용된 오리진’. 싱글 사인온(OIDC): ‘표시 이름’, ‘발급자 URL’, 선택 항목인 Discovery URL, ‘클라이언트 ID’, ‘클라이언트 시크릿’.',
  'help.ctx.admin-settings.bullet.3':
    '‘API 키’: 맨 위 TREK Places API는 키가 필요 없어요. 그 아래 ‘Google Maps API 키’(‘테스트’와 ‘키의 사용 범위’ 포함), Unsplash 키, Amap 키가 있고, 카드 맨 아래에 ‘저장’ 버튼이 하나 있어요.',
  'help.ctx.admin-settings.bullet.4':
    '‘대중교통 제공자’와 ‘장소 검색 제공자’로 대중교통과 장소 검색을 어디서 할지 정해요. ‘장소 검색 기록’은 어떤 결과를 골랐는지 기록하고, ‘허용된 파일 형식’은 업로드를 제한해요.',
  'help.ctx.admin-addons.title': '애드온',
  'help.ctx.admin-addons.summary':
    'TREK의 기능 모듈로, 모듈마다 스위치가 있어요: 짐 목록, 예산, 문서, Vacay, Atlas, Collab, Journey, 컬렉션, 로드트립, MCP, AirTrail, Dawarich, AI 분석. 끄면 모든 사용자에게서 메뉴 항목, 경로, API가 사라져요.',
  'help.ctx.admin-addons.bullet.1': '애드온마다 스위치가 있는 타일이 있고, 옵션이 있으면 그 아래에 줄이 있어요.',
  'help.ctx.admin-addons.bullet.2':
    '사진 제공자와 문서 제공자도 여기에 타일로 나와서, Immich나 Synology를 사용자에게 제공할 수 있어요.',
  'help.ctx.admin-addons.bullet.3': '‘가방 추적’은 타일 아래에 따로 스위치가 있어요.',
  'help.ctx.admin-plugins.title': '플러그인',
  'help.ctx.admin-plugins.summary':
    'TREK 옆에서 별도 프로세스로 실행되는 서드파티 플러그인이에요. 각 플러그인은 설치할 때 요청한 권한을 가져요. 카탈로그에서 설치하거나, 패키지를 업로드하거나, 플러그인을 개발하는 동안에는 폴더를 연결할 수 있어요.',
  'help.ctx.admin-plugins.bullet.1':
    '‘설치됨’과 ‘둘러보기’에 ‘플러그인 검색…’과 ‘유형’, ‘상태’, ‘정렬’ 필터가 있어요. 줄마다 버전, ‘검토됨’, ‘서명됨’ 또는 ‘서명 없음’, 플러그인이 접근할 수 있는 것, 스위치, ⋯ 메뉴가 보여요.',
  'help.ctx.admin-plugins.bullet.2':
    '카드 헤더의 아이콘 두 개: ‘플러그인 업로드’는 .zip, .tgz, .tar.gz 파일을 받아요(.zip은 페이지에 끌어다 놓아도 돼요). ‘다시 스캔’은 개발용으로 연결한 플러그인 폴더를 찾아요.',
  'help.ctx.admin-plugins.bullet.3':
    '플러그인별 “허용된 호스트”: 외부 연결은 기본적으로 차단되므로, 플러그인이 호출할 수 있는 주소를 여기서 정해요.',
  'help.ctx.admin-storage.title': '스토리지',
  'help.ctx.admin-storage.summary':
    '업로드 파일을 저장할 곳이에요: 로컬 디스크나 S3 버킷이고, 필요하면 다른 백엔드로도 복사할 수 있어요. 업로드 카테고리마다 다른 백엔드를 쓸 수 있고, ‘변경 사항 저장’을 클릭하기 전까지는 아무것도 바뀌지 않아요.',
  'help.ctx.admin-storage.bullet.1':
    '맨 위 ‘건강’: 미러 대상에 쓰지 못한 기록, 또는 ‘기록된 복제본 오류가 없습니다.’가 보여요.',
  'help.ctx.admin-storage.bullet.2':
    '‘백엔드’: 이름, 유형, 사용량, 미러 대상이 보이고 ‘테스트’, ‘편집’, ‘제거’가 있어요. ‘지금 계산’으로 저장된 양을 계산해요. 환경 변수로 정의한 백엔드는 읽기 전용이에요.',
  'help.ctx.admin-storage.bullet.3':
    '‘카테고리’: 여행 문서, Journey 사진, 커버, 프로필 사진, 장소 이미지, 사진 캐시, 백업을 각각 백엔드에 지정해요.',
  'help.ctx.admin-notifications.title': '알림',
  'help.ctx.admin-notifications.summary':
    '인스턴스가 사용자에게 제공하는 채널과 관리자인 내가 받는 채널이에요. 사용자는 ‘설정’에서 자기 토픽과 URL을 고르고, 관리자는 어떤 채널을 제공할지 정하고 이메일을 설정해요.',
  'help.ctx.admin-notifications.bullet.1':
    '‘이메일 (SMTP)’, ‘웹훅’, ‘Ntfy’, ‘웹 푸시’마다 사용자에게 그 채널을 제공하는 스위치가 있어요. 이메일은 서버 설정도 필요해요. ‘앱 내’는 항상 켜져 있어요.',
  'help.ctx.admin-notifications.bullet.2': '‘여행 리마인더’: 여행 시작 전에 서버가 리마인더를 보낼지 정해요.',
  'help.ctx.admin-notifications.bullet.3':
    '‘관리자 웹훅’, ‘관리자 Ntfy’, ‘알림’ 카드: 관리자 이벤트(‘새 버전 사용 가능’, ‘스토리지 복제본 오류’, ‘패들 지역 요청’)를 보낼 곳이고, 각각 테스트 버튼이 있어요.',
  'help.ctx.admin-mcp-tokens.title': 'MCP 접근',
  'help.ctx.admin-mcp-tokens.summary':
    '모든 사용자의 AI 클라이언트가 이 TREK에 대해 가진 토큰과 OAuth 세션을 모두 보여 줘요. 어느 것이든 취소할 수 있어요.',
  'help.ctx.admin-mcp-tokens.bullet.1':
    'OAuth 세션: 클라이언트, 허용된 스코프, 소유자, 날짜가 보이고 휴지통 아이콘으로 취소할 수 있어요.',
  'help.ctx.admin-mcp-tokens.bullet.2':
    'API 토큰: 이름, 소유자, ‘생성일’, ‘마지막 사용’이 보이고 휴지통 아이콘으로 삭제해요.',
  'help.ctx.admin-github.title': 'GitHub',
  'help.ctx.admin-github.summary':
    'TREK의 새 소식이에요: GitHub의 릴리스 내역과, 지금 버전보다 새 버전이 나왔는지 보여 줘요. 업데이트 자체는 앱이 아니라 호스트에서 해요.',
  'help.ctx.admin-github.bullet.1':
    '‘릴리스 히스토리’에 릴리스가 노트와 함께 타임라인으로 나와요. 가장 새 버전에는 ‘최신’이, 사전 릴리스에는 ‘사전 릴리스’가 붙고, GitHub 버튼으로 릴리스 페이지를 열어요.',
  'help.ctx.admin-github.bullet.2':
    '새 릴리스가 나오면 페이지 헤더 아래에 ‘업데이트 가능’이 나타나요. ‘업데이트 방법’에는 Docker 명령어나 다른 설치 방식용 업데이트 가이드가 나와요.',
  'help.ctx.admin-backup.title': '백업',
  'help.ctx.admin-backup.summary':
    '데이터베이스와 업로드 파일 전체를 백업해요. 직접 만들거나 일정에 따라 만들고, 서버에 보관되며, 파일 하나로 내려받을 수 있어요. ‘복원’으로 백업을 되돌려요.',
  'help.ctx.admin-backup.bullet.1':
    '‘데이터 백업’: 카드 위쪽의 ‘백업 만들기’와 ‘백업 업로드’, 그리고 ‘다운로드’, ‘복원’, 삭제용 휴지통 아이콘이 있는 백업 목록.',
  'help.ctx.admin-backup.bullet.2':
    '‘백업 업로드’는 다른 인스턴스나 예전에 만든 파일로 복원하고, ‘복원’과 같은 확인을 거쳐요.',
  'help.ctx.admin-backup.bullet.3':
    '자동 백업: 켜기/끄기, ‘간격’, ‘실행 시간’과 요일, ‘이후 오래된 백업 삭제’(1일부터 ‘영구 보관’까지)를 정하고 ‘저장’으로 적용해요.',
  'help.ctx.admin-audit.title': '감사',
  'help.ctx.admin-audit.summary':
    '보안 및 관리 이벤트 기록이에요: 로그인과 실패, MFA 변경, 사용자와 설정 변경, 백업과 복원. 읽기 전용이고 최신순이에요.',
  'help.ctx.admin-audit.bullet.1': '이벤트마다 한 행씩 시간, 사용자, 작업, 리소스, IP, 세부 정보가 표시돼요.',
  'help.ctx.admin-audit.bullet.2':
    '카드 헤더의 ‘새로 고침’으로 목록을 다시 불러와요. 제목 옆 배지는 전체 중 몇 개를 불러왔는지 보여 주고, ‘더 불러오기’로 이전 기록을 불러와요.',
  // create-user
  'help.guide.create-user.title': '사용자 만들기',
  'help.guide.create-user.goal': '초대 없이 계정을 직접 추가해요.',
  'help.guide.create-user.step.1': '‘사용자’ 카드 오른쪽 위의 ‘사용자 만들기’를 클릭하세요.',
  'help.guide.create-user.step.2':
    '‘사용자 이름’, ‘이메일’, ‘비밀번호’를 입력하세요. 비밀번호 아래 체크리스트에서 어떤 규칙을 충족했는지 보여요. ‘역할’은 ‘사용자’나 ‘관리자’ 중에서 고르세요.',
  'help.guide.create-user.step.3': '“사용자 만들기”를 클릭하세요.',
  'help.guide.create-user.result':
    '계정이 표에 나타나고 바로 로그인할 수 있어요. 비밀번호는 믿을 수 있는 경로로 전달하세요.',
  'help.guide.create-user.tip.1': '비밀번호를 직접 정해야 하는 사람이라면 초대 링크가 더 좋아요.',
  'help.guide.create-user.tip.2':
    '‘관리자’는 이 페이지를 볼 수 있고 모든 것을 할 수 있어요. ‘사용자’가 여행에서 할 수 있는 일은 아래 ‘권한 설정’에서 정해요.',
  // edit-user
  'help.guide.edit-user.title': '사용자 정보나 비밀번호 바꾸기',
  'help.guide.edit-user.goal':
    '사용자 이름을 바꾸거나, 관리자로 올리거나 내리거나, 비밀번호를 잊은 사람이 다시 로그인하게 도와요.',
  'help.guide.edit-user.step.1': '사용자 줄의 연필(‘사용자 편집’)을 클릭하세요. 창 맨 위에 계정 이메일이 보여요.',
  'help.guide.edit-user.step.2':
    '‘사용자 이름’, ‘이메일’, ‘역할’을 바꾸거나 ‘새 비밀번호’를 입력하고(현재 비밀번호를 유지하려면 비워 두세요) ‘저장’을 클릭하세요. 맨 아래 ‘패스키 초기화’를 누르면 확인 후 그 계정의 패스키가 모두 삭제돼요.',
  'help.guide.edit-user.result':
    '변경은 바로 적용돼요. 새 비밀번호를 정하면 그 사람은 모든 기기에서 로그아웃되므로, 이전 세션은 더 이상 동작하지 않아요.',
  'help.guide.edit-user.tip.1': '내가 마지막 관리자라면 내 관리자 역할을 뺄 수 없어요.',
  'help.guide.edit-user.tip.2':
    '패스키를 초기화해도 비밀번호는 그대로예요. 새 패스키는 본인이 “설정”의 “계정”에서 추가해요.',
  // invite-links
  'help.guide.invite-links.title': '링크로 초대하기',
  'help.guide.invite-links.goal': '가입이 막힌 인스턴스에 누군가 가입할 수 있게 하고, 원하면 여행에도 추가해요.',
  'help.guide.invite-links.step.1': '‘초대 링크’ 카드 오른쪽 위의 ‘링크 만들기’를 클릭하세요.',
  'help.guide.invite-links.step.2':
    '‘최대 사용 횟수’(1×~5× 또는 ∞)와 ‘만료 기간’(1일~14일 또는 ∞)을 고르고, 필요하면 ‘여행에 추가 (선택 사항)’에서 여행을 고른 뒤 ‘만들기 및 복사’를 클릭하세요.',
  'help.guide.invite-links.step.3':
    '링크를 보내세요. 줄마다 사용 횟수, 만료일, 추가될 여행, 만든 사람이 보이고, 옆에 ‘활성’, ‘만료됨’, ‘사용 완료’가 붙어요. ‘링크 복사’로 다시 복사하고, 휴지통으로 삭제해요.',
  'help.guide.invite-links.result':
    '링크를 연 사람이 자기 비밀번호로 가입해요. 여행을 지정했다면 바로 그 여행에 참여해요.',
  'help.guide.invite-links.tip.1': '‘설정’에서 ‘비밀번호 회원가입’을 꺼 둬도 초대 링크는 동작해요.',
  'help.guide.invite-links.tip.2': '한 사람에게 보낼 때는 1회 사용에 만료가 짧은 링크가 가장 안전해요.',
  // delete-user
  'help.guide.delete-user.title': '사용자 삭제하기',
  'help.guide.delete-user.goal': '계정과 그 계정이 가진 모든 것을 삭제해요.',
  'help.guide.delete-user.step.1': '사용자 줄의 휴지통(‘사용자 삭제’)을 클릭하고 ‘삭제’로 확인하세요.',
  'help.guide.delete-user.result':
    '계정과 함께 그 계정이 소유한 모든 여행과 Journey가 삭제돼요. 다른 사람과 공유한 여행도 마찬가지예요. 멤버로만 참여한 여행은 소유자에게 남아요.',
  'help.guide.delete-user.tip.1': '되돌릴 수 없어요. 확실하지 않다면 먼저 백업하세요.',
  'help.guide.delete-user.tip.2':
    '내 줄의 휴지통 아이콘은 동작하지 않아요. 나 자신은 삭제할 수 없으니 다른 관리자가 해야 해요.',
  // permissions
  'help.guide.permissions.title': '누가 무엇을 할 수 있는지 정하기',
  'help.guide.permissions.goal': '이 TREK에서 작업마다 어떤 역할이 할 수 있는지 정해요.',
  'help.guide.permissions.step.1':
    '‘권한 설정’에서 ‘여행 관리’의 ‘여행 삭제’처럼 그룹 안의 작업을 찾아 누가 할 수 있는지 고르세요: ‘모든 사람’, ‘여행 멤버’, ‘여행 소유자’, ‘관리자만’. 바꾼 줄에는 ‘맞춤 설정됨’이 표시돼요.',
  'help.guide.permissions.step.2':
    '카드 오른쪽 위의 ‘저장’을 클릭하세요. ‘기본값으로 초기화’는 모든 줄을 기본 수준으로 되돌려요. 그 뒤에도 ‘저장’을 클릭하세요.',
  'help.guide.permissions.result':
    '규칙이 모든 여행에 한 번에 적용돼요. 권한 수준이 안 되는 사람에게는 관련 버튼과 메뉴가 더 이상 보이지 않아요.',
  'help.guide.permissions.tip.1': '‘여행 소유자’는 여행을 만든 사람이에요. 관리자는 언제나 모든 것을 할 수 있어요.',
  'help.guide.permissions.tip.2':
    '작업마다 줄이 따로 있어서, 예를 들어 멤버에게 장소와 날 계획은 맡기고 여행 삭제는 소유자만 하게 할 수 있어요.',
  // default-map
  'help.guide.default-map.title': '새 사용자의 지도 기본값 정하기',
  'help.guide.default-map.goal': '개인 토큰 없이도 모든 새 계정에서 지도가 동작하게 해요.',
  'help.guide.default-map.step.1':
    '‘지도’에서 ‘지도 템플릿’을 고르거나 타일 URL을 붙여 넣고, CARTO 타일을 쓴다면 ‘공유 CARTO 키’를 입력하세요. 아래 미리보기에 결과가 보여요.',
  'help.guide.default-map.step.2':
    '더 아래에서 ‘지도 엔진’을 고르세요: ‘표준 (무료)’, Mapbox(3D), MapLibre(OpenFreeMap). Mapbox와 MapLibre는 ‘지도 스타일’을 고르고, Mapbox는 ‘공유 Mapbox 토큰’을 넣은 뒤 ‘3D 건물 & 지형’과 ‘고품질 모드’를 정하세요.',
  'help.guide.default-map.result':
    '새 계정은 이 설정으로 시작해요. “설정”에서 지도를 직접 정한 사용자는 자기 설정이 유지돼요.',
  'help.guide.default-map.tip.1':
    '여기에 넣은 토큰이나 키는 자기 키가 없는 모든 사람이 함께 쓰니 사용량 한도에 주의하세요.',
  'help.guide.default-map.tip.2': '지도 탭에서 아무것도 바꾸지 않은 기존 계정도 이 기본값을 써요.',
  // packing-templates
  'help.guide.packing-templates.title': '짐 목록 템플릿 만들기',
  'help.guide.packing-templates.goal': '빈 목록 대신 바로 시작할 수 있는 짐 목록을 여행에 제공해요.',
  'help.guide.packing-templates.step.1': '‘새 템플릿’을 클릭하고 이름을 입력한 뒤 체크 표시로 확정하세요.',
  'help.guide.packing-templates.step.2':
    '템플릿 이름을 클릭해 열고 ‘카테고리 추가’를 클릭하세요. 카테고리 위쪽 +로 항목을 추가해요. 항목은 이름만 있으면 돼요.',
  'help.guide.packing-templates.step.3':
    '작업하는 대로 모두 저장돼요. 연필로 템플릿, 카테고리, 항목 이름을 바꿔요. 휴지통은 항목을 바로 삭제하고, 템플릿이나 카테고리는 안의 내용까지 모두 삭제되기 때문에 먼저 물어봐요.',
  'help.guide.packing-templates.result':
    '모든 여행의 짐 목록에서 템플릿을 고를 수 있어요. 적용하면 항목이 복사되니 여행마다 자유롭게 바꿀 수 있어요.',
  'help.guide.packing-templates.tip.1':
    '아주 긴 목록 하나보다 해변, 도시, 하이킹처럼 여행 종류마다 템플릿을 하나씩 두는 게 좋아요.',
  'help.guide.packing-templates.tip.2': '템플릿을 삭제해도 이미 적용한 여행은 바뀌지 않아요.',
  'help.guide.packing-templates.tip.3':
    '여행 짐 목록에서 ‘템플릿으로 저장’을 누르면 항목마다 무게, 수량, 가방이 담긴 템플릿이 만들어져요. 여기서는 항목 옆에 표시되고, 템플릿을 적용하면 항목이 같은 가방에 들어가요.',
  // categories
  'help.guide.categories.title': '카테고리 관리하기',
  'help.guide.categories.goal': '장소와 컬렉션에 쓸 카테고리와 그 모양을 정해요.',
  'help.guide.categories.step.1':
    '‘새 카테고리’를 클릭하고, 창의 제목 줄에 이름을 입력한 뒤 ‘아이콘’과 ‘색상’을 고르고 ‘미리보기’를 확인하세요. 그리고 ‘생성’을 클릭하세요.',
  'help.guide.categories.step.2':
    '목록에서 연필(‘편집’)로 카테고리를 열고 ‘업데이트’로 저장해요. 휴지통(‘삭제’)은 확인 후 삭제해요.',
  'help.guide.categories.result': '모든 곳에 한 번에 적용돼요: 장소 인스펙터, 지도 핀, 컬렉션, 필터.',
  'help.guide.categories.tip.1': '장소는 카테고리 ID를 유지해서, 카테고리 이름을 바꾸면 모든 장소에서 이름이 바뀌어요.',
  'help.guide.categories.tip.2':
    '카테고리를 삭제하면 그 장소들은 카테고리가 없어져요. 필요하면 먼저 다른 카테고리로 옮기세요.',
  // school-holiday-catalog
  'help.guide.school-holiday-catalog.title': '학교 방학 직접 관리하기',
  'help.guide.school-holiday-catalog.goal': '누구나 Vacay에서 고를 수 있도록 국가나 지역의 학교 방학을 관리해요.',
  'help.guide.school-holiday-catalog.step.1':
    '‘학교 방학’에서 국가를 고르거나, +(‘국가 추가’)를 클릭해 국가와 ‘국가 코드(예: US)’를 입력하고 ‘저장’하세요. ‘지역 추가’로 날짜가 따로 있는 지역을 하나씩 추가해요.',
  'help.guide.school-holiday-catalog.step.2':
    '지역을 클릭해 ‘지역 또는 학군’을 여세요. ‘방학 기간 추가’를 누르고 기간마다 ‘방학 이름’, ‘시작일’, ‘종료 날짜’를 입력한 뒤 ‘저장’하세요. 휴지통으로 기간이나 지역을 삭제하고, 지역이 하나도 남지 않은 국가는 삭제할 수 있어요.',
  'help.guide.school-holiday-catalog.result':
    '사용자는 Vacay의 “설정”에서 국가와 지역을 찾아, 연간 격자에서 방학 기간을 볼 수 있어요.',
  'help.guide.school-holiday-catalog.tip.1': '누군가 이미 Vacay 캘린더에서 고른 지역은 삭제할 수 없어요.',
  // auth-methods
  'help.guide.auth-methods.title': '로그인 방법 정하기',
  'help.guide.auth-methods.goal': '비밀번호 로그인, SSO, 가입을 켜거나 끄고 2FA를 필수로 지정해요.',
  'help.guide.auth-methods.step.1':
    '‘인증 방법’에서 ‘비밀번호 로그인’과 ‘비밀번호 회원가입’을 켜거나 끄세요. 스위치는 바로 적용돼요. 회원가입을 끄면 새 계정은 초대 링크, SSO, ‘사용자 만들기’로만 생겨요.',
  'help.guide.auth-methods.step.2':
    '“SSO 로그인”과 “SSO 자동 프로비저닝”을 쓰려면 아래 Single Sign-On (OIDC)을 설정해야 해요. 자동 프로비저닝은 누군가 SSO로 처음 로그인할 때 계정을 만들어 줘요.',
  'help.guide.auth-methods.step.3':
    '‘2단계 인증 (2FA) 요구’를 켜면 2FA가 없는 사용자는 모두 TREK를 쓰기 전에 ‘설정’에서 2FA를 설정해야 해요.',
  'help.guide.auth-methods.result': '로그인 페이지에 켜 둔 방법만 나와요.',
  'help.guide.auth-methods.tip.1':
    '마지막 남은 로그인 방법은 끌 수 없어요. 스위치가 회색이 되고, 툴팁에 ‘최소 한 가지 로그인 방법은 켜져 있어야 합니다’라고 나와요.',
  'help.guide.auth-methods.tip.2': '서버에 OIDC_ONLY가 설정돼 있으면 비밀번호 관련 스위치가 잠기고 안내가 나와요.',
  // oidc
  'help.guide.oidc.title': '싱글 사인온 연결하기',
  'help.guide.oidc.goal': '내 ID 제공자로 로그인할 수 있게 해요.',
  'help.guide.oidc.step.1':
    '싱글 사인온(OIDC)에서 버튼에 표시할 ‘표시 이름’, ‘발급자 URL’, 제공자에게 받은 ‘클라이언트 ID’와 ‘클라이언트 시크릿’을 입력하세요. ‘Discovery URL (선택 사항)’은 Authentik처럼 제공자가 일반적인 주소에 게시하지 않을 때만 채우세요. ‘저장’을 클릭하세요.',
  'help.guide.oidc.step.2': '“인증 방법”에서 “SSO 로그인”을 켜세요.',
  'help.guide.oidc.result':
    '로그인 페이지에 SSO 버튼이 나타나요. “SSO 자동 프로비저닝”이 켜져 있으면 처음 로그인하는 사용자에게 계정이 자동으로 만들어져요.',
  'help.guide.oidc.tip.1': '제공자에 입력할 리디렉션 URI는 내 TREK 주소 뒤에 문서에 나온 OIDC 콜백 경로를 붙인 거예요.',
  'help.guide.oidc.tip.2': '어떤 SSO 그룹이 관리자가 될지는 클레임 매핑으로 정해요. 문서의 OIDC 페이지를 참고하세요.',
  // instance-keys
  'help.guide.instance-keys.title': 'API 키 입력하기',
  'help.guide.instance-keys.goal': '인스턴스 전체에 Google 사진과 평점, Unsplash 커버, Amap 검색을 더해요.',
  'help.guide.instance-keys.step.1':
    '‘API 키’ 맨 위의 TREK Places API는 키 없이도 장소 검색을 처리해요. ‘무엇이 들어 있나’에 다루는 것과 다루지 않는 것이 나와요.',
  'help.guide.instance-keys.step.2':
    '사진, 평점, 영업시간을 쓰려면 ‘Google Maps API 키’를 붙여 넣고 ‘테스트’를 클릭하세요. ‘연결됨’이나 ‘유효하지 않음’이 나와요. ‘키의 사용 범위’를 열고 요금을 낼 기능만 켜세요: ‘장소 사진’, ‘장소 자동완성’, ‘장소 상세 정보’, ‘장소 정보 보강’, ‘Google로만 검색’, 그리고 ‘Google 호출 일일 한도’.',
  'help.guide.instance-keys.step.3':
    '커버 검색용 ‘Unsplash API 키’와 중국 본토 장소 검색용 ‘Amap(高德地图) API 키’를 붙여 넣고, 카드 아래쪽 ‘저장’을 클릭하세요.',
  'help.guide.instance-keys.result':
    '사용자는 자기 키 없이도 기능을 쓸 수 있어요. Google 키가 없으면 검색은 TREK Places API와 OpenStreetMap으로 동작해요.',
  'help.guide.instance-keys.tip.1':
    '사용자가 ‘설정’에 개인 키를 넣어 두면, 그 사용자에게는 인스턴스 키 대신 개인 키를 써요.',
  'help.guide.instance-keys.tip.2': '키는 환경 변수로도 설정할 수 있고, 그런 키는 여기서 읽기 전용으로 보여요.',
  'help.guide.instance-keys.tip.3':
    '“Google 호출 일일 한도”로 TREK이 이 키로 하루에 쓸 수 있는 양을 제한해요. 제목 옆 배지에 오늘 호출 수가 표시돼요. 한도에 도달하면 다음 날(UTC)까지 검색에 OpenStreetMap이 사용돼요.',
  // places-transit
  'help.guide.places-transit.title': '검색 및 대중교통 제공자 고르기',
  'help.guide.places-transit.goal': '장소 검색과 대중교통 경로 요청을 처리할 서비스를 골라요.',
  'help.guide.places-transit.step.1':
    '‘대중교통 제공자’에서 키가 필요 없고 유럽에서 가장 강한 ‘Transitous (무료)’나, Google 키를 쓰는 Google을 고르세요. 바로 저장돼요.',
  'help.guide.places-transit.step.2':
    '‘장소 검색 제공자’에서 TREK 인덱스와 OpenStreetMap에 결과가 없을 때 물어볼 서비스를 고르세요: ‘자동’(키가 있으면 Google, 그다음 Amap), Google Places, ‘Amap(高德地图)’, OpenStreetMap.',
  'help.guide.places-transit.result': 'TREK의 모든 검색창과 대중교통 경로에 이 설정이 쓰여요.',
  'help.guide.places-transit.tip.1':
    '키가 없는 선택지를 고르면 여기에 경고가 떠요. 그러면 장소 검색은 TREK 인덱스와 OpenStreetMap만, 대중교통은 Transitous만 써요.',
  'help.guide.places-transit.tip.2': 'Google 대중교통 경로는 요청마다 요금이 나가지만, Transitous는 무료예요.',
  // file-types
  'help.guide.file-types.title': '파일 형식 제한하기',
  'help.guide.file-types.goal': '업로드할 수 있는 파일 확장자를 정해요.',
  'help.guide.file-types.step.1':
    '‘허용된 파일 형식’에서 쉼표로 구분된 확장자 목록을 고치거나, 모든 형식을 허용하려면 *를 입력하고 ‘저장’을 클릭하세요.',
  'help.guide.file-types.result':
    '그 밖의 형식은 문서, 일기, 커버 어디서든 업로드가 거부되고 이유를 알려 주는 메시지가 표시돼요.',
  'help.guide.file-types.tip.1': '이미지 형식은 목록에서 빼지 마세요. 커버와 Journey 사진도 같은 목록으로 검사해요.',
  // toggle-addon
  'help.guide.toggle-addon.title': '애드온 켜고 끄기',
  'help.guide.toggle-addon.goal': '기능 모듈을 모든 사용자에게 제공하거나 없애요.',
  'help.guide.toggle-addon.step.1':
    '애드온 타일의 스위치를 클릭하세요. 모든 사람에게 메뉴 항목이 바로 생기거나 사라져요.',
  'help.guide.toggle-addon.step.2':
    '일부 타일에는 옵션용 하위 줄이 있어요. 예를 들어 ‘목록’ 아래 ‘가방 추적’이나 Journey 아래 사진 제공자예요. 애드온이 켜져 있을 때만 보여요.',
  'help.guide.toggle-addon.result': '애드온을 꺼도 데이터는 남아요. 다시 켜면 데이터가 다시 보여요.',
  'help.guide.toggle-addon.tip.1': 'MCP를 끄면 엔드포인트와 이에 연결된 “통합” 섹션이 사라져요.',
  'help.guide.toggle-addon.tip.2':
    '사용자들이 가장 많이 찾는 애드온은 Vacay, Atlas, Journey예요. “문서”는 업로드할 저장 공간이 필요해요.',
  // install-plugin
  'help.guide.install-plugin.title': '플러그인 설치하기',
  'help.guide.install-plugin.goal': '서드파티 플러그인을 추가하고, 요청한 권한만 정확히 줘요.',
  'help.guide.install-plugin.step.1':
    '‘둘러보기’를 열고 ‘플러그인 검색…’이나 ‘유형’ 필터로 플러그인을 찾아 ‘설치’를 클릭하세요. 패키지 파일이 있다면 ‘플러그인 업로드’(카드 오른쪽 위 구름 아이콘)를 클릭하거나 .zip을 페이지에 끌어다 놓으세요.',
  'help.guide.install-plugin.step.2':
    '‘설치됨’에서 줄을 확인하세요: 플러그인이 접근할 수 있는 것, 연결하는 호스트, ‘검토됨’과 ‘서명됨’ 여부. 그다음 ‘플러그인 활성화’를 켜면 줄에 ‘활성’이 보여요.',
  'help.guide.install-plugin.step.3':
    '줄의 ⋯ 메뉴에 ‘다시 시작’, ‘오류 로그 보기’, ‘허용된 호스트’, ‘버전 변경…’과 소스 링크가 있어요. ‘삭제’는 플러그인과 데이터를 제거해요. 새 버전이 나오면 줄에 업데이트로 보이고, 새 권한을 요청하는 버전은 승인하기 전까지 꺼져 있어요.',
  'help.guide.install-plugin.result':
    '플러그인이 별도 프로세스로 실행돼요. 플러그인이 추가하는 위젯, 지도 레이어, 도구는 플러그인이 정한 곳에 나타나요.',
  'help.guide.install-plugin.tip.1': '‘다시 스캔’은 패키지 없이 개발용으로 연결한 플러그인 폴더를 찾아요.',
  'help.guide.install-plugin.tip.2': '서명되지 않은 플러그인은 그렇게 표시돼요. 출처를 믿을 수 있을 때만 설치하세요.',
  // storage-backends
  'help.guide.storage-backends.title': '업로드를 S3로 옮기거나 미러링하기',
  'help.guide.storage-backends.goal': '파일을 오브젝트 스토리지에 두거나, 모든 업로드를 두 번째 백엔드에 복사해요.',
  'help.guide.storage-backends.step.1':
    '‘백엔드’에서 ‘백엔드 추가’를 클릭하고 ‘이름’을 정한 뒤 ‘유형’(‘현지’ 또는 S3)을 고르고 칸을 채우세요. 다른 곳에도 사본을 두려면 ‘미러 대상’을 체크하세요. ‘적용’을 클릭한 다음 새 줄의 ‘테스트’로 연결을 확인하세요.',
  'help.guide.storage-backends.step.2':
    '‘카테고리’에서 ‘여행 문서’, ‘Journey 사진’, ‘백업’ 같은 업로드 종류마다 백엔드를 지정하세요.',
  'help.guide.storage-backends.step.3':
    '맨 아래 ‘변경 사항 저장’을 클릭하세요. 카테고리가 다른 곳을 가리키게 되면 TREK가 ‘기존 객체 이동’을 할지 ‘새 쓰기만 전환’을 할지 물어봐요.',
  'help.guide.storage-backends.result':
    '새 업로드는 지정한 백엔드로 가요. 옮긴 파일은 거기서 제공되고, 옮기지 않기로 한 파일은 원래 자리에 있어요.',
  'help.guide.storage-backends.tip.1': '환경 변수로 설정한 백엔드는 표시만 되고 여기서 편집할 수 없어요.',
  'help.guide.storage-backends.tip.2':
    '미러 대상은 새로 쓰는 모든 파일의 사본을 받아요. 줄의 ‘지금 동기화’로 이전에 저장된 파일도 복사해요. 느린 대상은 그 백엔드의 모든 업로드를 느리게 해요.',
  // channels-instance
  'help.guide.channels-instance.title': '알림 채널 설정하기',
  'help.guide.channels-instance.goal': '사용자가 고를 수 있는 채널을 정하고 이메일을 설정해요.',
  'help.guide.channels-instance.step.1':
    '카드 헤더에서 ‘이메일 (SMTP)’을 켜고 SMTP 호스트, SMTP 포트, SMTP 사용자, SMTP 비밀번호, 보내는 주소를 입력한 뒤 ‘저장’을 클릭하세요. ‘테스트 이메일 전송’은 나에게 메일을 보내요. ‘TLS 인증서 검사 건너뛰기’는 자체 인증서를 쓰는 로컬 메일 서버에만 쓰세요.',
  'help.guide.channels-instance.step.2':
    '‘웹훅’, ‘Ntfy’, ‘웹 푸시’를 켜면 사용자에게 제공돼요. 사용자는 ‘설정’, ‘알림’에서 자기 URL이나 토픽을 입력하거나 기기마다 푸시를 켜요.',
  'help.guide.channels-instance.step.3':
    '‘여행 리마인더’로 여행 시작 전 리마인더를 켜고 꺼요. ‘앱 내’는 항상 켜져 있어요.',
  'help.guide.channels-instance.result': '모든 사용자의 “알림” 탭에 내가 켠 채널이 나와요.',
  'help.guide.channels-instance.tip.1':
    '‘관리자 Ntfy’ 카드의 ‘Ntfy 서버 URL’은 사용자의 기본 서버이기도 해요. 사용자는 여전히 자기 서버를 정할 수 있어요.',
  'help.guide.channels-instance.tip.2': '그 기능이 있는 플러그인이 활성화되면 플러그인 채널이 자동으로 나타나요.',
  // admin-channels
  'help.guide.admin-channels.title': '관리자 이벤트를 휴대폰으로 받기',
  'help.guide.admin-channels.goal': '새 릴리스, 스토리지 미러 오류, 패들 지역 요청을 알림으로 받아요.',
  'help.guide.admin-channels.step.1':
    '‘관리자 Ntfy’에 ‘관리자 토픽’과, 필요하면 ‘Ntfy 서버 URL’과 ‘액세스 토큰 (선택)’을 입력하고, ‘관리자 웹훅’에는 URL을 입력하세요. 카드마다 ‘저장’을 클릭하세요.',
  'help.guide.admin-channels.step.2': '‘테스트 ntfy 전송’이나 ‘테스트 웹훅 전송’을 클릭해 메시지가 오는지 확인하세요.',
  'help.guide.admin-channels.result':
    '관리자 이벤트는 앱 안의 모든 관리자에게 가고, 켜 둔 경우 관리자 ntfy 토픽과 웹훅으로도 가요.',
  'help.guide.admin-channels.tip.1':
    '관리자 토픽은 개인 토픽과 따로 두세요. 그래야 장애 알림이 여행 알림 사이에 묻히지 않아요.',
  'help.guide.admin-channels.tip.2': '관리자 웹훅과 토픽은 ‘설정’, ‘알림’에 있는 내 개인 채널과 별개예요.',
  // mcp-tokens-admin
  'help.guide.mcp-tokens-admin.title': 'AI 접근 취소하기',
  'help.guide.mcp-tokens-admin.goal': '모든 사용자의 AI 클라이언트가 가진 토큰과 세션을 보고 취소해요.',
  'help.guide.mcp-tokens-admin.step.1':
    '‘OAuth 세션’에서 이름과 소유자로 클라이언트를 찾으세요. 칩에 허용된 스코프가 보여요. 휴지통을 누르면 확인 후 세션이 취소돼요.',
  'help.guide.mcp-tokens-admin.step.2':
    '‘API 토큰’에서도 토큰에 대해 같은 정보가 나와요: 이름, 소유자, ‘생성일’, ‘마지막 사용’. 휴지통으로 토큰을 삭제하면 클라이언트가 바로 동작을 멈춰요.',
  'help.guide.mcp-tokens-admin.result': '클라이언트 사용자가 다시 연결해야 해요. 그 밖에는 아무것도 바뀌지 않아요.',
  'help.guide.mcp-tokens-admin.tip.1':
    '스코프를 보면 클라이언트가 무엇을 할 수 있었는지 알 수 있어요. 읽기 전용 스코프는 남겨 둬도 안전해요.',
  'help.guide.mcp-tokens-admin.tip.2':
    'MCP 애드온을 끄면 모든 클라이언트가 바로 멈추고 이 탭이 숨겨지지만, 삭제되는 건 없어요. 다시 켜면 토큰이 다시 동작해요.',
  // release-history
  'help.guide.release-history.title': '새 릴리스 확인하기',
  'help.guide.release-history.goal': '내 TREK가 최신인지, 다음 버전에 무엇이 들어오는지 알아봐요.',
  'help.guide.release-history.step.1':
    '새 릴리스가 나오면 페이지 헤더 아래에 현재 버전과 함께 ‘업데이트 가능’이 보여요. ‘GitHub에서 보기’로 릴리스를 열고, ‘업데이트 방법’에서 Docker 명령어나 다른 설치 방식용 업데이트 가이드를 볼 수 있어요.',
  'help.guide.release-history.step.2':
    '“릴리스 히스토리”에 모든 릴리스가 릴리스 노트와 함께 나와요. “상세 보기”로 노트를 펼치고, 최신 릴리스에는 “최신” 라벨이 붙으며, “더 불러오기”로 이전 릴리스를 볼 수 있어요.',
  'help.guide.release-history.result':
    '업데이트는 호스트에서 새 이미지를 받거나 새 태그를 빌드해서 해요. 데이터 디렉터리는 그대로 유지돼요.',
  'help.guide.release-history.tip.1': '업데이트 전에 백업하세요. “백업” 탭이 바로 옆에 있어요.',
  'help.guide.release-history.tip.2':
    '사전 릴리스는 표시되지만, 사전 릴리스를 쓰고 있는 게 아니라면 업데이트로 알리지 않아요.',
  // create-backup
  'help.guide.create-backup.title': '백업 만들고 복원하기',
  'help.guide.create-backup.goal': '인스턴스 전체를 백업하고, 다른 곳에 사본을 두고, 복원할 수 있게 해요.',
  'help.guide.create-backup.step.1':
    '‘데이터 백업’에서 오른쪽 위 ‘백업 만들기’를 클릭하세요. 데이터베이스와 업로드 파일을 서버에 파일 하나로 저장해요.',
  'help.guide.create-backup.step.2': '‘다운로드’로 서버 밖에 사본을 두고, 휴지통으로 확인 후 오래된 백업을 삭제해요.',
  'help.guide.create-backup.step.3':
    '백업의 ‘복원’이나 파일로 하는 ‘백업 업로드’는 ‘백업을 복원할까요?’에서 ‘예, 복원’을 클릭하면 현재 데이터를 모두 대체해요.',
  'help.guide.create-backup.result': '복원하면 사용자, 여행, 파일, 설정이 그 백업 시점 그대로 돌아와요.',
  'help.guide.create-backup.tip.1': '여기서 되돌릴 수 없는 작업은 복원뿐이에요. 먼저 새 백업을 만드세요.',
  'help.guide.create-backup.tip.2':
    '백업은 데이터 디렉터리에 저장돼요. 이 기기에 문제가 생겨도 안전하도록 다른 기기에 복사해 두세요.',
  // auto-backup
  'help.guide.auto-backup.title': '백업 예약하기',
  'help.guide.auto-backup.goal': '서버가 스스로 백업하고 오래된 백업을 정리하게 해요.',
  'help.guide.auto-backup.step.1':
    '‘자동 백업’에서 ‘자동 백업 활성화’를 켜고 ‘간격’(‘매시간’, ‘매일’, ‘매주’, ‘매월’), ‘실행 시간’을 고르세요. 매주나 매월이면 ‘요일’이나 ‘매월 몇 일’도 고르세요.',
  'help.guide.auto-backup.step.2':
    '‘이후 오래된 백업 삭제’에서 백업 보관 기간을 1일부터 ‘영구 보관’까지 고르고 ‘저장’을 클릭하세요.',
  'help.guide.auto-backup.result': '정해진 일정에 따라 백업이 목록에 생기고, 정한 기간보다 오래된 백업은 삭제돼요.',
  'help.guide.auto-backup.tip.1': '‘실행 시간’은 서버 시간 기준이에요. 아래 안내에 서버 시간대가 나와요.',
  'help.guide.auto-backup.tip.2':
    '서버 저장 공간은 한정돼 있어요. 보통 7일이나 14일이면 충분하고, 내려받은 사본은 다른 곳에 보관하세요.',
  // audit-log
  'help.guide.audit-log.title': '감사 로그 보기',
  'help.guide.audit-log.goal': '누가 언제 무엇을 했는지 확인해요.',
  'help.guide.audit-log.step.1':
    '최신순으로 줄을 읽어 보세요: ‘시간’, ‘사용자’, ‘작업’, ‘리소스’, IP, ‘상세 정보’. 작업 이름은 로그인 실패, MFA 변경, 복원처럼 일어난 일을 그대로 나타내요.',
  'help.guide.audit-log.step.2':
    '오른쪽 위 ‘새로 고침’으로 목록을 다시 불러와요. 제목 옆 배지는 전체 중 몇 개를 불러왔는지 보여 주고, ‘더 불러오기’로 이전 기록을 불러와요.',
  'help.guide.audit-log.result': '무엇이 왜 바뀌었는지 묻는 사람에게 보여 줄 기록이 생겼어요.',
  'help.guide.audit-log.tip.1': '시간은 서버 시간대로 보여요.',
  'help.guide.audit-log.tip.2': '로그는 추가만 가능해요. 앱에서 고치거나 삭제할 수 없어요.',
  // document-providers
  'help.guide.document-providers.title': '문서 저장소 제공하기',
  'help.guide.document-providers.goal': '여행이 문서를 동기화할 수 있는 저장소를 정해요.',
  'help.guide.document-providers.step.1':
    '‘문서’ 타일에 저장소가 줄마다 나와요: Paperless-ngx, Papra, Nextcloud, OpenCloud, Synology Drive. 다섯 개 모두 처음에는 꺼져 있고, ‘문서’가 켜져 있을 때만 줄이 보여요.',
  'help.guide.document-providers.step.2':
    'Nextcloud 줄의 스위치를 켜세요. ‘애드온이 업데이트되었습니다’ 메시지가 나오고, 이제 여행 소유자는 여행의 ‘파일’ 탭에서 ‘문서 동기화’를 찾을 수 있고, ‘저장소 연결’에 Nextcloud가 있어요.',
  'help.guide.document-providers.result':
    '이 TREK의 모든 여행에서 그 저장소를 쓸 수 있어요. 여행 소유자가 연결하기 전까지는 아무것도 연결되지 않아요.',
  'help.guide.document-providers.tip.1':
    '여기서는 저장소를 제공할지 여부만 정해요. 주소와 인증 정보는 여행에 속하므로 여행 소유자가 그 여행의 “파일” 탭에서 입력해요. 관리자 패널에서는 입력하지 않아요.',
  'help.guide.document-providers.tip.2':
    '“문서”를 끄면 모든 저장소도 함께 꺼지고, “문서”가 꺼져 있는 동안에는 저장소를 켤 수 없어요. 이때 서버는 “Enable the Documents addon first”라고 응답해요. 내부 네트워크에 있는 저장소를 쓰려면 서버에 ALLOW_INTERNAL_NETWORK=true도 설정해야 해요.',

  // ── Screen: trip ──────────────────────────────────────────────────────────────────────
  'help.ctx.trip.title': '여행',
  'help.ctx.trip.summary':
    '여행 하나의 모든 것이에요: 날, 지도, 장소가 있는 계획, 그리고 투어, 교통, 예약, 목록, 비용, 파일, 협업, 연결된 Journey 탭. 각각의 도움말은 이 화면 아래에 따로 있어요.',
  'help.ctx.trip.bullet.1':
    '상단 바 아래의 탭 바: ‘계획’, ‘투어’, ‘교통’, ‘예약’, ‘목록’, ‘비용’, ‘파일’, ‘협업’, 그리고 Journey를 연결하면 ‘Journey’. 내 TREK에 어떤 탭이 있는지는 애드온과 플러그인에 따라 달라요.',
  'help.ctx.trip.bullet.2':
    '‘계획’은 세 열로 되어 있어요: 왼쪽은 날, 가운데는 지도, 오른쪽은 장소. 로드트립 애드온을 쓰면 날 열 맨 위에 ‘일’과 ‘로드트립’ 전환 스위치가, 투어 애드온을 쓰면 장소 열 맨 위에 ‘장소’와 ‘투어’가 있어요. 예약과 교통은 계획의 일부로, 들를 곳에 붙거나 들를 곳 사이에 나오고, 각 탭에서 목록으로 볼 수 있어요.',
  'help.ctx.trip.bullet.3':
    '왼쪽 위 여행 이름 옆의 ‘여행 설정’ 버튼으로 여행 설정을 열어요: ‘사람’(멤버와 게스트), ‘공유’(읽기 전용 공개 링크와 초대 링크), Journey.',
  'help.ctx.trip.bullet.4':
    '제목, 날짜, 커버, 통화는 ‘내 여행’에서 여행 카드의 연필로 편집해요. 왼쪽 위의 여행 이름을 누르면 거기로 돌아가요.',
  'help.ctx.trip.bullet.5':
    '열 안쪽 가장자리의 탭으로 열을 접으면 지도가 그 공간을 써요. 접힌 열은 지도 위쪽 모서리에 작은 타일로 보이고, 클릭하면 다시 열려요. 열 옆의 얇은 구분선을 끌면 폭이 바뀌어요.',
  'help.ctx.trip.bullet.6': '날 목록 도구 모음의 실행 취소 화살표로 최근 계획 변경을 하나씩 되돌려요.',
  // add-member
  'help.guide.add-member.title': '멤버 추가하기',
  'help.guide.add-member.goal': 'TREK 계정이 있는 사람에게 이 여행에 접근할 권한을 줘요.',
  'help.guide.add-member.step.1': '왼쪽 위 여행 이름 옆의 ‘여행 설정’ 버튼을 클릭하세요. ‘사람’ 화면으로 열려요.',
  'help.guide.add-member.step.2': '‘사용자 초대’에서 ‘사용자 선택…’으로 사람을 고르고 ‘초대’를 클릭하세요.',
  'help.guide.add-member.step.3':
    '이제 그 사람이 ‘접근’ 아래에 보여요. ‘소유자’ 배지는 소유자를 나타내요. 줄 끝의 ‘접근 권한 제거’를 누르면 확인 후 그 사람이 빠져요.',
  'help.guide.add-member.result':
    '멤버는 관리자가 “권한 설정”에서 정한 범위 안에서 나처럼 여행을 보고 편집할 수 있어요.',
  'help.guide.add-member.tip.1':
    '목록에 없는 사람은 아직 TREK 계정이 없어요. 게스트로 추가하거나 초대 링크로 가입하게 하세요.',
  'help.guide.add-member.tip.2': '‘접근’ 옆 숫자는 여행 인원 수예요. 게스트는 아래에 따로 나와요.',
  // trip-invite-link
  'help.guide.trip-invite-link.title': '링크로 초대하기',
  'help.guide.trip-invite-link.goal': '사람들이 직접 여행에 참여하게 해요.',
  'help.guide.trip-invite-link.step.1':
    '여행 이름 옆의 ‘여행 설정’을 클릭하고 왼쪽에서 ‘공유’를 고르세요. ‘여행 초대 링크’에서 ‘초대 링크 만들기’를 클릭하세요.',
  'help.guide.trip-invite-link.step.2':
    '“복사”를 클릭하고 링크를 보내세요. TREK 계정이 있는 사람이 링크를 열면 멤버로 참여해요.',
  'help.guide.trip-invite-link.step.3':
    '“다시 생성”을 누르면 링크가 새로 바뀌고 이전 링크는 더 이상 쓸 수 없어요. “비활성화”를 누르면 링크가 꺼져요.',
  'help.guide.trip-invite-link.result': '링크를 연 사람은 누구나 여행에 참여하고 “접근”에 표시돼요.',
  'help.guide.trip-invite-link.tip.1':
    '계정이 없는 사람은 이 링크를 쓸 수 없어요. 관리자가 “관리자”의 “사용자”에서 가입 링크를 만들 수 있고, 이 여행에 연결할 수도 있어요.',
  'help.guide.trip-invite-link.tip.2':
    '링크를 엉뚱한 채팅방에 보냈다면 다시 생성하세요. 이전 링크는 바로 동작을 멈춰요.',
  // add-guest
  'help.guide.add-guest.title': '계정 없는 게스트 추가하기',
  'help.guide.add-guest.goal': 'TREK를 쓰지 않는 사람을 여행에 추가해요.',
  'help.guide.add-guest.step.1':
    '여행 이름 옆의 ‘여행 설정’을 클릭하세요. ‘사람’에서 ‘게스트’는 ‘접근’ 아래 마지막 부분에 있어요.',
  'help.guide.add-guest.step.2': '“게스트 이름”에 이름을 입력하고 “게스트 추가”를 클릭하세요.',
  'help.guide.add-guest.result': '게스트는 비용, 짐 항목, 할 일에 배정할 수 있지만 로그인은 할 수 없어요.',
  'help.guide.add-guest.tip.1':
    '‘이름 바꾸기’(연필)로 게스트 이름을 바꿔요. ‘접근 권한 제거’(휴지통)는 확인 후 게스트를 빼요. 게스트의 배정은 삭제되고, 각 지출에서 게스트의 몫은 나누기에 포함된 다른 사람들이 나눠 가져요.',
  'help.guide.add-guest.tip.2': '그 사람이 나중에 계정을 만들면 멤버로 초대하고 게스트는 삭제하세요.',
  // public-link
  'help.guide.public-link.title': '읽기 전용 링크 공개하기',
  'help.guide.public-link.goal': '편집하면 안 되는 사람에게 여행을 보여 줘요.',
  'help.guide.public-link.step.1': '여행 이름 옆 ‘여행 설정’을 클릭하고 왼쪽에서 ‘공유’를 고르세요.',
  'help.guide.public-link.step.2':
    '‘공개 링크’ 카드에서 링크로 보여 줄 항목을 켜세요. ‘지도 및 계획’은 항상 켜져 있고, ‘예약’, ‘짐 목록’, ‘비용’, ‘채팅’은 선택이에요.',
  'help.guide.public-link.step.3':
    '‘옵션’에서 ‘이동 및 숙박만’은 활동, 날 메모, 빈 날을 빼요. ‘사진 없이’는 장소 사진을 빼요.',
  'help.guide.public-link.result': '링크가 있는 사람은 로그인 없이 고른 부분을 볼 수 있고, 아무것도 바꿀 수 없어요.',
  'help.guide.public-link.tip.1':
    '링크는 어디에도 공개되지 않지만, 링크가 있으면 누구나 열 수 있어요. 비밀번호처럼 조심히 다루세요.',
  'help.guide.public-link.tip.2': '편집 권한을 주려면 대신 멤버로 추가하세요.',
  // transfer-ownership
  'help.guide.transfer-ownership.title': '여행 넘기기 또는 나가기',
  'help.guide.transfer-ownership.goal': '다른 사람을 소유자로 지정하거나, 내 여행이 아닌 여행에서 나가요.',
  'help.guide.transfer-ownership.step.1':
    '여행 이름 옆의 ‘여행 설정’을 클릭하세요. ‘접근’에서 멤버 줄의 ‘소유자로 지정’(왕관)을 클릭하고 확인하세요.',
  'help.guide.transfer-ownership.step.2':
    '내 줄의 ‘여행 떠나기’를 누르면 확인 후 여행에서 나가요. 소유자라면 먼저 소유권을 넘기세요.',
  'help.guide.transfer-ownership.result':
    '새 소유자가 멤버를 관리하고 여행을 삭제할 수 있어요. 나는 일반 멤버로 남아요.',
  'help.guide.transfer-ownership.tip.1':
    '소유권을 넘기기 전까지는 여행을 만든 사람이 소유자예요. 여행 삭제는 소유자만 할 수 있어요.',
  'help.guide.transfer-ownership.tip.2':
    '다른 멤버 줄의 ‘접근 권한 제거’는 반대로 소유자가 그 멤버를 여행에서 빼는 기능이에요.',
  // collapse-columns
  'help.guide.collapse-columns.title': '지도 넓게 보기',
  'help.guide.collapse-columns.goal': '열을 접거나 더 넓혀요.',
  'help.guide.collapse-columns.step.1':
    '일자 열 안쪽 가장자리에 있는 패널 아이콘 탭을 클릭하면 열이 접히고, 남는 공간을 지도가 써요. 장소 열에도 같은 탭이 있어요.',
  'help.guide.collapse-columns.step.2':
    '열을 접으면 지도 위쪽 모서리에 패널 아이콘이 있는 작은 타일이 생기고, 툴팁에 ‘계획’이나 ‘장소’가 나와요. 클릭하면 열이 다시 보여요.',
  'help.guide.collapse-columns.step.3': '열과 지도 사이의 얇은 구분선을 드래그하면 열 너비가 바뀌어요.',
  'help.guide.collapse-columns.result': '너비는 기억돼요. 다음에 들어오면 열은 다시 펼쳐져 있어요.',
  'help.guide.collapse-columns.tip.1': '두 열을 동시에 접으면 지도만 볼 수 있어요.',
  'help.guide.collapse-columns.tip.2':
    '창이 좁으면 열이 하나만 들어가서, 하나를 열면 다른 하나가 접혀요. 휴대폰에는 열이 없고, 맨 위의 ‘여행’, ‘계획’, ‘장소’로 화면을 전환해요.',
  // undo-change
  'help.guide.undo-change.title': '마지막 변경 되돌리기',
  'help.guide.undo-change.goal': '계획에서 마지막으로 바꾼 것을 되돌려요.',
  'help.guide.undo-change.step.1':
    '일자 위 도구 모음의 실행 취소 화살표를 클릭하세요. 툴팁에 되돌릴 변경 내용이 나와요.',
  'help.guide.undo-change.result': '계획이 이전 상태로 돌아가고, 짧은 메시지로 무엇을 되돌렸는지 알려 줘요.',
  'help.guide.undo-change.tip.1':
    '실행 취소는 계획에 적용돼요: 장소 추가, 배정, 삭제, 순서 변경, 이동, 고정, 날 비우기, 경로 최적화, 장소 삭제, 카테고리 변경, 가져오기.',
  'help.guide.undo-change.tip.2':
    '다시 클릭하면 더 이전으로 돌아가요. TREK는 여행을 나갈 때까지 이 여행의 최근 변경 30개를 최신순으로 기억해요.',
  'help.guide.clear-day.title': '하루 비우기',
  'help.guide.clear-day.goal': '하루의 모든 장소를 한 번에 빼요. 예를 들어 그날을 처음부터 다시 계획할 때요.',
  'help.guide.clear-day.step.1': '계획에서 그날 헤더를 오른쪽 클릭하세요.',
  'help.guide.clear-day.step.2': '‘날 비우기’를 고르고 확인하세요.',
  'help.guide.clear-day.result':
    '그날이 비워지고 장소는 미배정 상태로 목록에 돌아가요. 일자 위의 실행 취소 화살표로 되돌릴 수 있어요.',
  'help.guide.clear-day.tip.1': '장소만 빠져요. 그날의 메모와 예약은 그대로 남아요.',

  // ── Screen: trip-places ───────────────────────────────────────────────────────────────
  'help.ctx.trip-places.title': '장소',
  'help.ctx.trip-places.summary':
    '계획 화면의 오른쪽 열이에요: 계획 여부와 상관없이 여행의 모든 장소를 검색, 필터, 정렬과 함께 보여 주고, 장소를 추가하는 방법(검색, 직접 입력, 공유 목록)이 있어요. 맨 위 ‘장소’와 ‘투어’로 장소와 여행의 투어를 오가요.',
  'help.ctx.trip-places.bullet.1':
    '열 맨 위 ‘장소’와 ‘투어’로 목록을 바꿔요. 처음에는 ‘장소’가 열려 있어요. ‘투어’에는 여행의 투어가 나오고, ‘GPX 또는 KML 가져오기’로 GPX, KML, KMZ 파일을 가져와요. 투어는 장소 목록에 나오지 않아요.',
  'help.ctx.trip-places.bullet.2':
    '‘장소/활동 추가’는 검색하거나 직접 입력할 장소 양식을 열어요. 날이 열려 있으면 버튼이 ‘새 장소’로 바뀌고, 옆의 ‘해당 날짜로’는 그날에 바로 장소를 만들어요.',
  'help.ctx.trip-places.bullet.3':
    '그 옆의 아이콘 버튼 ‘장소 가져오기’에는 Google Maps나 Naver Maps에서 공유한 목록을 위한 ‘목록 가져오기’가 있어요. 관리자가 투어 애드온을 꺼 둔 경우에는 .gpx, .kml, .kmz 파일용 ‘파일 가져오기’도 있고, 파일을 열에 끌어다 놓을 수도 있어요.',
  'help.ctx.trip-places.bullet.4':
    '그 아래에는 설명과 메모까지 찾는 ‘검색’과, 옆에 ‘선택’ 체크박스가 있어요. 그 아래 줄은 필터예요: ‘표시’로 ‘전체’, ‘미계획’, ‘예정’을 오가며 각각 개수가 보여요. 태그 버튼은 카테고리로, 별은 최소 평점으로, 지구본(여행이 둘 이상의 국가나 지역에 걸칠 때)은 국가나 지역으로 거르고, ‘정렬’로 목록 순서를 정해요.',
  'help.ctx.trip-places.bullet.5':
    '줄에는 사진, 이름, 설명이나 주소가 보이고, 누군가 평점을 매겼다면 별과 평균 평점이 나와요. 클릭하면 장소 상세 정보가 열리고, 날로 끌어다 놓거나, 오른쪽 클릭(또는 점 세 개 ‘추가 옵션’)으로 ‘편집’, ‘+ 날에 추가’, ‘웹사이트 열기’, Google Maps, ‘컬렉션에 저장’, ‘삭제’를 쓸 수 있어요.',
  'help.ctx.trip-places.bullet.6':
    '날을 열어 두면 줄 끝의 둥근 +(‘+ 날에 추가’)로 장소를 그날에 넣어요. 아직 그날에 없는 모든 장소에 보여요. 이때 ‘예정’에는 그날 장소만 나오고, ‘열린 날짜만 표시 중’ 칩으로 알려 줘요. 칩의 x ‘전체 여행 보기’로 날을 닫아요.',
  // create-place
  'help.guide.create-place.title': '장소 만들기',
  'help.guide.create-place.goal': '계획에 필요한 정보를 모두 담아 장소나 활동을 직접 추가해요.',
  'help.guide.create-place.step.1':
    '장소 열 맨 위 ‘장소/활동 추가’(날이 열려 있으면 ‘새 장소’)를 클릭하세요. 검색창에 커서가 놓인 채 양식이 열려요.',
  'help.guide.create-place.step.2':
    '‘장소 검색…’에 장소를 입력하고 결과를 고르세요. 창 위쪽의 이름, ‘주소’, ‘위도’, ‘경도’, ‘웹사이트’가 채워지고, 왼쪽 ‘장소 세부정보’에 사진, 영업시간, 설명이 보여요. Google 키가 있는 TREK에서는 결과 아래 ‘원하는 장소가 아닌가요? Google로 검색’으로 같은 검색을 Google에서 해요. 컬렉션이 켜져 있으면 오른쪽 ‘저장된 장소’에 내 목록의 장소도 같은 방식으로 나와요.',
  'help.guide.create-place.step.3':
    '‘장소 세부정보’의 ‘사진 선택’ 아래에서 사진을 클릭하면 장소 이미지가 돼요. ‘이 텍스트 사용’을 누르면 설명이 양식에 복사돼요.',
  'help.guide.create-place.step.4':
    '양식 내용을 확인하세요. 필수 항목은 창 위쪽의 이름 하나뿐이에요. 그 아래 카테고리 버튼으로 여행 카테고리 중 하나를 고르고, 옆의 +로 새 카테고리를 만들어요. ‘주소’, ‘위도’, ‘경도’는 검색에서 채워지거나 직접 입력해요. ‘설명’과 ‘메모’는 내 메모용이에요. ‘웹사이트’에는 링크를 넣고, ‘파일’의 ‘첨부’로 문서를 추가하며, ‘전화’, ‘이메일’, ‘영업시간 추가’에는 검색에서 찾지 못한 정보를 넣어요.',
  'help.guide.create-place.step.5':
    '‘추가’를 클릭하세요. 이름이 같거나 같은 위치의 장소가 이미 여행에 있으면 경고가 뜨고, 버튼이 ‘그래도 추가’로 바뀌어요.',
  'help.guide.create-place.result': '장소가 목록과 지도에 들어가고, 날에 넣기 전까지 ‘미계획’에 있어요.',
  'help.guide.create-place.tip.1':
    '예산 애드온이 켜져 있으면 양식 아래쪽 ‘비용’을 눌러, 저장하자마자 그 장소의 지출을 비용 편집기에서 입력할 수 있어요. 창에 붙여 넣은 이미지나 PDF는 ‘파일’에 파일로 첨부돼요.',
  'help.guide.create-place.tip.2':
    '모든 TREK에서 검색 결과는 TREK 인덱스와 OpenStreetMap이 제공하고, ‘장소 세부정보’는 Wikipedia, Wikivoyage, Wikimedia에서 자동으로 채워져요. TREK는 둘 다 결과가 없을 때만 Google에 묻고, 평점은 Google만 제공해요.',
  'help.guide.create-place.tip.3':
    '지도에서 장소를 만들 수도 있어요. 원하는 지점을 오른쪽 클릭하면 좌표와 주소가 채워진 양식이 열려요.',
  // place-to-open-day
  'help.guide.place-to-open-day.title': '열린 일자에 장소 바로 추가하기',
  'help.guide.place-to-open-day.goal': '장소를 만들거나 골라서 한 번에 그날에 추가해요.',
  'help.guide.place-to-open-day.step.1':
    '날 열에서 날 헤더를 클릭하세요. 날이 열려요: 카드가 강조되고, 장소 열의 ‘새 장소’ 옆에 ‘해당 날짜로’ 버튼이 생겨요.',
  'help.guide.place-to-open-day.step.2':
    '‘해당 날짜로’는 ‘새 장소’와 같은 양식을 열지만, ‘추가’를 클릭하면 장소가 바로 열린 날에 들어가요.',
  'help.guide.place-to-open-day.step.3':
    '이미 있는 장소를 열린 날에 넣으려면 줄 끝의 둥근 +(‘+ 날에 추가’)를 클릭하거나, 오른쪽 클릭하고 ‘+ 날에 추가’를 고르세요. +는 아직 그날에 없는 모든 장소에 보여요.',
  'help.guide.place-to-open-day.step.4':
    '날을 먼저 열지 않고 반대로 할 수도 있어요: 장소 줄을 열에서 끌어 날 카드에 놓으세요. 두 들를 곳 사이에 놓으면 정확히 그 자리에 들어가요.',
  'help.guide.place-to-open-day.result': '장소가 그날 목록 맨 끝에 추가돼요. 위아래로 드래그해 원하는 위치로 옮기세요.',
  'help.guide.place-to-open-day.tip.1':
    '열린 날은 검색에도 영향을 줘요. 날이 열려 있으면 지도와 주변 검색이 그날 이미 있는 장소를 기준으로 시작해요.',
  'help.guide.place-to-open-day.tip.2': '날 목록 위 도구 모음의 ‘실행 취소’로 배정을 되돌려요.',
  // filter-places
  'help.guide.filter-places.title': '목록에서 장소 찾기',
  'help.guide.filter-places.goal': '찾는 장소만 열에 표시해요.',
  'help.guide.filter-places.step.1':
    '검색창 아래 드롭다운 ‘표시’로 ‘전체’, ‘미계획’(아직 어느 날에도 없음), ‘예정’(어떤 날에 있음)을 오가며, 각각 개수가 함께 보여요. 투어 애드온이 꺼져 있고 GPX 트랙을 가져왔다면 ‘트랙’도 나와요.',
  'help.guide.filter-places.step.2':
    '위쪽 ‘검색’에 입력하세요. 입력하는 대로 이름, 주소, 설명, 메모로 목록이 좁혀져요. 칸의 x를 누르면 지워져요.',
  'help.guide.filter-places.step.3':
    '‘표시’ 옆 태그 버튼에 카테고리가 나와요. ‘카테고리 없음’을 포함해 하나 이상 체크하세요. 버튼에 체크한 개수가 보이고, 목록 아래 ‘필터 지우기’로 모두 해제해요.',
  'help.guide.filter-places.step.4':
    '옆의 별로 최소 평점을 정해요: 5+, 4+ 등을 고르면 평균 평점이 그 이상인 장소만 남아요. 평점이 없는 장소는 숨겨져요.',
  'help.guide.filter-places.result': '‘표시’의 숫자에 조건에 맞는 장소 수가 보이고, 필터는 함께 적용돼요.',
  'help.guide.filter-places.tip.1':
    '일자가 열려 있으면 “예정”에 그날만 표시되고, “열린 날짜만 표시 중”이라는 안내와 함께 옆에 “전체 여행 보기”가 나와요.',
  'help.guide.filter-places.tip.2':
    '지도에도 ‘표시’, 카테고리, 평점이 적용되고, 날이 열려 있으면 지도의 ‘예정’은 그날 장소만 보여 줘요. 검색과 지구본은 목록에만 적용돼요.',
  // edit-place
  'help.guide.edit-place.title': '장소 수정하기',
  'help.guide.edit-place.goal': '이름을 고치거나, 핀을 옮기거나, 웹사이트를 넣거나, 카테고리를 바꿔요.',
  'help.guide.edit-place.step.1':
    '줄을 오른쪽 클릭하고 ‘편집’을 고르거나, 줄 끝의 ‘추가 옵션’을 클릭하거나, 장소를 열고 상세 정보에서 ‘편집’을 클릭하세요.',
  'help.guide.edit-place.step.2':
    '‘장소 편집’에서 필요한 부분을 바꾸세요: 창 위쪽의 이름과 카테고리 버튼, ‘주소’, ‘위도’와 ‘경도’, ‘설명’, ‘메모’, ‘웹사이트’, ‘전화’, ‘이메일’, 영업시간. 장소가 딱 하루에만 있거나 하루에서 열었다면 ‘이 날의 메모’와 함께 ‘시작’, ‘종료’도 있어요.',
  'help.guide.edit-place.step.3': '‘업데이트’를 클릭하세요.',
  'help.guide.edit-place.result': '목록, 지도, 장소가 들어간 모든 날까지, 장소가 나오는 모든 곳에 바로 반영돼요.',
  'help.guide.edit-place.tip.1': '‘이 날의 메모’는 그날의 장소에만, ‘메모’는 장소 자체에 속해요.',
  'help.guide.edit-place.tip.2':
    '“종료”가 “시작”보다 앞서면 “업데이트”를 할 수 없어요. “시간 겹침:”은 그날 다른 일정이 같은 시간에 있다고 알려 주는 경고일 뿐이에요.',
  // delete-place
  'help.guide.delete-place.title': '장소 삭제하기',
  'help.guide.delete-place.goal': '여행에서 장소를 영구히 삭제해요.',
  'help.guide.delete-place.step.1':
    '줄을 오른쪽 클릭하고 ‘삭제’를 고르거나(줄 끝 ‘추가 옵션’에도 있어요), 장소 상세 정보에서 ‘삭제’를 클릭하세요.',
  'help.guide.delete-place.step.2':
    '확인 질문에서 “삭제”를 클릭하세요. 그 장소에 숙박이 예약되어 있거나 예약이 연결되어 있으면 함께 삭제되는 항목을 알려 줘요.',
  'help.guide.delete-place.result':
    '장소가 목록, 지도, 모든 날에서 사라져요. 날 목록 위 도구 모음의 ‘실행 취소’로 되돌려요.',
  'help.guide.delete-place.tip.1': '하루에서만 빼려면 대신 그 들를 곳에서 ‘날에서 제거’를 쓰세요.',
  'help.guide.delete-place.tip.2': '여러 장소를 한 번에 삭제하려면 검색 옆의 체크를 클릭해 선택을 시작하세요.',
  // select-places
  'help.guide.select-places.title': '여러 장소를 한 번에 바꾸거나 삭제하기',
  'help.guide.select-places.goal': '장소를 하나씩 말고 한 번에 여러 개 바꿔요.',
  'help.guide.select-places.step.1':
    '검색창 옆의 체크 아이콘을 클릭하세요. 행마다 둥근 체크박스가 생기고, 열 아래쪽에 작업 바가 나타나요.',
  'help.guide.select-places.step.2':
    '행을 클릭해 체크하세요. 바의 이중 체크 아이콘 “모두 선택”은 필터에 보이는 모든 행을 선택해요.',
  'help.guide.select-places.step.3':
    '바에 체크한 장소 수가 보여요. ‘카테고리 변경’은 모두에게 같은 카테고리를 지정하고, ‘컬렉션에 저장’(컬렉션이 켜져 있을 때)은 내 컬렉션 하나로 복사하며, ‘선택 항목 삭제’는 확인 후 삭제해요.',
  'help.guide.select-places.step.4': '바 끝의 X ‘완료’를 클릭해 선택을 끝내세요.',
  'help.guide.select-places.result': '선택한 모든 장소에 적용돼요. 삭제는 날 목록 위 도구 모음에서 되돌릴 수 있어요.',
  'help.guide.select-places.tip.1':
    '선택하는 동안에도 필터가 동작해요: 먼저 ‘미계획’으로 거른 뒤 ‘모두 선택’하면 그 장소만 선택돼요.',
  'help.guide.select-places.tip.2':
    '컬렉션 애드온이 켜져 있으면 바에 “내 목록에서 방문함으로 표시”가 나타나요. 장소가 저장된 컬렉션에서 그 장소를 방문함으로 표시해 줘요.',
  // import-places-file
  'help.guide.import-places-file.title': 'GPX, KML, KMZ 파일에서 장소 가져오기',
  'help.guide.import-places-file.goal':
    '투어 애드온이 꺼져 있을 때, Google My Maps, Google Earth, GPS 트래커에서 내보낸 핀과 경로를 장소로 가져와요.',
  'help.guide.import-places-file.step.1':
    '추가 버튼 옆 아이콘 버튼 ‘장소 가져오기’를 클릭하고 ‘파일 가져오기’를 고르거나, 장소 열 아무 곳에나 파일을 끌어다 놓으세요. 둘 다 관리자가 투어 애드온을 꺼 둔 경우에만 있어요.',
  'help.guide.import-places-file.step.2':
    '파일을 고르거나 상자에 끌어다 놓으세요. GPX라면 가져올 것을 체크하세요: ‘웨이포인트’, ‘경로’, ‘트랙 (경로 형상 포함)’. KML과 KMZ라면 ‘포인트 (Placemarks)’와 ‘경로 (LineStrings)’를 체크하세요.',
  'help.guide.import-places-file.step.3':
    '상자에는 여러 파일을 한 번에 넣을 수 있지만 .gpx, .kml, .kmz만 돼요. 다른 형식이나 10MB가 넘는 파일은 창에서 거부되고 가져오지 않아요.',
  'help.guide.import-places-file.step.4':
    '‘가져오기’를 클릭하세요. 몇 개의 장소를 가져왔는지 메시지로 알려 줘요. KML이나 KMZ 파일이면 창이 열린 채로 무엇을 만들고 무엇을 건너뛰었는지 요약이 보여요.',
  'help.guide.import-places-file.result':
    '장소가 목록에 들어와요. 트랙은 줄에 색 선이 붙고, 지도에 그려지며, ‘트랙’ 필터가 따로 생겨요.',
  'help.guide.import-places-file.tip.1':
    '파일이 너무 크면 거부되고 TREK이 크기 제한을 알려 줘요. 사진 없이 다시 내보내거나 파일을 나누세요.',
  'help.guide.import-places-file.tip.2': '일자 위 도구 모음에서 가져오기 전체를 되돌릴 수 있어요.',
  // import-places-list
  'help.guide.import-places-list.title': '공유된 Google Maps 또는 Naver Maps 목록 가져오기',
  'help.guide.import-places-list.goal': '공유된 목록 링크에서 장소를 가져와요.',
  'help.guide.import-places-list.step.1':
    '추가 버튼 옆의 아이콘 버튼 ‘장소 가져오기’를 클릭하고 ‘목록 가져오기’를 고르세요.',
  'help.guide.import-places-list.step.2':
    '‘제공자’에서 ‘Google 목록’이나 ‘네이버 목록’을 고르고, 목록의 공유 링크를 ‘링크’에 붙여 넣으세요. Google Maps 길찾기 링크도 돼요. 경유지가 운전 순서대로 장소가 돼요.',
  'help.guide.import-places-list.step.3': '“가져오기”를 클릭하세요.',
  'help.guide.import-places-list.result':
    '목록의 모든 장소가 목록에 있던 이름 그대로 여행에 들어와요. 이미 여행에 있는 장소는 건너뛰어요.',
  'help.guide.import-places-list.tip.1':
    '목록이 공개로 공유돼 있어야 해요. 비공개 목록 링크로는 아무것도 가져오지 않아요.',
  'help.guide.import-places-list.tip.2':
    'TREK에 Google 키가 있으면 창에 ‘Google로 장소 정보 보강’이 나와요. 가져온 장소를 하나씩 찾아 사진, 주소, 상세 정보를 채워요.',
  'help.guide.sort-places.title': '장소 목록 정렬하기',
  'help.guide.sort-places.goal': '목록을 이름순, 평점순, 최근 추가나 수정 순으로 정렬해요.',
  'help.guide.sort-places.step.1':
    '필터 줄 끝의 화살표 버튼 ‘정렬’을 클릭하세요. 체크 표시가 현재 순서이고, 버튼 툴팁에 순서 이름이 나와요.',
  'help.guide.sort-places.step.2': '‘평점 높은 순’ 같은 순서를 고르거나 이름순으로 정렬하세요. 목록이 바로 바뀌어요.',
  'help.guide.sort-places.result': '다른 순서를 고를 때까지 목록이 고른 순서대로 보여요.',
  'help.guide.sort-places.tip.1':
    '‘최근 추가순’이 아닌 정렬을 고르면 버튼이 강조돼서, 목록이 다르게 정렬돼 있다는 걸 바로 알 수 있어요.',
  'help.guide.sort-places.tip.2': '정렬은 목록만 바꿔요. 날의 순서는 그대로이고, 브라우저가 고른 순서를 기억해요.',
  'help.guide.place-by-hand.title': '검색되지 않는 장소 추가하기',
  'help.guide.place-by-hand.goal': '장소 검색으로 찾을 수 없을 때 전화번호, 이메일, 영업시간과 함께 직접 입력해요.',
  'help.guide.place-by-hand.step.1':
    '장소 대화 상자의 검색에 이름을 입력하고 Enter를 누르세요. 검색 결과가 없으면 대화 상자에서 알려 주고 “직접 추가”를 보여 줘요.',
  'help.guide.place-by-hand.step.2':
    '“직접 추가”를 클릭하세요. 검색한 글자가 이름이 되고, 대화 상자가 연락처 입력란으로 스크롤돼요.',
  'help.guide.place-by-hand.step.3': '알고 있다면 ‘전화’와 ‘이메일’을 채우세요.',
  'help.guide.place-by-hand.step.4':
    '‘영업시간 추가’를 클릭하고 요일마다 여는 시간과 닫는 시간을 정하세요. 복사 버튼은 첫 요일 시간을 모든 요일에 넣고, 요일 스위치로 그날을 ‘종료됨’으로 표시해요.',
  'help.guide.place-by-hand.step.5': '‘추가’를 클릭하세요.',
  'help.guide.place-by-hand.result':
    '장소가 목록에 추가돼요. 상세 정보에는 검색으로 찾은 장소와 똑같이 입력한 전화번호, 이메일, 영업시간이 표시돼요.',
  'help.guide.place-by-hand.tip.1':
    '영업시간이 없는 장소를 편집하면 왼쪽 “장소 세부정보”의 영업시간을 자동으로 가져와요. 이미 영업시간이 있으면 옆의 버튼으로 조회한 시간을 가져올 수 있어요.',
  'help.guide.place-by-hand.tip.2':
    '직접 입력한 영업시간이 조회한 시간 대신 쓰여요. 그래서 계절마다 영업시간이 다른 카페도 내가 아는 시간으로 표시돼요.',

  // ── Screen: trip-days ─────────────────────────────────────────────────────────────────
  'help.ctx.trip-days.title': '일',
  'help.ctx.trip-days.summary':
    '계획의 왼쪽 열이에요: 날마다 카드가 하나씩 있고, 들를 곳이 순서대로, 메모, 그날의 예약과 교통, 들를 곳 사이 경로가 들어 있어요. 여행을 실제로 계획하는 곳이에요.',
  'help.ctx.trip-days.bullet.1':
    '맨 위 헤더: 왼쪽에 ‘내보내기’(PDF, 캘린더, GPX)가 있고, 오른쪽에 실행 취소 화살표, ‘모든 날 펼치기’ / ‘모든 날 접기’, ‘날짜 순서 변경’, 그리고 예약에 그릴 경로가 생기면 ‘모든 예약 경로 표시’가 있어요.',
  'help.ctx.trip-days.bullet.2':
    '날 카드: 날 번호와 날씨 예보가 있는 타일, 제목(이름을 붙이기 전에는 ‘Day 1’)과 날짜가 있고, 그 아래에 숙박 버튼(체크인은 초록색, 체크아웃은 빨간색, 확정 전에는 점선이며 티켓 아이콘으로 예약을 열어요)과 렌터카 버튼이 있어요. 헤더를 클릭하면 날이 열리고, 화살표로 접으며, +(‘날에 추가’)로 메뉴를 열어요: ‘이 날짜에 장소 추가’, ‘숙박 추가’, ‘교통 추가’, ‘대중교통’, ‘메모 추가’. 헤더를 오른쪽 클릭해도 같은 메뉴가 나오고, ‘날 비우기’도 있어요.',
  'help.ctx.trip-days.bullet.3':
    '날 안에는 들를 곳이 순서대로 있고, 각각 사진, 카테고리 아이콘, 이름, 시간, 설명, 연결된 예약, 함께 가는 사람이 보여요. 메모, 그리고 그날의 예약과 교통이 유형별 색으로 나와요. 들를 곳에 마우스를 올리면 끌기 손잡이, 사진 위 자물쇠, 화살표, ‘예약 추가’, 점 세 개(‘추가 옵션’)가 보여요. 들를 곳과 메모는 오른쪽 클릭으로도 메뉴를 열 수 있어요.',
  'help.ctx.trip-days.bullet.4':
    '열린 날에 들를 곳이 두 개 이상이면 그 아래에 경로 바가 생겨요: ‘경로’로 그날을 지도에 그리고 들를 곳 사이 구간마다 이동 시간을 보여 주며, 아이콘 세 개로 그날의 ‘자동차’, ‘도보’, ‘자전거’를 정하고, 이어서 ‘최적화’, ‘Google Maps에서 열기’, ‘CoMaps에서 열기’가 있어요.',
  'help.ctx.trip-days.bullet.5':
    '장소를 날에 넣는 방법은 여러 가지예요: 장소 열에서 줄을 끌어다 놓기, 그 줄의 ‘+ 날에 추가’, 날의 +나 빈 날의 ‘이 날짜에 장소 추가’, 또는 장소 상세 정보.',
  'help.ctx.trip-days.bullet.6':
    '아래쪽 ‘총 비용’은 ‘비용’ 중 그날 들를 곳과 예약에 속한 지출을 하나씩만 세어 표시 통화로 더해요.',
  // read-day-plan
  'help.guide.read-day-plan.title': '하루 일정 보기',
  'help.guide.read-day-plan.goal': '무언가를 바꾸기 전에 일자 카드의 각 부분이 무엇을 뜻하는지 알아봐요.',
  'help.guide.read-day-plan.step.1':
    '헤더: 날 번호와 날씨 예보가 있는 타일, 그다음 ‘Day 1’ 또는 붙인 제목과 날짜. 그 아래에 숙박 버튼(체크인은 초록색, 체크아웃은 빨간색, 확정 전에는 점선이고 티켓 아이콘으로 예약을 열어요)과 렌터카 버튼이 있어요. 헤더를 클릭하면 날이 열려요(지도 위에 상세 패널이 열려요). 오른쪽 +(‘날에 추가’)로 장소, 숙박, 교통, 대중교통 연결, 메모를 추가하고, 화살표로 카드를 접어요.',
  'help.guide.read-day-plan.step.2':
    '들를 곳에는 사진, 카테고리 아이콘, 이름이 보이고, ‘시작’이 있으면 시간, 그리고 설명이 이어져요. ‘이 날의 메모’는 그 아래에 보여요. 줄에 마우스를 올리면 컨트롤이 나타나요: 왼쪽 손잡이로 끌어 옮기고, 사진은 경로 최적화용 자물쇠로 바뀌며, 오른쪽 끝에는 화살표(‘위로 이동’, ‘아래로 이동’), ‘예약 추가’, 점 세 개(‘추가 옵션’)가 있어요.',
  'help.guide.read-day-plan.step.3':
    '들를 곳에 걸린 예약은 그 위에 ‘예약’ 배지로 보여요. 확정이면 초록색, 대기 중이면 주황색이고 시간과 운송사가 함께 나와요. 배지를 클릭하면 예약이 열리고, 옆의 경로 버튼은 그 경로를 그려요. 교통은 유형별 색의 별도 줄에 시간과 ‘출발’ 또는 ‘도착’이 표시돼요. 예약을 클릭하면 상세 정보가 열리고, 거기서 ‘편집’으로 바꿀 수 있어요.',
  'help.guide.read-day-plan.step.4':
    '‘경로’를 켜면 두 들를 곳 사이 연결선에 그날 이동 수단 기준 소요 시간과 거리가 나와요. 클릭하면 그 구간만 이동 수단을 바꿀 수 있어요.',
  'help.guide.read-day-plan.step.5':
    '열린 날의 들를 곳 아래 경로 바: ‘경로’로 그날 동선을 지도에 그리고, 아이콘 세 개로 ‘자동차’, ‘도보’, ‘자전거’를 고르고, ‘최적화’로 들를 곳 순서를 바꾸며, ‘Google Maps에서 열기’와 ‘CoMaps에서 열기’로 그날을 그 앱에서 열어요.',
  'help.guide.read-day-plan.result':
    '카드의 모든 기호에는 의미가 있어요. 각각을 바꾸는 방법은 아래 가이드에서 설명해요.',
  'help.guide.read-day-plan.tip.1':
    '들를 곳을 오른쪽 클릭하거나 점 세 개를 클릭하면 메뉴가 나와요: ‘편집’, ‘날에서 제거’, ‘경로에서 제외’, ‘웹사이트 열기’, ‘컬렉션에 저장’, ‘삭제’. 내비게이션 앱은 장소 상세 정보의 ‘내비게이션’에 있어요.',
  'help.guide.read-day-plan.tip.2':
    '일정에 마우스를 올리면 행 끝에 “예약 추가”가 나타나요. 여기서 만든 예약은 이날의 이 일정에 연결돼요.',
  // place-onto-day
  'help.guide.place-onto-day.title': '장소를 일자에 넣기',
  'help.guide.place-onto-day.goal': '목록의 장소를 날의 들를 곳으로 만들고, 순서 안의 알맞은 자리에 넣어요.',
  'help.guide.place-onto-day.step.1':
    '장소 열의 줄을 날 카드로 끌어다 놓으세요. 두 들를 곳 사이에 놓으면 정확히 그 자리에, 날 헤더에 놓으면 맨 끝에 추가돼요.',
  'help.guide.place-onto-day.step.2':
    '끌지 않고 넣으려면: 날 헤더를 클릭해 날을 열고 장소 줄 끝의 둥근 +(‘+ 날에 추가’)를 클릭하거나, 줄을 오른쪽 클릭하고 ‘+ 날에 추가’를 고르세요.',
  'help.guide.place-onto-day.step.3':
    '날의 + 메뉴나 빈 날에 있는 ‘이 날짜에 장소 추가’를 누르면 장소 양식이 열리고, 새 장소가 바로 그날에 들어가요.',
  'help.guide.place-onto-day.step.4':
    '날이 열려 있으면 장소 상세 정보의 ‘날에 추가’로 그날에 넣고, 장소 열 헤더의 ‘해당 날짜로’로 열린 날에 바로 새 장소를 만들어요.',
  'help.guide.place-onto-day.result':
    '장소가 그날 들를 곳이 돼요. 지도에 그날 순번과 함께 보이고, 장소 열에서는 ‘예정’으로 집계돼요.',
  'help.guide.place-onto-day.tip.1':
    '한 장소를 여러 날에 넣을 수 있어요. 두 번째 날에는 장소 열에서 다시 넣으세요. 일정을 한 일자 카드에서 다른 카드로 드래그하면 복사가 아니라 이동돼요.',
  'help.guide.place-onto-day.tip.2': '헤더의 실행 취소 화살표로 배정을 되돌릴 수 있어요.',
  'help.guide.place-onto-day.tip.3':
    '시간이 고정된 두 항목 사이나 이미 시간이 정해진 예약 앞에는 일정을 놓을 수 없어요. 계획은 항상 시간순으로 유지돼요.',
  // reorder-stops
  'help.guide.reorder-stops.title': '하루 일정 순서 바꾸기',
  'help.guide.reorder-stops.goal': '일정을 위나 아래로, 또는 다른 일자로 옮겨요.',
  'help.guide.reorder-stops.step.1': '들를 곳에 마우스를 올리고 손잡이를 잡아 카드 안의 새 위치로 끌어다 놓으세요.',
  'help.guide.reorder-stops.step.2':
    '또는 마우스를 올린 들를 곳 오른쪽 끝의 화살표(‘위로 이동’, ‘아래로 이동’)를 쓰세요. 한 번 클릭할 때마다 한 칸씩 움직여요.',
  'help.guide.reorder-stops.step.3': '들를 곳을 다른 날 카드로 끌어다 놓으면 그날로 옮겨지고, 원래 날에서는 빠져요.',
  'help.guide.reorder-stops.step.4':
    '시간이 정해진 들를 곳을 옮겨서 그날 순서가 맞지 않게 되면 TREK가 ‘시간을 제거할까요?’라고 물어요. 시간이 들를 곳 위치를 정하기 때문이에요. ‘확인’을 누르면 시간이 지워져 어디로든 옮길 수 있고, ‘취소’를 누르면 그대로예요.',
  'help.guide.reorder-stops.result': '경로와 이동 시간이 새 순서에 맞춰 바로 바뀌어요.',
  'help.guide.reorder-stops.tip.1':
    '시간이 정해진 예약은 그 시간 자리에 그대로 있어요. 그날 다른 곳에 놓으면 다시 돌아가고, 다른 날 카드로 끌어다 놓으면 그날로 옮겨져요.',
  'help.guide.reorder-stops.tip.2':
    '들를 곳이 세 곳 이상이면 경로 바의 ‘최적화’로 하루 전체를 가장 짧은 동선으로 정렬해요. 자리를 지켜야 할 곳은 먼저 고정하세요.',
  // set-stop-times
  'help.guide.set-stop-times.title': '들를 곳에 시간 정하기',
  'help.guide.set-stop-times.goal': '일정의 시작과 종료 시간을 정해 하루를 시간표처럼 짜요.',
  'help.guide.set-stop-times.step.1':
    '일정을 오른쪽 클릭하거나 점 세 개를 클릭하고 “편집”을 선택하세요. 일자에서 양식을 열면 위치 바로 아래에 그날의 “시작”과 “종료”가 있어요.',
  'help.guide.set-stop-times.step.2':
    '“시작”을 입력하고, 원하면 “종료”도 입력하세요. “시간 겹침:”은 그날 시간이 정해진 다른 일정과 겹친다는 경고예요. “종료”가 “시작”보다 앞서면 “업데이트”를 할 수 없어요.',
  'help.guide.set-stop-times.step.3': '“업데이트”를 클릭하세요. 일정에 시간 배지가 붙고, 시간에 맞는 위치로 옮겨져요.',
  'help.guide.set-stop-times.result':
    '시간이 정해진 들를 곳은 순서 안의 자리를 지키고, 시간이 없는 곳은 그 사이에 정렬돼요.',
  'help.guide.set-stop-times.tip.1':
    '시간은 그날의 들를 곳에 속해요. 같은 장소라도 다른 날에는 다른 시간을 정할 수 있어요.',
  'help.guide.set-stop-times.tip.2':
    '시간이 정해진 들를 곳을 직접 옮기려면 끌어서 놓으세요. TREK가 ‘시간을 제거할까요?’라고 묻고, ‘확인’을 클릭하면 시간이 지워져요.',
  'help.guide.set-stop-times.tip.3':
    '같은 양식의 “이 날의 메모”에는 테이블 예약이나 티켓 번호처럼 그날에만 해당하는 정보를 적으세요.',
  // remove-from-day
  'help.guide.remove-from-day.title': '일자에서 일정 빼기',
  'help.guide.remove-from-day.goal': '여행에서 삭제하지 않고 장소를 그날에서만 빼요.',
  'help.guide.remove-from-day.step.1': '들를 곳을 오른쪽 클릭하거나 점 세 개를 클릭하고 ‘날에서 제거’를 고르세요.',
  'help.guide.remove-from-day.step.2':
    '일정이 그날에서 빠져요. 장소는 장소 열에 남고, 다른 날에도 없으면 “미계획” 아래에 표시돼요.',
  'help.guide.remove-from-day.result': '그날 일정, 경로, 비용이 업데이트돼요. 실행 취소 화살표로 들를 곳을 되돌려요.',
  'help.guide.remove-from-day.tip.1': '같은 메뉴의 ‘삭제’는 모든 날을 포함해 여행 전체에서 장소를 삭제해요.',
  'help.guide.remove-from-day.tip.2': '‘날에서 제거’는 장소 상세 패널의 ‘날에 추가’ 옆에도 있어요.',
  // lock-stop
  'help.guide.lock-stop.title': '일정 위치 고정하기',
  'help.guide.lock-stop.goal': '경로를 최적화해도 일정이 자리를 지키게 해요.',
  'help.guide.lock-stop.step.1': '일정 사진에 마우스를 올리고 자물쇠 “경로 최적화 중 위치 유지”를 클릭하세요.',
  'help.guide.lock-stop.step.2':
    '이제 “최적화”를 하면 다른 일정이 이 일정을 중심으로 정렬돼요. 자물쇠를 다시 클릭하면(“클릭하여 잠금 해제”) 잠금이 풀려요.',
  'help.guide.lock-stop.result': '사진 위에 자물쇠가 보이고, 잠금을 풀 때까지 들를 곳이 자리를 지켜요.',
  'help.guide.lock-stop.tip.1': '시간이 정해진 들를 곳은 시간으로 고정돼서, 최적화할 때도 움직이지 않아요.',
  'help.guide.lock-stop.tip.2':
    '잠금은 페이지를 새로 고칠 때까지만 유지돼요. 새로 고치면 모든 들를 곳의 잠금이 풀리고, 시간이 정해진 곳만 고정돼요.',
  // day-note
  'help.guide.day-note.title': '일자에 메모 추가하기',
  'help.guide.day-note.goal': '알림, 티켓 번호, 대안 계획을 그날에 저장해요.',
  'help.guide.day-note.step.1': '날 헤더의 +(‘날에 추가’)를 클릭하고 ‘메모 추가’를 고르세요.',
  'help.guide.day-note.step.2':
    '대화 상자 맨 위 “메모”라고 적힌 곳에 메모 이름을 입력하세요. 일자 카드에는 이 이름이 표시돼요. 나머지 내용은 “일별 메모”에 쓰세요. 위의 도구 모음으로 서식(굵게, 목록, 링크, 인용)을 넣고, 왼쪽 “미리보기”에서 행이 어떻게 보일지 확인할 수 있어요.',
  'help.guide.day-note.step.3': '“아이콘”과 “색상”을 골라 일정과 쉽게 구분되게 한 다음 “추가”를 클릭하세요.',
  'help.guide.day-note.step.4':
    '메모는 들를 곳처럼 그날 일정 안에 들어가요. 끌어서 자리를 잡거나 화살표를 쓰세요. 클릭하면 편집할 수 있어요. ‘삭제’는 편집 창과 점 세 개 메뉴, 오른쪽 클릭 메뉴에 있고, 먼저 ‘메모를 삭제할까요?’라고 물어봐요.',
  'help.guide.day-note.result': '메모가 끌어다 놓은 자리에 그날 일정과 PDF의 일부로 들어가요.',
  'help.guide.day-note.tip.1': '메모의 링크는 새 탭에서 열리고, 줄을 한 번 바꾸면 줄바꿈이 그대로 유지돼요.',
  'help.guide.day-note.tip.2': '메모는 날마다 따로예요. 여행 전체에 관한 메모는 협업에 남기세요.',
  // day-route
  'help.guide.day-route.title': '하루 경로 보고 최적화하기',
  'help.guide.day-route.goal': '들를 곳 사이 경로를 보고, 이동 수단을 고르고, TREK가 순서를 정하게 해요.',
  'help.guide.day-route.step.1':
    '날을 열고 들를 곳 아래 경로 바에서 ‘경로’를 클릭하세요. 들를 곳 사이 경로가 지도에 그려지고, 연결선에 구간마다 시간과 거리가 보여요.',
  'help.guide.day-route.step.2':
    '옆의 아이콘 세 개로 그날 이동 수단을 정해요: ‘자동차’, ‘도보’, ‘자전거’. 구간이 다시 계산돼요. 플러그인이 이동 수단을 더 추가할 수도 있어요.',
  'help.guide.day-route.step.3':
    '연결선을 클릭하면 그 구간만 이동 수단을 바꿀 수 있어요: 수단을 고르거나, 지원하는 곳에서 대중교통 연결을 찾는 ‘대중교통’, 또는 그날 기본 수단으로 돌아가는 ‘하루 기본값 사용’을 고르세요.',
  'help.guide.day-route.step.4':
    '‘최적화’(둥근 화살표)는 들를 곳이 세 곳 이상일 때 가장 짧은 동선으로 순서를 바꿔요. 자물쇠가 있거나 시간이 정해진 곳은 자리를 지키고, 그날 숙박이 있으면 경로가 숙소에서 시작해요.',
  'help.guide.day-route.step.5':
    '‘Google Maps에서 열기’나 ‘CoMaps에서 열기’로 하루 전체를 그 앱에서 경로로 열어 이동 중 길 안내에 써요. CoMaps는 그날 이동 수단도 반영해요.',
  'help.guide.day-route.result': '하루가 시간이 정해진 경로가 돼요. 순서를 바꾸면 “총 비용”과 구간이 업데이트돼요.',
  'help.guide.day-route.tip.1':
    '경로는 기본적으로 OSRM에서 받아와요. 관리자는 “기본값”에서 다른 경로 엔진을 쓰도록 설정할 수 있어요.',
  'help.guide.day-route.tip.2':
    '경로를 계산하지 못한 구간에는 시간이 표시되지 않아요. 두 일정 모두 좌표가 있는지 확인하세요.',
  'help.guide.day-route.tip.3': '실행 취소 화살표로 최적화를 되돌릴 수 있어요.',
  // manage-days
  'help.guide.manage-days.title': '날 추가, 순서 변경, 이름 바꾸기',
  'help.guide.manage-days.goal': '날에 든 장소뿐 아니라 날 자체를 바꿔요.',
  'help.guide.manage-days.step.1':
    '날은 여행 날짜로 만들어져요. 대시보드의 여행 편집 양식에서 날짜를 바꾸면 앞이나 뒤에서 날이 추가되거나 빠져요. 내용이 있는 날이 빠지기 전에는 어떤 날이 빠지고 무엇이 들어 있는지 목록으로 보여 줘요.',
  'help.guide.manage-days.step.2':
    '헤더의 ‘날짜 순서 변경’을 누르면 목록이 열려요. 손잡이로 날을 끌거나 ‘위로 이동’, ‘아래로 이동’을 쓰면 장소, 메모, 예약과 함께 옮겨져요. 목록 아래 ‘다음 날짜로 추가’는 날짜가 있는 마지막 날 뒤에 하루를 더하고 여행을 하루 늘려요. ‘날짜 없이’는 날짜 없는 날을 끝에 붙여요. 날짜가 없는 여행에는 ‘날짜 추가’만 있어요.',
  'help.guide.manage-days.step.3':
    '줄 끝의 휴지통 ‘날짜 삭제’는 먼저 물어봐요. 그날과 함께 삭제될 장소, 메모, 예약, 그날 체크인이나 체크아웃하는 숙박, 하루씩 앞당겨지는 날을 보여 줘요. ‘날짜 삭제’로 삭제하고 ‘취소’로 유지해요. 마지막 남은 날은 삭제할 수 없어요.',
  'help.guide.manage-days.step.4':
    '날 이름을 바꾸려면 날을 열고, 지도 위 상세 패널에서 제목 옆 연필을 클릭하세요. 카드와 PDF에서 ‘Day 1’ 대신 그 이름이 보여요.',
  'help.guide.manage-days.step.5':
    '헤더의 ‘모든 날 펼치기’와 ‘모든 날 접기’로 모든 카드를 한 번에 펼치거나 접어요. 카드 하나만 접으려면 화살표를 클릭하세요.',
  'help.guide.manage-days.result':
    '날짜는 순서 자리에 고정돼요. 하루를 위로 옮기면 더 이른 날짜가 되고, 그날의 일정, 메모, 예약도 함께 옮겨져요.',
  'help.guide.manage-days.tip.1': '날을 옮긴 건 실행 취소 화살표로 되돌릴 수 있지만, 날 삭제는 되돌릴 수 없어요.',
  'help.guide.manage-days.tip.2':
    '계획 맨 아래 ‘총 비용’은 여행 전체를 더한 금액이고, 자세한 내역은 ‘비용’ 탭에 있어요.',
  // bookings-in-plan
  'help.guide.bookings-in-plan.title': '계획에서 예약과 교통 살펴보기',
  'help.guide.bookings-in-plan.goal': '예약이 생기면 어디에 나타나는지, 어느 화면에서 만드는지 알아봐요.',
  'help.guide.bookings-in-plan.step.1':
    '교통(항공편, 기차, 페리, 버스, 차량)은 유형별 색의 줄이에요. 떠나는 날에는 시간과 ‘출발’, 도착하는 날에는 ‘도착’이 보여요. 옆의 지구본은 시간대를 알려 주고, 경유 항공편은 구간마다 한 줄씩 생겨요. 대중교통 연결은 화살표를 클릭하면 노선이 보여요. 줄을 클릭하면 예약이 열리고, 거기서 ‘편집’으로 바꿔요.',
  'help.guide.bookings-in-plan.step.2':
    '일정에 연결된 예약(식당, 투어)은 그 일정에 시간과 함께 “예약” 배지로 표시돼요. 확정되면 초록색, 대기 중이면 주황색이에요. 날짜는 있지만 일정에 연결되지 않은 예약은 그날에 별도 행으로 나와요.',
  'help.guide.bookings-in-plan.step.3':
    '호텔에서 묵는 밤은 숙박이에요. 날 헤더의 숙박 버튼은 체크인 날에는 초록색, 체크아웃 날에는 빨간색이고, 티켓 아이콘을 누르면 예약이 열려요. 그날의 상세 패널에는 ‘숙박’ 아래에 나오고, 해당 날들의 경로는 모두 거기서 시작해요.',
  'help.guide.bookings-in-plan.step.4':
    '지도에서는 예약 줄의 경로 버튼으로 그 경로를 그리고, 헤더의 ‘모든 예약 경로 표시’로 전부 그려요.',
  'help.guide.bookings-in-plan.step.5':
    '만들기: 마우스를 올린 들를 곳의 ‘예약 추가’, 날 + 메뉴의 ‘교통 추가’와 ‘대중교통’, 그리고 가져오기와 파일까지 있는 전체 목록은 ‘예약’과 ‘교통’ 탭에서.',
  'help.guide.bookings-in-plan.result': '예약이 계획에 한 번씩 보여요. 탭에는 같은 예약이 목록으로 나와요.',
  'help.guide.bookings-in-plan.tip.1':
    '‘확정됨’과 ‘대기 중’은 예약에 설정하는 상태예요. 계획에서는 들를 곳에 표시되고, ‘예약’ 탭에서는 둘 다 집계해요.',
  'help.guide.bookings-in-plan.tip.2':
    '시간이 있는 예약을 그날 다른 곳에 놓으면 그 시간 자리로 돌아가요. 다른 날 카드로 끌어다 놓으면 그날로 옮겨져요. 시간을 바꾸려면 예약을 편집하세요.',
  // export-plan
  'help.guide.export-plan.title': '계획 내보내기',
  'help.guide.export-plan.goal': '계획을 문서, 캘린더, GPS 기기로 내보내요.',
  'help.guide.export-plan.step.1': '날 목록 위 헤더 바 왼쪽의 ‘내보내기’를 클릭하세요.',
  'help.guide.export-plan.step.2':
    '‘문서’: PDF는 경로 개요 지도로 시작해 모든 날의 들를 곳, 메모, 예약이 담긴 인쇄 화면을 열고, ‘내 계획을 PDF로’는 내가 참여하는 것만 남겨요. 화면에서 ‘날짜별 페이지 나누기’는 날마다 새 페이지에서 시작하고, ‘교통편 메모’는 교통 메모를 더하며, ‘PDF로 저장’으로 내려받아요.',
  'help.guide.export-plan.step.3':
    '“캘린더”: “.ics 다운로드”는 예약을 캘린더 파일로 저장해요. “캘린더 구독”은 캘린더 앱이 자동으로 새로 고치는 링크를 만들어 줘요.',
  'help.guide.export-plan.step.4':
    '‘지도 및 GPS’(GPX): ‘여행 전체’는 장소, 날 경로, 트랙을, ‘장소만’은 핀만, ‘날짜를 경로로’는 오프라인 지도와 GPS 기기용으로 하루에 경로 하나씩 내보내요.',
  'help.guide.export-plan.result': '파일이 다운로드돼요. 여행 내용은 바뀌지 않아요.',
  'help.guide.export-plan.tip.1':
    '하루 일정만 지도 앱에서 열려면 그날의 경로 바에서 “Google Maps에서 열기”나 “CoMaps에서 열기”를 쓰세요.',
  'help.guide.export-plan.tip.2':
    '‘캘린더 구독’을 쓰려면 설정에서 캘린더 피드를 켜고 여행을 공유할 권한이 있어야 해요. 방법은 대시보드 가이드에 있어요.',
  'help.guide.export-plan.tip.3':
    '내보내기에는 읽기 권한만 있으면 돼요. 여행 멤버라면 누구나 PDF, .ics, GPX를 내보낼 수 있어요.',

  // ── Screen: trip-place ────────────────────────────────────────────────────────────────
  'help.ctx.trip-place.title': '장소 세부정보',
  'help.ctx.trip-place.summary':
    '장소를 고르면 지도 위에 열리는 카드예요: 여행에 있는 그 장소의 모든 정보, 모두가 매긴 별점, 사진과 파일, 그리고 열린 날에 추가하기, 지도 앱에서 열기, 목록에 저장하기 버튼이 있어요.',
  'help.ctx.trip-place.bullet.1':
    '장소 열의 줄, 날 안의 들를 곳, 지도의 마커를 클릭하면 지도 위에 카드가 열려요. 날에서 열면 어떤 들를 곳인지 알기 때문에 참가자와 예약도 함께 보여요. 투어(‘투어’ 탭의 하이킹, 라이딩, 산책)는 이 카드 대신 투어 카드가 열려요.',
  'help.ctx.trip-place.bullet.2':
    '헤더에 둥근 사진, 이름, 한 줄 주소, 그리고 알려진 정보 레이블이 보여요: 영업 중 또는 영업 종료, 카테고리, 시간, 가격, 전화번호, 이메일, 좌표. 사진을 클릭하면 내 사진이나 장소 파일의 사진을 쓸 수 있어요. 이름을 더블클릭하면 이름을 바꿔요. 오른쪽 X로 카드를 닫아요. 사진 바꾸기, 이름 바꾸기, ‘편집’, ‘삭제’는 장소를 수정할 수 있는 여행자만 쓸 수 있어요.',
  'help.ctx.trip-place.bullet.3': '그 아래: 여행자들이 준 별점, 설명과 메모, 그리고 일정에 있으면 “이 날의 메모”.',
  'help.ctx.trip-place.bullet.4':
    '해당하면 ‘영업 시간’, ‘트랙 색상’, ‘트랙 통계’, ‘파일’이 이어져요. ‘파일’ 제목의 ‘업로드’로 컴퓨터에서 파일을 추가하고, 목록에는 이 들를 곳에 고정한 파일과 예약 파일(호텔 확인서 포함)도 나와요. 플러그인이 그 아래에 줄을 추가할 수도 있어요.',
  'help.ctx.trip-place.bullet.5':
    '맨 아래 줄: 날이 열려 있으면 ‘날에 추가’ 또는 ‘날에서 제거’, 그다음 ‘내비게이션’(설정에서 지도 앱을 골랐다면 그 앱 이름), ‘웹사이트 열기’, ‘컬렉션에 저장’. 오른쪽의 빨간 휴지통은 장소를 삭제하고, ‘편집’은 양식을 열어요.',
  'help.ctx.trip-place.bullet.6':
    '검색에서 고른 장소에는 TREK 인덱스나 OpenStreetMap에 있는 정보가 보여요. 위쪽 버튼에 영업 중 또는 영업 종료가 표시되고 사진 둘레에 초록색이나 빨간색 테두리가 생기는데, 장소의 현지 시간을 기준으로 해요. 전화번호도 버튼으로 나오고, 아래쪽 ‘영업 시간’에는 오늘 시간이 보이며 클릭하면 한 주 전체가 보여요. 웹사이트는 ‘웹사이트 열기’에 있어요. Google 평점은 Google 키가 있는 TREK에서 Google로 찾은 장소에만 보여요. 장소 양식에 직접 입력한 영업시간, 전화번호, 이메일은 조회된 정보 대신 쓰이고, 테두리 색도 그에 따라 정해져요.',
  // read-place
  'help.guide.read-place.title': '장소 카드에 나오는 정보',
  'help.guide.read-place.goal': '여행에 있는 장소 정보를 카드 하나에서 모두 확인해요.',
  'help.guide.read-place.step.1':
    '날 열에서 보고 싶은 들를 곳을 클릭하세요. 지도 위에 카드가 열리고, 그 들를 곳은 날 안에서 계속 표시돼요.',
  'help.guide.read-place.step.2':
    '맨 위: 둥근 사진, 이름, 주소가 한 줄에 있고, 툴팁에 전체 주소가 나와요. 그 아래 버튼에는 장소의 현지 시간을 기준으로 지금 영업 중인지 영업 종료인지 나오고, 사진 둘레도 그에 맞춰 초록색이나 빨간색 테두리가 생겨요. 카테고리, 시간, 전화번호, 이메일(클릭하면 전화나 메일 앱이 열려요), 넓은 화면에서는 정확한 좌표도 보여요. 오른쪽 X로 카드를 닫아요.',
  'help.guide.read-place.step.3':
    '헤더 바로 아래 첫 섹션이 “평점”이에요. 여행자들이 준 별점과 평균, 투표한 사람 수가 나와요. 아무도 투표하지 않았다면 “아직 평점 없음”이 표시돼요.',
  'help.guide.read-place.step.4':
    '그다음은 설명, 그 아래는 메모예요. 둘 다 장소 양식에 입력한 글이 서식대로 표시돼서 목록, 링크, 굵은 글씨가 모두 적용돼요.',
  'help.guide.read-place.step.5': '“참가자”에는 이 일정에 가는 사람이 나와요. 누군가를 빼기 전까지는 모두 포함돼요.',
  'help.guide.read-place.step.6':
    '더 아래의 “영업 시간”: 행에는 보고 있는 날의 영업시간이 나와요. 클릭하면 그날이 굵게 표시된 일주일 전체가 보여요. 옆에는 “파일”이 있어요.',
  'help.guide.read-place.result':
    '카드는 X로 닫거나 다른 장소를 고를 때까지 열려 있어요. 한 주 영업시간은 펼쳐진 채로 있고, 해당 들를 곳은 날 열에서 계속 표시돼요.',
  'help.guide.read-place.tip.1':
    '장소 열에서 고르면 카드에 장소는 보이지만 들를 곳 정보는 없어요. 그래서 참가자는 보이지 않고, 호텔 숙박처럼 장소 자체에 속한 예약만 나와요. 모두 보려면 날 안의 들를 곳을 고르세요.',
  'help.guide.read-place.tip.2':
    '장소를 수정할 수 있다면 이름을 더블클릭해서 양식을 열지 않고 이름을 바꿀 수 있어요. Enter로 저장하고, Esc로 취소해요.',
  'help.guide.read-place.tip.3':
    '직접 입력한 장소에는 양식에 넣은 정보만 있어요. ‘편집’을 클릭해 ‘전화’, ‘이메일’, 영업시간을 직접 채우거나, ‘장소 검색…’ 제안에서 장소를 고르고 ‘업데이트’를 클릭해 정보를 찾아오세요. Google 평점은 Google 키가 있어야 보여요.',
  // rate-place
  'help.guide.rate-place.title': '장소에 평점 매기기',
  'help.guide.rate-place.goal': '장소에 내 별점을 매기고, 다른 사람들이 매긴 평점도 봐요.',
  'help.guide.rate-place.step.1':
    '장소를 여세요. 헤더 바로 아래에 별점 줄이 있고, 지금까지의 평균과 투표 수가 괄호 안에 표시돼요.',
  'help.guide.rate-place.step.2':
    '원하는 별을 클릭하세요. 포인터를 올리면 별이 채워져서 몇 점을 줄지 미리 볼 수 있어요.',
  'help.guide.rate-place.step.3':
    '내 투표가 바로 평균에 반영되고, 옆의 프로필 사진으로 누가 투표했는지 보여요. 행에 마우스를 올리면 모두의 별점을 볼 수 있어요.',
  'help.guide.rate-place.step.4': '같은 평균이 장소 열의 행에도 표시되어, 목록에서 좋은 장소를 쉽게 찾을 수 있어요.',
  'help.guide.rate-place.result':
    '여행의 모든 사람이 장소에 매긴 내 별점을 볼 수 있어요. 이제 목록 위 필터 줄의 별로 최소 평점 이상인 장소만 볼 수 있어요.',
  'help.guide.rate-place.tip.1':
    '일부 사람만 장소를 수정할 수 있는 여행이라도, 여행자라면 누구나 평점을 매길 수 있어요.',
  'help.guide.rate-place.tip.2':
    '이미 매긴 별을 다시 클릭하면 평점이 취소돼요. 아무도 평점을 매기지 않으면 다시 ‘아직 평점 없음’이 보여요.',
  'help.guide.rate-place.tip.3':
    '별 옆에는 투표한 사람이 최대 여섯 명까지 프로필 사진으로 나와요. 툴팁에는 전원이 표시되고, 나는 따로 표시돼요.',
  // place-image
  'help.guide.place-image.title': '장소에 내 사진 넣기',
  'help.guide.place-image.goal': '자동 썸네일을 내 사진으로 바꿔요.',
  'help.guide.place-image.step.1': '장소 열에서 장소를 여세요.',
  'help.guide.place-image.step.2':
    '헤더의 둥근 사진에 포인터를 올리면 카메라가 나타나고 툴팁에 ‘이미지 업로드’가 보여요. 클릭하고 파일을 고르세요. 장소 파일에 이미 사진이 있으면 먼저 ‘기기에서 업로드’할지, ‘첨부 파일에서’ 사진을 고를지 물어봐요.',
  'help.guide.place-image.step.3': '이제 카드 위쪽에 내 사진이 보이고, 모서리에 작은 빨간 X가 있어요.',
  'help.guide.place-image.step.4': '같은 사진이 장소 열의 줄과 지도의 마커에도 보여요.',
  'help.guide.place-image.result':
    '내 사진이 카드, 장소 열, 날의 들를 곳, 지도 마커, 공유한 여행까지 어디서나 장소 사진으로 쓰여요.',
  'help.guide.place-image.tip.1': 'JPG, PNG, GIF, WebP를 올릴 수 있고, iPhone의 HEIC는 업로드할 때 변환돼요.',
  'help.guide.place-image.tip.2':
    '모서리의 X를 누르면 내 사진이 지워지고 자동 사진이 다시 표시돼요. 장소 자체는 바뀌지 않아요.',
  'help.guide.place-image.tip.3':
    '직접 사진을 넣지 않았다면 TREK가 장소 좌표로 사진을 찾고, 없으면 카테고리 아이콘을 보여 줘요. 사진은 장소를 수정할 수 있는 여행자만 정할 수 있어요.',
  // place-day-assign
  'help.guide.place-day-assign.title': '열린 일자에 장소 추가하거나 빼기',
  'help.guide.place-day-assign.goal': '행을 플래너 너머로 드래그하지 말고 카드의 버튼을 써요.',
  'help.guide.place-day-assign.step.1':
    '날 열에서 날 헤더를 클릭하세요. 그날이 열린 날이 되고, 카드가 그날 기준으로 동작해요.',
  'help.guide.place-day-assign.step.2':
    '장소 열에서 그날에 없는 장소를 클릭하세요. 카드가 열리고 맨 아래 줄에 ‘날에 추가’가 있어요.',
  'help.guide.place-day-assign.step.3':
    '‘날에 추가’를 클릭하세요. 들를 곳이 그날 맨 끝에 추가되고, 버튼이 ‘날에서 제거’로 바뀌어요.',
  'help.guide.place-day-assign.step.4':
    '이제 일정이 그날 목록의 맨 끝에 들어갔어요. 위로 드래그해 원하는 위치로 옮기세요.',
  'help.guide.place-day-assign.step.5':
    '“날에서 제거”를 누르면 일정이 그날에서 다시 빠지고, 카드에 다시 “날에 추가”가 표시돼요.',
  'help.guide.place-day-assign.result': '일정이 그날에 추가되거나 빠져요. 장소 자체는 바뀌지 않아요.',
  'help.guide.place-day-assign.tip.1':
    '이 버튼은 일자가 열려 있을 때만 나와요. 열린 일자가 없으면 장소를 넣을 날이 없으니까요.',
  'help.guide.place-day-assign.tip.2':
    '들를 곳을 날에서 빼도 장소는 여행과 장소 열에 남아요. 모든 곳에서 없애려면 ‘삭제’를 쓰세요.',
  'help.guide.place-day-assign.tip.3':
    '숙소 예약으로 날에 들어간 들를 곳에는 두 버튼이 모두 없어요. 그날 밤은 그날의 숙박 블록에서 추가하고 빼요.',
  // place-participants
  'help.guide.place-participants.title': '이 들를 곳에 갈 사람 정하기',
  'help.guide.place-participants.goal': '여행 멤버는 그대로 두고 한 일정에 갈 사람만 정해요.',
  'help.guide.place-participants.step.1':
    '일자 안에서 일정을 클릭하세요. 카드가 열리고 “참가자”에 여행 멤버 전원이 나와요.',
  'help.guide.place-participants.step.2':
    '여행자 칩을 클릭하면 그 사람이 이 일정에서 빠져요. 칩에 마우스를 올리면 이름에 취소선이 그어져요.',
  'help.guide.place-participants.step.3':
    '빠진 사람이 생기면 점선 +가 나타나요. 클릭하면 이 일정에 가지 않는 사람이 보여요.',
  'help.guide.place-participants.step.4':
    '이름을 클릭하면 그 사람이 다시 추가돼요. 모두 다시 추가되면 들를 곳이 다시 일행 전체에 속해요.',
  'help.guide.place-participants.result': '들를 곳에 고른 여행자만 보이고, 나머지 일행은 그 시간에 자유예요.',
  'help.guide.place-participants.tip.1':
    '‘참가자’는 들를 곳이 선택돼 있을 때만 보여요. 장소 열이 아니라 날 안에서 장소를 고르세요. 여행자가 두 명 이상인 여행에서만 보여요.',
  'help.guide.place-participants.tip.2':
    '아무도 선택하지 않으면 모두 가는 것으로 봐요. 그래서 일정에서 마지막 한 명은 뺄 수 없어요.',
  'help.guide.place-participants.tip.3': '자기 계정이 없는 게스트도 다른 사람처럼 참가자가 될 수 있어요.',
  // place-booking
  'help.guide.place-booking.title': '일정에 연결된 예약',
  'help.guide.place-booking.goal': '일정에 연결된 예약을 보고 열거나, 새 예약을 연결해요.',
  'help.guide.place-booking.step.1':
    '예약이 속한 들를 곳을 여세요. 카드의 ‘예약’ 아래에 예약 이름과 ‘확정됨’ 또는 ‘대기 중’이 담긴 작은 카드로 나와요.',
  'help.guide.place-booking.step.2':
    '예약 카드에 ‘날짜’, ‘시간’, ‘예약 코드’가 보이고, 예약의 다른 정보(항공편 번호, 승강장, 체크인) 레이블과 예약 메모도 나와요.',
  'help.guide.place-booking.step.3': '예약 카드를 클릭하세요. 지도 위에 예약이 열려요.',
  'help.guide.place-booking.step.4':
    '예약 아래쪽 ‘편집’을 누르면 예약 양식이 열려요. 양식의 ‘날 배정에 연결’로 예약을 들를 곳에 연결하는데, 이미 이 들를 곳이 선택돼 있어요. 양식을 다시 닫으세요.',
  'help.guide.place-booking.step.5':
    '일정의 새 예약은 일자 열에서 만들어요. 일정에 마우스를 올리고 끝에 있는 티켓 아이콘 “예약 추가”를 클릭하세요. “새 예약” 양식이 그 일정에 연결된 채로 열려요.',
  'help.guide.place-booking.result':
    '예약이 일정에 연결돼요. 카드와 일자에 표시되고, 예약 파일도 여기 “파일”에 함께 나와요.',
  'help.guide.place-booking.tip.1':
    '예약은 고정한 들를 곳에 보이고, 호텔 예약은 어디서 열든 그 호텔에도 보여요. 들를 곳이 없는 예약은 ‘예약’ 탭에 있어요.',
  'help.guide.place-booking.tip.2': '한 일정에 여러 예약을 연결할 수 있어요. 같은 곳에서 시작하는 점심과 투어처럼요.',
  'help.guide.place-booking.tip.3': '기차, 항공편, 페리는 ‘편집’을 누르면 ‘교통’ 탭에서 쓰는 교통 양식이 열려요.',
  // place-files
  'help.guide.place-files.title': '장소의 티켓을 장소에 보관하기',
  'help.guide.place-files.goal': '티켓, 바우처, 지도를 해당 장소에 첨부해요.',
  'help.guide.place-files.step.1':
    '장소를 여세요. ‘파일’은 상세 정보 아래에 있고, 장소에 영업 시간이 있으면 그 옆에 있어요. 파일이 아직 없으면 ‘파일’이라고만 보여요.',
  'help.guide.place-files.step.2': '‘파일’ 제목 오른쪽의 ‘업로드’를 클릭하고 파일을 고르세요.',
  'help.guide.place-files.step.3': '버튼에 장소의 파일 수가 보이고, 목록이 자동으로 펼쳐져요.',
  'help.guide.place-files.step.4': '줄마다 파일 이름과 크기가 보여요. 클릭하면 파일이 열려요.',
  'help.guide.place-files.result': '파일이 장소에 첨부되고 카드에 개수가 표시돼요. 여행의 “파일” 탭에도 나타나요.',
  'help.guide.place-files.tip.1':
    '‘파일’에는 이 들를 곳에 고정한 파일과 그 예약에 첨부한 파일도 나와요. 그래서 호텔 확인서가 호텔에 보여요.',
  'help.guide.place-files.tip.2':
    '‘업로드’로 여러 파일을 한 번에 올릴 수 있고, 그중 사진은 장소 사진으로 쓸 수 있어요.',
  'help.guide.place-files.tip.3':
    '파일 업로드 권한이 없으면 “업로드” 버튼이 나오지 않아요. 장소에 이미 있는 파일은 그대로 보여요.',
  // place-navigation
  'help.guide.place-navigation.title': '지도 앱이나 웹사이트에서 장소 열기',
  'help.guide.place-navigation.goal': '평소 쓰는 길 안내 앱에서 장소를 열어요.',
  'help.guide.place-navigation.step.1': '장소를 열고 맨 아래 줄의 ‘내비게이션’을 클릭하세요.',
  'help.guide.place-navigation.step.2':
    '목록에는 이 장소에 맞는 지도 앱이 나와요: Google Maps, Waze, Apple Maps, OpenStreetMap, CoMaps, 그리고 Android에서는 ‘다른 지도 앱’.',
  'help.guide.place-navigation.step.3':
    '쓰는 앱을 클릭하세요. TREK는 가능하면 좌표만이 아니라 장소 자체를 앱에 넘겨서, 올바른 입구로 안내받을 수 있어요.',
  'help.guide.place-navigation.step.4':
    '옆의 ‘웨이포인트 열기’가 아니라 ‘웨이브사이트 열기’는 장소 웹사이트를 새 탭에서 열어 영업시간과 티켓을 볼 수 있어요.',
  'help.guide.place-navigation.result':
    '지도 앱에서 장소가 열리고, 웹사이트는 새 탭에서 열리며, 여행은 바뀌지 않아요. TREK를 앱으로 설치했다면 새 탭 대신 지도 앱이 열려요.',
  'help.guide.place-navigation.tip.1':
    'Waze는 바로 길 안내를 시작해요. 다른 앱은 장소를 열어 주니, 한 번 더 눌러야 길 안내가 시작돼요.',
  'help.guide.place-navigation.tip.2':
    '어떤 앱이 나오는지는 장소와 기기에 따라 달라요: Android에서는 Apple Maps가 없고, 高德地图는 중국 장소에만 나오며, Waze, Apple Maps, CoMaps는 장소 좌표가 있어야 해요. ‘다른 지도 앱’은 Android 휴대폰의 아무 지도 앱에서 장소를 열어요.',
  'help.guide.place-navigation.tip.3':
    '‘설정’의 ‘장소 열기 앱’에서 지도 앱을 한 번 골라 두면, 버튼에 그 앱 이름이 보이고 바로 열려요. 장소에 맞는 앱이 하나뿐일 때도 바로 열려요.',
  // place-to-collection
  'help.guide.place-to-collection.title': '장소를 내 목록에 저장하기',
  'help.guide.place-to-collection.goal': '이번 여행에서 찾은 장소를 다음 여행을 위해 저장해요.',
  'help.guide.place-to-collection.step.1': '장소를 열고 카드 맨 아래 줄에서 ‘컬렉션에 저장’을 클릭하세요.',
  'help.guide.place-to-collection.step.2':
    '‘목록에 저장’에는 내가 소유하거나 공유받은 목록이 모두 나와요. 오른쪽에 채워진 북마크가 있는 목록에는 이미 이 장소가 들어 있어요.',
  'help.guide.place-to-collection.step.3': '목록을 클릭하세요. 장소가 바로 추가돼요.',
  'help.guide.place-to-collection.step.4': 'X로 창을 닫으면 카드의 버튼이 ‘저장됨’으로 바뀌어요.',
  'help.guide.place-to-collection.result':
    '장소가 사진, 메모, 주소와 함께 내 목록에 들어가서, 다음 여행에 쓸 수 있어요.',
  'help.guide.place-to-collection.tip.1': '이 버튼은 관리자가 ‘애드온’에서 컬렉션 애드온을 켜 뒀을 때만 있어요.',
  'help.guide.place-to-collection.tip.2':
    '한 장소를 여러 목록에 동시에 넣을 수 있고, 목록마다 상태가 달라도 돼요. 한 목록에서는 아이디어, 다른 목록에서는 방문함처럼요.',
  'help.guide.place-to-collection.tip.3':
    '선택 창 맨 위 장소 이름 아래의 ‘방문함으로 표시’는 목록에서 그 장소를 방문함으로 표시해요. 장소가 내 목록 여러 개에 있으면 버튼이 ‘모든 목록에서 방문함’으로 바뀌고 한 번에 모두 표시해요. ‘보기’는 컬렉션에서 내 목록을 열어요.',
  // place-track
  'help.guide.place-track.title': '트랙 정보 보고 색 지정하기',
  'help.guide.place-track.goal': '가져온 걷기 코스의 길이를 보고, 지도에서 어느 선이 이 코스인지 확인해요.',
  'help.guide.place-track.step.1': '장소 열의 트랙 행에는 지도 위 트랙 색으로 짧은 선이 표시돼요. 클릭하세요.',
  'help.guide.place-track.step.2': '“트랙 통계”에 설정한 단위로 경로 길이가 나와요.',
  'help.guide.place-track.step.3': '그 위 ‘트랙 색상’에 지금 쓰는 색이 보여요. 줄을 클릭하면 색 견본이 열려요.',
  'help.guide.place-track.step.4': '색을 고르세요. 지도의 선과 줄의 색 띠가 함께 바뀌어요.',
  'help.guide.place-track.step.5':
    '왼쪽 점선 칸 ‘자동 색상’은 트랙을 기본 색으로 되돌려요. 오른쪽 스포이트를 누르면 시스템 색 선택 창이 열려 다른 색을 고를 수 있어요.',
  'help.guide.place-track.result': '트랙이 고른 색으로 카드, 장소 열의 해당 행, 지도에 그려져요.',
  'help.guide.place-track.tip.1':
    '이 두 블록은 경로선이 있는 장소에만 있어요: 투어 기능이 생기기 전에 GPX, KML, KMZ 파일로 가져왔거나, 투어가 꺼진 TREK에서 가져온 장소예요. 투어가 켜져 있으면 새 GPX 파일은 투어가 되고, 투어 카드가 열려요.',
  'help.guide.place-track.tip.2':
    '고도가 함께 기록된 트랙은 최고점과 최저점, 오르막과 내리막 미터, 코스의 고도 프로필도 보여 줘요.',
  'help.guide.place-track.tip.3':
    '가져오기로 추가하는 트랙마다 다른 색이 지정되어 두 코스가 같은 색이 되는 일은 없어요.',
  // read-place
  'help.guide.read-place.step.7':
    '맨 아래 줄은 여기서 할 수 있는 작업이에요: 장소를 열린 날에 넣거나 빼기, 지도 앱이나 웹사이트에서 열기, 목록에 저장, 그리고 오른쪽의 삭제(빨간 휴지통)나 편집.',

  // ── Screen: trip-files ────────────────────────────────────────────────────────────────
  'help.ctx.trip-files.title': '파일',
  'help.ctx.trip-files.summary':
    '여행의 모든 문서를 한 목록에서 관리해요: 티켓, 확인서, 패스, 사진. 문서마다 메모와 해당 장소나 예약으로 가는 연결이 있고, 휴지통에서 복원할 수 있어요.',
  'help.ctx.trip-files.bullet.1':
    '바 아래 점선 상자 ‘여기에 파일을 놓으세요’에 파일을 끌어다 놓으면 올라가요. 클릭하면 파일 선택 창이 열려요. 상자에 이 TREK가 받는 파일 형식과 파일당 한도(관리자가 따로 정하지 않았다면 최대 50MB)가 보여요.',
  'help.ctx.trip-files.bullet.2':
    '위쪽 바에 ‘파일’과 필터 탭 ‘전체’, ‘PDF’, ‘이미지’, ‘문서’가 개수와 함께 있어요. 즐겨찾기한 파일이 생기면 ‘전체’ 뒤에 별 탭이, 메모에 첨부가 생기면 맨 끝에 ‘Collab 메모’ 탭이 생겨요.',
  'help.ctx.trip-files.bullet.3':
    '줄에는 썸네일이나 파일 형식, 올린 사람, 이름, 그 아래 메모, 크기와 날짜, 그리고 연결마다 배지가 하나씩 보여요: 장소, 예약, 교통이 이름으로 나오고(마우스를 올리면 ‘일별 계획’, ‘예약’, ‘교통’이 보여요), ‘Collab 메모에서’도 있어요.',
  'help.ctx.trip-files.bullet.4':
    '줄 끝에 아이콘이 최대 다섯 개 있고, 가리키면 이름이 나와요: ‘즐겨찾기’, ‘배정’(연필), 열기, ‘다운로드’, ‘삭제’. ‘삭제’는 묻지 않고 파일을 휴지통으로 보내고, 거기서 복원할 수 있어요. 오프라인에서도 메모, 링크, 즐겨찾기, 휴지통은 동작하고 다시 온라인이 되면 전송돼요. 업로드와 다른 연결 해제만 인터넷 연결이 필요해요.',
  'help.ctx.trip-files.bullet.5':
    '사진이나 동영상은 전체 화면으로 열리고, 화살표 키와 썸네일 줄로 넘겨요. 다른 문서는 창으로 열리고, 위쪽에 이름, 그 아래 ‘새 탭에서 열기’와 ‘다운로드’가 있어요. 월렛 패스는 바로 내려받아요.',
  'help.ctx.trip-files.bullet.6':
    '바 오른쪽 끝의 휴지통 아이콘(“휴지통”)을 누르면 삭제된 파일 목록으로 바뀌어요. 거기서 파일을 하나씩 복원하거나 영구 삭제할 수 있고, 바의 “휴지통 비우기”로 모두 삭제할 수 있어요. 여행이 문서 저장소에 연결되어 있거나, 저장소가 하나라도 켜져 있을 때 여행 소유자나 관리자에게는 휴지통 아이콘 왼쪽에 “문서 동기화”가 나타나요.',
  // files-upload
  'help.guide.files-upload.title': '여행에 문서 추가하기',
  'help.guide.files-upload.goal':
    '다운로드 폴더의 티켓, 확인서, 사진을 여행에 올려 여행 멤버 모두가 열어 볼 수 있게 해요.',
  'help.guide.files-upload.step.1':
    '여행을 열고 탭 바의 “파일”을 클릭하세요. 여행의 문서 목록이 나오고, 그 위에 업로드 상자가 있어요.',
  'help.guide.files-upload.step.2':
    '‘여기에 파일을 놓으세요’를 클릭하고 파일을 하나 이상 고르세요. 차례로 올라가고, 진행 중에는 상자에 ‘업로드 중...’이 보여요. 상자 안 ‘또는 클릭하여 탐색’ 아래에 이 TREK가 받는 파일 형식과 파일당 최대 크기가 나와요.',
  'help.guide.files-upload.step.3':
    '마지막 파일이 다 올라가면(여행에 장소나 예약이 있다면) 그 파일의 ‘파일 배정’이 자동으로 열리고, 창 위쪽에 파일 이름이 보여요. ‘메모’ 아래 ‘메모 추가...’로 파일에 메모를 붙이고, 그 아래 목록에서 장소나 예약에 연결해요. 오른쪽 위 ×로 닫아도 아무것도 사라지지 않아요.',
  'help.guide.files-upload.step.4':
    '새 파일은 목록 맨 위에 나오고, 그보다 위에는 즐겨찾기한 파일만 있어요. 줄에 올린 사람, 이름, 크기, 날짜가 보여요. 사진에는 썸네일이, 나머지 파일에는 형식이 보여요.',
  'help.guide.files-upload.result': '문서가 여행에 저장되고, 여행을 볼 수 있는 모든 사람이 열고 내려받을 수 있어요.',
  'help.guide.files-upload.tip.1':
    '바탕화면에서 파일을 상자 위로 바로 드래그해 놓아도 돼요. 파일을 올려 두는 동안 상자가 강조 표시돼요.',
  'help.guide.files-upload.tip.2':
    'Ctrl+V를 누르면 클립보드의 사진이 목록에 추가돼요. 예약 화면 스크린숏을 따로 저장할 필요가 없어요.',
  'help.guide.files-upload.tip.3':
    '업로드하려면 파일 업로드 권한이 필요해요. 권한이 없으면 상자 자체가 보이지 않아요. 목록에 없는 형식은 메시지와 함께 거부되고 아무것도 올라가지 않아요. 용량 한도(관리자가 따로 정하지 않았다면 50MB)를 넘는 파일은 전송 전에 거부되고, 메시지에 한도가 표시돼요. 업로드에는 인터넷 연결도 필요해요. 오프라인이면 TREK가 알려 주고 아무것도 올리지 않아요.',
  // files-link
  'help.guide.files-link.title': '문서를 장소나 예약에 연결하기',
  'help.guide.files-link.goal': '이 목록에서뿐 아니라 해당 일자에서도 티켓을 쉽게 찾을 수 있게 해요.',
  'help.guide.files-link.step.1':
    '줄 끝의 연필(‘배정’)을 클릭하세요. ‘파일 배정’이 열리고, 창 위쪽에 파일 이름이 보여요.',
  'help.guide.files-link.step.2':
    '‘메모’ 아래 ‘메모 추가...’에 한 줄을 입력하면 목록에서 파일 이름 아래에 보여요. Enter를 누르거나 칸을 벗어나면 저장돼요.',
  'help.guide.files-link.step.3':
    '왼쪽 ‘장소’에 여행 장소가 날짜와 함께 날마다 묶여 있고, 어느 날에도 없는 장소는 맨 끝 ‘미배정’에 있어요. 클릭하면 체크돼요.',
  'help.guide.files-link.step.4':
    '오른쪽의 “예약”과 “교통” 아래에 여행의 예약이 있어요. 문서에 해당하는 예약을 클릭하면 거기에도 체크 표시가 생겨요.',
  'help.guide.files-link.step.5': '오른쪽 위의 ×로 닫으세요. 저장 버튼은 없어요. 클릭할 때마다 바로 저장됐어요.',
  'help.guide.files-link.result':
    '행에 메모와 함께 연결마다 배지가 하나씩 표시돼요. 하나는 장소 이름, 하나는 항공편 이름이에요. 배지에 마우스를 올리면 “일별 계획”이나 “교통”이 나와요. 문서는 그 장소와 항공편에도 첨부돼요.',
  'help.guide.files-link.tip.1':
    '파일 하나에 연결을 여러 개 걸 수 있어요. 그래서 같은 확인서를 호텔 예약과 호텔 장소에 동시에 연결할 수 있어요.',
  'help.guide.files-link.tip.2':
    '체크된 항목을 다시 클릭하면 그 연결이 해제되고, 파일 자체는 남아요. 오프라인에서는 메모와 새로 체크한 항목이 저장됐다가 다시 온라인이 되면 전송돼요. 다른 연결을 해제할 때만 인터넷 연결이 필요해요.',
  'help.guide.files-link.tip.3': '반대 방향도 돼요: 장소나 예약에 첨부한 문서도 이 목록에 같은 배지와 함께 나와요.',
  // files-star
  'help.guide.files-star.title': '중요한 문서를 맨 위에 두기',
  'help.guide.files-star.goal': '정말 필요한 문서 몇 개를 표시해서, 긴 목록에서 빨리 찾아요.',
  'help.guide.files-star.step.1':
    '행 끝의 별(“즐겨찾기”)을 클릭하세요. 별이 금색으로 바뀌고 파일 이름 앞에 별이 하나 더 생기며, 버튼에 마우스를 올리면 이제 “즐겨찾기 해제”라고 나와요.',
  'help.guide.files-star.step.2':
    '목록이 다시 정렬돼요. 즐겨찾기한 파일이 다른 파일보다 위에 오고, 각 그룹 안에서는 최신순이에요.',
  'help.guide.files-star.step.3':
    '이제 바의 필터 탭에서 “전체” 바로 뒤에 별이 나타나고, 옆에 즐겨찾기한 파일 수가 표시돼요. 클릭하면 그 파일만 볼 수 있어요.',
  'help.guide.files-star.result': '즐겨찾기한 파일이 목록 맨 위에 나오고, 즐겨찾기한 파일만 보여 주는 탭이 생겨요.',
  'help.guide.files-star.tip.1':
    '별 탭은 즐겨찾기한 파일이 있을 때만 있어요. 마지막 파일의 즐겨찾기를 해제하면 탭도 사라져요.',
  'help.guide.files-star.tip.2':
    '즐겨찾기에는 ‘배정’과 같은 권한인 ‘파일 메타데이터 편집’이 필요해요. 이 권한이 없는 멤버에게도 별은 보이지만, ‘즐겨찾기’를 클릭해도 아무것도 바뀌지 않아요.',
  // files-filter
  'help.guide.files-filter.title': '목록에서 문서 찾기',
  'help.guide.files-filter.goal': '찾는 종류의 문서만 표시해요.',
  'help.guide.files-filter.step.1':
    '필터 탭은 맨 위 바의 “파일” 옆에 있어요: “전체”, “PDF”, “이미지”, “문서”. 탭마다 파일 수가 표시돼요.',
  'help.guide.files-filter.step.2': '“PDF”를 클릭하면 목록에 PDF 파일만 표시돼요.',
  'help.guide.files-filter.step.3':
    '탭 두 개는 여행에 해당 파일이 있을 때만 나와요. Collab 탭의 메모에 첨부 파일이 생기면 “Collab 메모” 탭이 나타나고, 클릭하면 그 파일만 표시돼요. 별 탭도 같은 방식으로 파일을 즐겨찾기하면 나타나요.',
  'help.guide.files-filter.step.4': '‘전체’를 누르면 목록 전체가 다시 보여요.',
  'help.guide.files-filter.result': '고른 탭의 파일만 목록에 보이고, 탭마다 파일 수가 나와요.',
  'help.guide.files-filter.tip.1':
    '여기에는 폴더가 없고 파일 이름도 바꿀 수 없어요. 문서를 구분하려면 ‘파일 배정’의 메모, 장소와 예약 연결, 즐겨찾기를 쓰세요.',
  'help.guide.files-filter.tip.2':
    '목록은 항상 즐겨찾기한 파일이 먼저, 그다음은 최신순으로 정렬돼요. 오늘 올린 문서가 지난달 문서보다 위에 나와요.',
  // files-preview
  'help.guide.files-preview.title': 'TREK 안에서 문서 보기',
  'help.guide.files-preview.goal': '티켓이나 사진을 바로 보고, 필요하면 기기에 다운로드해요.',
  'help.guide.files-preview.step.1':
    '사진 이름이나 썸네일을 클릭하세요. 전체 화면으로 열리고, 왼쪽 위에 파일 이름과 몇 번째 사진인지 보여요. 동영상도 같은 방식으로 열리고 그 자리에서 재생돼요.',
  'help.guide.files-preview.step.2':
    '양옆의 둥근 화살표, 키보드의 왼쪽과 오른쪽 화살표 키, 아래쪽 썸네일 띠로 지금 목록에 보이는 모든 사진을 넘겨 보세요.',
  'help.guide.files-preview.step.3':
    '‘새 탭에서 열기’와 ‘다운로드’는 오른쪽 위 × 옆의 둥근 버튼이에요. ×를 클릭하거나, Esc를 누르거나, 어두운 배경을 클릭하면 사진이 닫혀요.',
  'help.guide.files-preview.step.4':
    '사진이 아닌 문서는 대신 창으로 열려요: 위쪽에 이름, 그 아래 ‘새 탭에서 열기’와 ‘다운로드’ 버튼, PDF라면 그 아래에 페이지가 보여요. 오른쪽 위 ×, Esc, 창 바깥 클릭으로 닫아요.',
  'help.guide.files-preview.step.5': '줄 끝 화살표(‘다운로드’)는 열지 않고 바로 기기에 파일을 저장해요.',
  'help.guide.files-preview.result':
    '문서가 화면에 표시되고, 같은 두 버튼으로 브라우저 탭에서 열거나 디스크에 저장할 수 있어요.',
  'help.guide.files-preview.tip.1': '터치 화면에서는 화살표를 누르는 대신 사진을 밀어서 넘기세요.',
  'help.guide.files-preview.tip.2':
    '월렛 패스는 미리보기가 열리지 않고 바로 다운로드돼요. 그래서 휴대폰의 월렛 앱에서 열 수 있어요.',
  'help.guide.files-preview.tip.3':
    '“새 탭에서 열기”와 “다운로드”는 모두 내 로그인 세션으로 파일을 불러와요. 그래서 주소창에서 복사한 링크는 다른 사람에게는 열리지 않아요.',
  // files-trash
  'help.guide.files-trash.title': '문서 삭제하고 복원하기',
  'help.guide.files-trash.goal': '여행에 필요 없는 파일은 삭제하고, 아직 필요한 파일은 복원해요.',
  'help.guide.files-trash.step.1':
    '줄 끝의 휴지통(‘삭제’)을 클릭하세요. 파일이 바로 목록에서 사라지고 ‘휴지통으로 이동됨’ 메시지가 떠요. 확인 질문은 없어요.',
  'help.guide.files-trash.step.2':
    '바 오른쪽 끝의 휴지통 아이콘(“휴지통”)을 누르면 삭제된 파일 목록으로 바뀌어요. 바 제목이 “휴지통”으로 바뀌고 필터 탭과 업로드 상자는 숨겨져요.',
  'help.guide.files-trash.step.3':
    '휴지통의 행은 흐리게 표시되고 아이콘이 두 개 있어요: 파일을 되돌리는 “복원”, 확인 후 영구 삭제하는 “삭제”.',
  'help.guide.files-trash.step.4':
    '“복원”을 클릭하세요. “파일이 복원되었습니다” 메시지가 나오고 파일이 휴지통에서 빠져요. 메모와 연결은 그대로 유지돼요.',
  'help.guide.files-trash.step.5':
    '바에서 휴지통 아이콘 옆의 “휴지통 비우기”를 누르면 휴지통에 남은 모든 파일이 영구 삭제돼요. 삭제하기 전에 브라우저가 한 번 확인해요. 휴지통 아이콘을 누르면 다시 파일 목록으로 돌아가요.',
  'help.guide.files-trash.result': '파일이 원래 있던 자리로 목록에 돌아와요.',
  'help.guide.files-trash.tip.1':
    '줄의 ‘삭제’는 먼저 묻지 않아요. 그래서 휴지통이 있어요. 여기서 삭제하기 전까지는 TREK에서 아무것도 지워지지 않아요. 모두 오프라인에서도 되고, 다시 온라인이 되면 전송돼요.',
  'help.guide.files-trash.tip.2':
    '파일을 삭제하고 복원하려면 파일 삭제 권한이 필요해요. 권한이 없는 멤버에게는 줄의 ‘삭제’도, 휴지통 안의 버튼도 보이지 않아요.',
  'help.guide.files-trash.tip.3': '휴지통에서 영구 삭제한 파일은 되돌릴 수 없어요.',
  // files-sync
  'help.guide.files-sync.title': '문서를 문서 저장소와 동기화하기',
  'help.guide.files-sync.goal':
    '여행을 내 문서 저장소에 연결해서, 여기서 올린 파일은 저장소에 저장되고 저장소에 저장한 파일은 여기 나타나게 해요.',
  'help.guide.files-sync.step.1':
    '바 오른쪽 끝 휴지통 아이콘 옆의 “문서 동기화”를 클릭하세요. 제목 아래에 여행 이름이 적힌 대화 상자가 열려요. 왼쪽 “저장소 연결” 아래에는 관리자가 켠 저장소가 파일 저장 방식 설명과 함께 나와요: Paperless-ngx와 Papra는 태그로, Nextcloud와 Synology Drive는 폴더에, OpenCloud는 스페이스에 저장해요. 오른쪽에는 “아직 연결된 저장소가 없습니다”가 표시돼요.',
  'help.guide.files-sync.step.2':
    '내 저장소를 클릭하세요. 여기서는 Nextcloud예요. 연결용 작은 대화 상자가 열리고, 저장소 이름과 함께 그 저장소에 필요한 로그인 정보를 물어봐요.',
  'help.guide.files-sync.step.3':
    '‘주소’와 저장소별 로그인 정보를 채우세요: Paperless-ngx는 ‘API 토큰’, Papra는 ‘API 키’와 ‘조직 ID’, Nextcloud는 ‘사용자 이름’과 ‘앱 비밀번호’, OpenCloud는 ‘사용자 이름’과 ‘앱 토큰’, Synology Drive는 ‘사용자 이름’, ‘비밀번호’, 그리고 계정에서 요구하면 ‘2단계 인증 코드’. 저장소가 앱 비밀번호나 토큰을 지원하면 꼭 그걸 쓰고, 계정 비밀번호는 쓰지 마세요. Nextcloud와 Synology Drive는 TREK가 여행 폴더를 찾을 ‘기준 폴더’(선택, 여기서는 /Reisen)도 받아요. 맨 아래 ‘자체 서명 인증서 허용’은 그런 인증서를 쓰는 내 네트워크의 저장소에만 쓰세요.',
  'help.guide.files-sync.step.4':
    '‘연결 테스트’를 클릭하세요. TREK가 입력한 정보로 저장소에 연결하고, 하단에 ‘연결됨, 다음 계정으로 로그인함’과 계정 이름이 보여요. 인증 정보가 거부되거나 주소에 연결할 수 없으면 대신 그 내용이 나와요. 어느 경우든 저장되는 건 없어요.',
  'help.guide.files-sync.step.5':
    '‘연결’을 클릭하세요. 연결이 여행과 함께 저장되고, TREK가 저장소에서 여행 문서를 둘 곳(태그, 폴더, 스페이스)을 물어봐요. 그 안에 있는 것만 동기화돼요. ‘새로 만들기’를 고르고 ‘생성’을 누르면 여행 제목으로 이름 지은 새 위치가 만들어져요. ‘또는 이미 있는 것 사용하기’에 기존 위치가 나와요. 하나를 클릭하세요. 여기서는 Autumn in Japan 폴더예요.',
  'help.guide.files-sync.step.6':
    '대화 상자가 다시 열려요. 왼쪽 “이 여행” 아래에 내 저장소가 있고, 오른쪽 카드에 동기화 위치, 마지막 실행 시각, “지금 동기화”가 나와요. 첫 동기화는 자동으로 시작되고, 언제든 “지금 동기화”를 클릭해 동기화할 수 있어요. 동기화가 끝나면 이름 옆의 “아직 동기화하지 않았습니다” 배지가 초록 점으로 바뀌고, 마우스를 올리면 “동기화됨”이 표시돼요. 흐름 막대에는 TREK과 저장소에 각각 문서가 몇 개 있는지 나오고, 그 사이에 “저장소로 내보내기”와 “저장소에서 가져오기” 레인이 있어요. 오른쪽 위의 ×로 대화 상자를 닫으세요.',
  'help.guide.files-sync.result':
    '저장소에 있던 문서가 내 이름으로 업로드되어 목록 맨 위에 나타나고, Collab 메모의 문서를 빼면 여행의 모든 문서가 저장소에도 들어가요. 이제부터 TREK이 백그라운드에서 저장소를 확인하고, 목록의 변경 사항을 저장소에 복사해요.',
  'help.guide.files-sync.tip.1':
    '인증 정보로 저장소의 계정 전체에 접근할 수 있기 때문에, 여행을 연결할 수 있는 건 여행 소유자나 인스턴스 관리자뿐이에요. 연결된 뒤에는 모든 멤버에게 “문서 동기화”가 보이고, 열어서 카드를 보고 “지금 동기화”를 누를 수 있어요.',
  'help.guide.files-sync.tip.2':
    '내부 네트워크에 있는 저장소를 쓰려면 TREK 서버에 ALLOW_INTERNAL_NETWORK=true를 설정해야 하고, 주소는 localhost가 아니라 네트워크상의 그 기기 주소여야 해요. 그렇지 않으면 “연결 테스트”에서 “허용되지 않는 주소입니다.”라고 나와요.',
  'help.guide.files-sync.tip.3':
    '‘지금 동기화’ 옆 아이콘 ‘연결 해제’는 한 번 확인한 뒤 연결을 끊고, 양쪽 문서는 모두 남겨요. 같은 태그, 폴더, 스페이스를 다시 연결하면 TREK가 새것으로 보고 안의 모든 걸 다시 가져와요. 그러니 연결을 해제한 뒤에는 예전 것이 아니라 빈 것을 연결하세요.',

  // ── Screen: trip-day-detail ───────────────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': '일별 상세',
  'help.ctx.trip-day-detail.summary':
    '날 헤더를 클릭하면 지도 위에 열리는 패널이에요. 하루 전체를 보여 줘요: 이름과 날짜, 머무는 곳의 날씨, 그날의 예약, 그날 잡힌 숙박.',
  'help.ctx.trip-day-detail.bullet.1':
    '날 열에서 날 헤더를 클릭하면 지도 가운데에 패널이 열려요. 같은 헤더를 다시 클릭하거나 오른쪽 X를 누르면 패널이 닫히고 날 선택이 해제돼요. 장소 열이나 지도에서 장소를 열면 패널이 닫히고 대신 장소가 보여요.',
  'help.ctx.trip-day-detail.bullet.2':
    '헤더에 날 이름과 날짜가 보여요. 이름 옆 연필로 날 이름을 바꾸고, 겹화살표로 패널을 좁은 바로 접어 지도를 다시 볼 수 있어요.',
  'help.ctx.trip-day-detail.bullet.3':
    '맨 위에 그날 날씨가 보여요. ‘예보 기준’에 어느 장소의 예보인지 나와요: 그날 첫 들를 곳, 또는 아침을 맞는 호텔.',
  'help.ctx.trip-day-detail.bullet.4':
    '‘예약’에 그날 예약이 종류, 속한 들를 곳, 시간과 함께 나와요. 초록색은 확정, 주황색은 대기 중, 대중교통 이동은 파란색이고 상태가 없어요. 줄을 클릭하면 예약이 열려요.',
  'help.ctx.trip-day-detail.bullet.5':
    '‘숙박’에 이날에 걸친 모든 숙박이 나오고, 해당하는 날에 ‘체크인’과 ‘체크아웃’, 체크인 가능 시간, 체크아웃 시간, 예약 번호가 보여요. 숙박에 예약이 있으면 그 아래 ‘예약’ 상자에 ‘대기 중’ 또는 ‘확정됨’과 함께 예약 이름이 나와요. 클릭하면 예약이 열려요.',
  'help.ctx.trip-day-detail.bullet.6':
    '‘숙박 추가’는 이날에 하룻밤 숙박을 추가해요. 여행 장소에서 숙소를 고르고, 며칠에 걸치는지 정하고, 시간과 코드를 입력하세요. 날 헤더의 +(툴팁 ‘날에 추가’)에도 ‘숙박 추가’가 있는데, 양식이 열린 상태로 이 패널을 열어 줘요.',
  // day-panel
  'help.guide.day-panel.title': '일자를 열어 상세 정보 보기',
  'help.guide.day-panel.goal': '지도를 떠나지 않고 하루 전체를 날씨, 예약, 숙소와 함께 봐요.',
  'help.guide.day-panel.step.1':
    '일자 열에서 일자 헤더를 클릭하세요. 그날이 선택되고 지도 가운데 위에 상세 정보가 열려요.',
  'help.guide.day-panel.step.2':
    '헤더에 일자 이름이 나와요. 이름을 정하기 전에는 “1일차”이고, 그 아래에 날짜가 있어요.',
  'help.guide.day-panel.step.3':
    '맨 위에 그날 날씨가 있어요. ‘예보 기준’에 어느 장소 기준인지 나와요: 그날 첫 들를 곳, 또는 전날 밤 묵은 호텔.',
  'help.guide.day-panel.step.4': '그 아래 ‘예약’에 이날의 예약이 시간과 함께 나와요.',
  'help.guide.day-panel.step.5': '‘숙박’에 이날에 걸친 숙박이 나오고, 해당하는 날에 ‘체크인’과 ‘체크아웃’이 붙어요.',
  'help.guide.day-panel.step.6':
    '헤더의 이중 화살표를 누르면 패널이 좁은 막대로 접혀요. 옆의 X를 누르면 패널이 닫히고 일자 선택도 해제돼요.',
  'help.guide.day-panel.result':
    '패널을 막대로 접으면 지도가 넓어지고 일자 선택은 유지돼요. 패널을 닫으면 선택이 해제되고 계획은 그대로예요.',
  'help.guide.day-panel.tip.1':
    '패널 헤더 바의 아무 곳이나 클릭해도 접혀요. 화살표 버튼은 여러 방법 중 하나일 뿐이에요.',
  'help.guide.day-panel.tip.2':
    '장소 열이나 지도에서 장소를 열면 날 패널이 닫히고 대신 장소 상세 정보가 보여요. 날 헤더를 다시 클릭하면 그날이 다시 보여요.',
  // day-weather
  'help.guide.day-weather.title': '그날 날씨 보기',
  'help.guide.day-weather.goal': '그날 실제로 있는 곳의 날씨를 확인해요.',
  'help.guide.day-weather.step.1':
    '‘예보 기준’에 숫자가 어느 장소 기준인지 나와요: 그날 첫 들를 곳, 들를 곳이 없는 날에는 전날 밤 묵은 호텔.',
  'help.guide.day-weather.step.2': '큰 숫자가 그날 기온이고, 옆에 최저 기온과 최고 기온, 날씨 상태가 글로 나와요.',
  'help.guide.day-weather.step.3': '오른쪽의 작은 배지에는 강수 확률, 강수량, 최대 풍속, 일출과 일몰 시간이 나와요.',
  'help.guide.day-weather.step.4':
    '맨 아래에는 두 시간 간격으로 그날의 시간별 날씨가 나와요: 시각, 아이콘, 기온, 강수 확률. 50%를 넘는 시간은 파란색으로 표시돼요.',
  'help.guide.day-weather.result':
    '일자 열의 그날 카드에도 번호 아래 작은 글씨로 날씨가 나와서, 여행 전체의 날씨를 빠르게 훑어볼 수 있어요.',
  'help.guide.day-weather.tip.1':
    '기온과 바람은 “설정”의 “화면”에 있는 “온도 단위”를 따라요. °F Fahrenheit를 고르면 같은 예보가 °F와 mph로 표시돼요.',
  'help.guide.day-weather.tip.2':
    '위치가 있는 들를 곳도 없고 전날 밤 묵은 호텔도 없는 날에는 날씨가 나오지 않아요. 예보는 항상 장소 기준이지, 여행 기준이 아니에요.',
  'help.guide.day-weather.tip.3':
    '16일보다 먼 날은 예보가 없어요. 이때는 지난 몇 년간 그 날짜의 평균값을 보여 주고, Ø 표시와 함께 아래에 안내가 나와요.',
  // rename-day
  'help.guide.rename-day.title': '날에 이름 붙이기',
  'help.guide.rename-day.goal': '“5일차” 대신 “교토 도착”이나 “휴식일” 같은 이름을 붙여요.',
  'help.guide.rename-day.step.1': '일자를 여세요. 헤더에 “5일차”가 있고 그 아래에 날짜가 있어요.',
  'help.guide.rename-day.step.2': '이름 옆의 연필을 클릭하세요.',
  'help.guide.rename-day.step.3': '이름이 입력란으로 바뀌어요. 원하는 이름을 입력하세요.',
  'help.guide.rename-day.step.4':
    'Enter를 누르거나 다른 곳을 클릭하세요. Esc를 누르면 취소돼요. 날 열의 그날 카드에도 이름이 보여요.',
  'help.guide.rename-day.result': '패널과 날 열의 카드에서 ‘Day 5’ 대신 그 이름이 보여요. 날짜는 바뀌지 않아요.',
  'help.guide.rename-day.tip.1': '칸을 비우고 저장하면 다시 ‘Day 5’가 돼요. 이름이 없으면 번호가 보여요.',
  'help.guide.rename-day.tip.2':
    '이름은 날짜가 아니라 그 일자에 붙어요. 일자 순서를 바꾸면 이름도 그날의 다른 내용과 함께 옮겨져요.',
  // add-accommodation
  'help.guide.add-accommodation.title': '일자에 숙박 예약하기',
  'help.guide.add-accommodation.goal': '호텔을 숙박하는 날, 시간, 확인 번호와 함께 계획에 한 번만 추가해요.',
  'help.guide.add-accommodation.step.1':
    '숙소가 먼저 여행의 장소로 등록되어 있어야 해요. 다른 장소처럼 장소 열에서 만드세요. 선택기에는 이미 있는 장소만 나와요.',
  'help.guide.add-accommodation.step.2': '도착하는 날을 열고 ‘숙박’ 아래 ‘숙박 추가’를 클릭하세요.',
  'help.guide.add-accommodation.step.3':
    '‘적용할 날’로 숙박할 밤을 정해요: ‘시작’은 체크인 날, ‘종료’는 체크아웃 날이고, ‘전체’는 여행 전체예요. 창 위쪽에 기간과 박 수가 보여요.',
  'help.guide.add-accommodation.step.4':
    '‘체크인’, ‘까지’, ‘체크아웃’을 채우고, 예약 번호는 ‘확인’에 넣으세요. 네 칸 모두 비워 둬도 돼요.',
  'help.guide.add-accommodation.step.5':
    '‘숙박 선택’에서 숙소를 고르세요. 목록 위 ‘카테고리’로 한 카테고리만 볼 수 있어요.',
  'help.guide.add-accommodation.step.6': '“저장”을 클릭하세요.',
  'help.guide.add-accommodation.result':
    '숙박이 걸친 모든 날에 보이고, 첫날에는 ‘체크인’, 마지막 날에는 ‘체크아웃’이 붙어요. 숙소는 체크인 날의 들를 곳이 되어 지도에 그곳까지 경로가 보이고, ‘예약’ 탭에 호텔 예약이 생겨요.',
  'help.guide.add-accommodation.tip.1':
    '선택기는 열어 둔 날로 시작하고 체크아웃은 다음 날로 잡혀요. 저장하기 전에 둘 다 바꿀 수 있어요.',
  'help.guide.add-accommodation.tip.2':
    '호텔을 만들 때 Hotel 카테고리를 지정하세요. 그러면 목록 위의 “카테고리”에서 클릭 한 번으로 호텔만 볼 수 있어요.',
  'help.guide.add-accommodation.tip.3':
    '시간은 모두 선택 사항이에요. 체크인 시간과 예약 코드가 없어도 숙박은 해당 밤들에 적용되고 경로도 그려져요.',
  // edit-accommodation
  'help.guide.edit-accommodation.title': '예약한 숙박 바꾸거나 취소하기',
  'help.guide.edit-accommodation.goal': '숙박을 옮기거나, 시간을 고치거나, 계획에서 빼요.',
  'help.guide.edit-accommodation.step.1':
    '카드에 숙소와 주소, 해당 날의 ‘체크인’ 또는 ‘체크아웃’과 시간, 예약 번호, 그리고 ‘예약’ 아래에 함께 생긴 예약이 보여요.',
  'help.guide.edit-accommodation.step.2':
    '오른쪽의 연필 아이콘 ‘숙박 편집’을 누르면 숙박을 편집할 수 있어요. 팝업 제목이 ‘숙박 편집’으로 바뀌어요.',
  'help.guide.edit-accommodation.step.3':
    '‘체크인’, ‘까지’, ‘체크아웃’, ‘확인’을 고치세요. 그 위의 날짜와 아래의 숙소도 여기서 바꿀 수 있어요.',
  'help.guide.edit-accommodation.step.4': '“저장”을 클릭하세요.',
  'help.guide.edit-accommodation.step.5':
    '연필 옆의 X ‘제거’는 숙박을 삭제해요. 확인을 묻지 않고, 그 숙박에 연결된 호텔 예약도 함께 삭제돼요.',
  'help.guide.edit-accommodation.result': '숙박이 걸친 모든 날과 ‘예약’ 탭의 호텔 예약에 바로 반영돼요.',
  'help.guide.edit-accommodation.tip.1':
    '숙박 기간 중간의 밤에는 “체크인”이나 “체크아웃” 라벨이 붙지 않아요. 기간의 첫날과 마지막 날에만 붙어요.',
  'help.guide.edit-accommodation.tip.2':
    '숙박을 취소하면 체크인 날에 추가됐던 일정과 예약에 연결된 비용도 함께 삭제돼요. 실수였다면 다시 숙박을 예약하세요.',
  // day-bookings
  'help.guide.day-bookings.title': '그날의 예약 한눈에 보기',
  'help.guide.day-bookings.goal': '이날 이미 예약된 것과 확정 여부를 한곳에서 확인해요.',
  'help.guide.day-bookings.step.1':
    '‘예약’에 그날의 예약이 나와요: 그 날짜의 예약과 그날 들를 곳에 고정한 예약. 다른 날 들를 곳에 고정한 예약은 그 들를 곳에만 보여요.',
  'help.guide.day-bookings.step.2':
    '줄에는 예약 종류와 이름이 보이고, 들를 곳에 속한 예약이면 그 뒤에 회색으로 들를 곳이 나와요. 시간은 오른쪽 끝 상태 점 앞에 보여요.',
  'help.guide.day-bookings.step.3':
    '색이 예약 상태를 나타내요: 초록색은 확정, 주황색은 대기 중, 대중교통 이동은 상태 없이 파란색이에요. 호텔은 이 목록에 없고 아래에 따로 섹션이 있어요.',
  'help.guide.day-bookings.step.4':
    '줄을 클릭하면 예약이 열려요. 헤더 버튼으로 ‘대기 중’과 ‘확정됨’을 바꾸고, 아래쪽 ‘편집’으로 나머지를 바꿔요. 새 예약은 ‘예약’ 탭에서, 교통은 ‘교통’ 탭에서 만들어요.',
  'help.guide.day-bookings.result': '그 날짜의 예약과 그날 들를 곳에 연결된 예약이 모두 이 목록에 있어요.',
  'help.guide.day-bookings.tip.1':
    '예약은 자기 날짜에 해당하는 날에 나타나요. ‘예약’이나 ‘교통’ 탭에서 날짜를 바꾸면 예약이 자동으로 다른 날로 옮겨져요.',
  'help.guide.day-bookings.tip.2': '“예약” 블록이 없으면 그날 예약이 없다는 뜻이에요. 빈 블록을 보여 주지 않고 숨겨요.',
  'help.guide.map-lock.title': '지도 잠그기',
  'help.guide.map-lock.goal': '일자와 장소를 클릭하는 동안 지도를 그 자리에 고정해요.',
  'help.guide.map-lock.step.1':
    '자물쇠는 지도 왼쪽 아래 둥근 버튼 두 개 중 위쪽이고, 마우스를 올리면 ‘지도 보기 고정’이라고 나와요. 클릭하세요. 잠겨 있는 동안에는 날을 열거나 장소를 골라도 지도가 확대되거나 움직이지 않고, 버튼이 ‘선택 항목에 따라 지도 이동’으로 바뀌어요.',
  'help.guide.map-lock.result': '계획을 살펴보는 동안 지도가 그 자리에 그대로 있어요.',
  'help.guide.map-lock.tip.1':
    '자물쇠(이제 ‘선택 항목에 따라 지도 이동’)를 다시 클릭하면 지도가 다시 고른 곳을 따라가요. 자물쇠는 컴퓨터에만 있고, 휴대폰에서는 지도가 항상 따라가요.',

  // ── Screen: trip-map ──────────────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': '지도',
  'help.ctx.trip-map.summary':
    '계획 화면의 가운데예요. 여행의 모든 장소가 핀으로, 모든 투어가 선으로, 그 사이 경로와 함께 보여요. 지도 가장자리 버튼으로 화면을 고정하고, 위성 지도로 바꾸고, 여행 전체를 한눈에 보고, 지금 보고 있는 지역의 장소를 볼 수 있어요.',
  'help.ctx.trip-map.bullet.1':
    '핀은 장소예요. 사진이 있으면 그 사진이, 없으면 카테고리 색과 카테고리 아이콘이 보여요. 핀에 마우스를 올리면 사진, 이름, 주소, 그리고 있으면 평점과 카테고리가 담긴 카드가 나와요. 핀을 날 카드로 끌어다 놓으면 그날에 장소를 넣어요. 예약이 아직 대기 중인 숙박은 점선 테두리와 함께 흐리게 보여요.',
  'help.ctx.trip-map.bullet.2':
    '너무 가까이 붙은 핀은 개수가 적힌 어두운 원 하나로 묶여요. 원을 클릭하면 그 안의 핀이 보이도록 확대돼요. ‘설정’ > ‘화면’의 ‘여행 및 지도’에서 ‘계획되지 않은 장소를 작은 마커로 표시’를 켜면 아직 날에 없는 장소가 사진 없는 작은 점으로 보여서, 계획한 들를 곳이 더 잘 보여요.',
  'help.ctx.trip-map.bullet.3':
    '핀을 클릭하면 지도 아래쪽 카드에 장소가 열리고, 평점, 파일, 다음에 할 수 있는 작업이 나와요. 지도의 빈 곳을 클릭하면 카드가 닫혀요.',
  'help.ctx.trip-map.bullet.4':
    '날 열에서 날을 열면 그날 들를 곳에 순번이 적힌 작은 흰색 배지가 붙어요. 하루에 두 번 들르는 장소에는 번호가 둘 다 보여요. 장소 목록 위의 필터(‘표시’, 카테고리, 최소 평점 별)는 지도의 핀도 걸러요.',
  'help.ctx.trip-map.bullet.5':
    '맨 위 아이콘 줄로 지금 보이는 지도 영역을 검색해요: ‘음식점’, ‘카페’, ‘바 & 나이트라이프’, ‘숙박’, ‘명소’, ‘박물관 & 문화’, ‘자연 & 공원’, ‘액티비티’. 플러그인이 추가한 카테고리는 얇은 구분선 뒤에 있어요. 줄이 지도보다 넓으면 마우스 휠로 옆으로 스크롤해요. 지도를 옮긴 뒤 ‘이 지역 검색’을 누르면 다시 검색해요.',
  'help.ctx.trip-map.bullet.6':
    '지도 아무 곳이나 오른쪽 클릭하면 그 지점의 주소가 채워진 장소 양식이 열려요. 왼쪽 아래 둥근 버튼 두 개: 자물쇠 ‘지도 보기 고정’은 날과 장소를 클릭해도 지도 화면을 그대로 두고, 그 아래 ‘위성 보기로 전환’은 지도를 위성 사진으로 바꿔요.',
  'help.ctx.trip-map.bullet.7':
    '오른쪽 아래 “전체 여행 보기”는 모든 이동일을 한 번에 그리고 날마다 이동 내용을 보여 줘요. 예약 행의 경로 아이콘은 그 예약을, 일자 위 도구 모음의 경로 아이콘은 모든 예약을 그려요. 그려진 예약의 끝을 클릭하면 상세 정보가 열려요.',
  'help.ctx.trip-map.bullet.8':
    'Dawarich 애드온이 켜져 있으면 ‘전체 여행 보기’ 아래 둥근 Dawarich 버튼으로 휴대폰이 실제로 기록한 경로를 보여 줘요. ‘기록된 경로 표시’는 계획한 경로 아래에 날마다 다른 색 점선으로 그려요. 선이 없으면 버튼 레이블에 이유가 나와요.',
  // map-markers
  'help.guide.map-markers.title': '지도 보기',
  'help.guide.map-markers.goal': '지도의 핀, 배지, 원이 무엇을 뜻하는지 알아봐요.',
  'help.guide.map-markers.step.1':
    '지도에는 여행의 모든 장소가 표시돼요. 핀이 너무 가까워 구분하기 어려운 곳은 핀 개수가 적힌 어두운 원 하나로 묶여요. 원을 클릭하면 그 핀들이 보이도록 확대되고, 최대로 확대한 상태에서는 핀이 흩어져 보여요.',
  'help.guide.map-markers.step.2':
    '핀에는 장소 사진이 있으면 그 사진이, 없으면 카테고리 색과 카테고리 아이콘이 보여요. 예약이 아직 대기 중인 숙박은 점선 테두리와 함께 흐리게 보여요. 핀에 마우스를 올리면 옆에 카드가 열려요: 같은 사진을 크게, 이름과 주소, 그리고 있으면 평점과 카테고리를 보여 줘요.',
  'help.guide.map-markers.step.3':
    '핀을 클릭하면 지도 아래쪽에 카드가 열려요: 위에는 사진, 이름, 주소가, 그 아래에는 별점, 설명, 파일(예약에 첨부된 파일 포함)이 나와요. 맨 아래에는 버튼이 있어요: 날이 열려 있으면 ‘날에 추가’(이미 그날에 있으면 ‘날에서 제거’), ‘내비게이션’, ‘웹사이트 열기’, ‘컬렉션에 저장’(이미 저장했다면 ‘저장됨’), 그리고 오른쪽에 휴지통과 ‘편집’. 위쪽 X를 누르거나 지도의 빈 곳을 클릭하면 닫혀요.',
  'help.guide.map-markers.step.4':
    '일자 열에서 일자를 열면 그날 일정에 번호가 붙어요. 핀 모서리의 작은 흰색 배지가 그날의 순서예요. 하루에 두 번 나오는 장소에는 번호가 두 개 표시돼요. 열린 일자가 없으면 번호 대신 평점이 있는 장소에는 평점이 모서리에 표시돼요.',
  'help.guide.map-markers.step.5':
    '지도의 핀을 일자 열의 일자 카드로 드래그하면 그날에 장소가 계획돼요. 장소 목록에서 행을 드래그하는 것과 같아요.',
  'help.guide.map-markers.result':
    '여행 내용은 바뀌지 않아요. 지도는 여행을 보여 줄 뿐이에요. 핀마다 어떤 장소인지, 어느 날 몇 번째인지 알 수 있어요.',
  'help.guide.map-markers.tip.1': '날 열에서 날을 접으면 그날 들를 곳이 지도에서 숨겨져요. 다시 펼치면 보여요.',
  'help.guide.map-markers.tip.2':
    '장소 목록 위의 필터는 지도에 보이는 것도 정해요: ‘표시’(‘미계획’, ‘예정’), 태그 버튼의 카테고리, 별의 최소 평점이 모두 핀 수를 줄여요. 국가 필터는 목록만 좁혀요.',
  'help.guide.map-markers.tip.3':
    '이 지도에는 확대 버튼이 없어요. 마우스 휠로 확대하고, 더블클릭으로 한 단계 확대하고, 지도를 끌어서 움직여요.',
  // map-nearby-places
  'help.guide.map-nearby-places.title': '지도에서 주변 장소 찾기',
  'help.guide.map-nearby-places.goal': '지도에 보이는 동네에서 음식점, 명소, 호텔을 찾아 여행에 추가해요.',
  'help.guide.map-nearby-places.step.1':
    '지도 맨 위의 아이콘 줄이 카테고리 검색이에요: ‘음식점’, ‘카페’, ‘바 & 나이트라이프’, ‘숙박’, ‘명소’, ‘박물관 & 문화’, ‘자연 & 공원’, ‘액티비티’. 플러그인이 추가한 카테고리는 얇은 구분선 뒤에 있어요. 아이콘에 마우스를 올리면 이름이 보여요.',
  'help.guide.map-nearby-places.step.2':
    '카테고리를 클릭하세요. TREK이 지도에 보이는 범위에서 그 종류의 장소를 찾아 결과마다 카테고리 색 핀을 꽂아요. 한 번에 한 카테고리만 볼 수 있어요. 다른 카테고리를 누르면 바뀌고, 켜진 카테고리를 다시 누르면 꺼져요.',
  'help.guide.map-nearby-places.step.3':
    '지도를 움직이면 줄 아래에 두 번째 버튼 “이 지역 검색”이 나타나고, 새 화면에서 같은 검색을 실행해요. 지도를 움직이기만 해서는 새로 검색하지 않아요. 요청 수를 줄이기 위해서예요.',
  'help.guide.map-nearby-places.step.4':
    '핀에 포인터를 올리면 검색된 곳의 이름이 보여요. 핀을 클릭하면 정보가 채워진 장소 양식이 열려요: 창 위쪽의 이름, ‘주소’, ‘위도’, ‘경도’, 그리고 찾았다면 웹사이트와 전화번호.',
  'help.guide.map-nearby-places.step.5':
    '채워진 내용을 확인하고 검색으로 알 수 없는 내용을 더하세요. 여행에 맞는 카테고리가 있으면(예: 음식점이면 ‘레스토랑’) 이름 아래 카테고리 버튼이 이미 정해져 있고, 없으면 고를 때까지 ‘카테고리 없음’이에요. ‘설명’과 내 메모를 추가하세요.',
  'help.guide.map-nearby-places.step.6':
    '“추가”를 클릭하세요. 이름이 같거나 같은 위치의 장소가 이미 여행에 있으면 TREK이 알려 주고, 버튼이 “그래도 추가”로 바뀌어요.',
  'help.guide.map-nearby-places.result':
    '장소가 장소 목록과 지도에 여행의 핀으로 들어가고, 날에 넣기 전까지 ‘미계획’에 있어요. 검색 핀은 카테고리를 끌 때까지 남아요.',
  'help.guide.map-nearby-places.tip.1':
    '‘설정’ > ‘화면’의 ‘여행 및 지도’에서 ‘지도에서 장소 탐색’을 끄면 이 줄이 숨겨져요.',
  'help.guide.map-nearby-places.tip.2':
    '결과는 TREK Places 인덱스와 OpenStreetMap에서 가져와서, 계획에서 인터넷 연결이 필요한 몇 안 되는 기능이에요.',
  'help.guide.map-nearby-places.tip.3':
    '검색은 화면에 보이는 영역만 다루니, 궁금한 거리까지 확대하세요. 도시 전체를 검색하면 처음 60개 결과만 뚜렷한 순서 없이 나와요.',
  // map-add-place
  'help.guide.map-add-place.title': '지도를 오른쪽 클릭해 장소 만들기',
  'help.guide.map-add-place.goal': '검색하지 않고 원하는 위치에 정확히 장소를 만들어요.',
  'help.guide.map-add-place.step.1':
    '지도에서 원하는 지점을 오른쪽 클릭하세요. “장소/활동 추가”라는 제목의 장소 양식이 열려요.',
  'help.guide.map-add-place.step.2':
    '“위도”와 “경도”는 이미 그 지점으로 설정되어 있어요. TREK이 좌표로 찾아본 결과로 “주소”를 채우고, 이름도 찾으면 대화 상자 맨 위 이름까지 채워요. 아직 저장되지 않았으니 틀린 부분은 고치세요.',
  'help.guide.map-add-place.step.3':
    '창 위쪽 칸에 알아보기 쉬운 이름을 입력하세요. 그 아래 버튼에서 카테고리를 고르세요(고르기 전까지 ‘카테고리 없음’). 그다음 계획에 필요한 ‘설명’, ‘메모’, ‘웹사이트’를 더하세요.',
  'help.guide.map-add-place.step.4':
    '‘추가’를 클릭하세요. 날이 열려 있어도 장소는 미계획으로 목록에 들어가요. 지도를 오른쪽 클릭하면 위치만 정해지고, 날은 정해지지 않아요.',
  'help.guide.map-add-place.result': '장소가 목록과 지도에 들어가고, 날에 넣기 전까지 ‘미계획’에 있어요.',
  'help.guide.map-add-place.tip.1':
    '주소는 좌표로 찾아오기 때문에 장소 이름 대신 도로명이 나올 수 있고, 인적이 드문 곳에서는 비어 있을 수도 있어요. 두 항목 모두 직접 고쳐 쓸 수 있어요.',
  'help.guide.map-add-place.tip.2':
    'MapLibre GL과 Mapbox GL 지도에서는 가운데 버튼 클릭으로, 터치 화면에서는 길게 눌러도 돼요.',
  // map-satellite
  'help.guide.map-satellite.title': '위성 지도로 전환하기',
  'help.guide.map-satellite.goal': '일반 지도를 위성 사진으로 바꾸고, 다시 되돌려요.',
  'help.guide.map-satellite.step.1':
    '배경 지도 전환 버튼은 지도 왼쪽 아래 둥근 버튼 두 개 중 아래쪽, 자물쇠 밑에 있어요. 아이콘은 항상 전환될 지도를 보여 주고, 툴팁에 ‘위성 보기로 전환’처럼 나와요. 클릭하세요.',
  'help.guide.map-satellite.step.2':
    '이제 지도가 항공 사진으로 보여요. 건물 하나하나가 보일 만큼 자세하고, 따로 키가 필요 없어요. 핀, 그날 경로, 트랙, 예약 경로처럼 TREK가 그리는 건 모두 그 위에 그대로 보여요.',
  'help.guide.map-satellite.step.3': '이제 버튼이 ‘지도 보기로 전환’이에요. 클릭하면 지도 보기로 돌아가요.',
  'help.guide.map-satellite.result': '지도가 다시 그려지고, 고른 레이어는 내 계정에 저장돼요.',
  'help.guide.map-satellite.tip.1':
    '이 선택은 여행이 아니라 계정에 저장돼요. 그래서 어떤 지도 렌더러를 쓰든 모든 여행이 마지막으로 둔 모습 그대로 열려요.',
  'help.guide.map-satellite.tip.2':
    '위성 사진에는 라벨이 없어요. 도로명, 동네 이름, 번지는 일반 지도에만 있으니 주소를 찾을 때는 다시 전환하세요.',
  // map-whole-trip
  'help.guide.map-whole-trip.title': '여행 전체와 거리 보기',
  'help.guide.map-whole-trip.goal':
    '열린 날만이 아니라 여행의 모든 이동일을 보여 주고, 날마다 얼마나 이동하는지 확인해요.',
  'help.guide.map-whole-trip.step.1':
    '둥근 “전체 여행 보기” 버튼은 지도 오른쪽 아래에 있어요. 클릭하면 여행의 모든 이동일이 한 번에 그려져요. 날마다 색이 달라서 이웃한 날도 구분할 수 있어요.',
  'help.guide.map-whole-trip.step.2':
    '버튼 위 카드에 그 일자들이 나와요: 색 점, 일자 이름, 그날의 이동 수단 아이콘, 이동 거리. 맨 위에는 “총 거리”가 있어요.',
  'help.guide.map-whole-trip.step.3':
    '카드에서 일자를 클릭하면 선택돼요. 그 행이 음영 처리되고 일자 열에서 그날이 열려요. 도시 위에서 마우스 휠을 굴려 확대하면 그 도시를 지나는 날들이 각자의 색으로 나란히 보여요.',
  'help.guide.map-whole-trip.step.4': '이제 버튼이 “전체 여행 숨기기”로 바뀌어요. 클릭하면 다시 열린 일자만 보여요.',
  'help.guide.map-whole-trip.result':
    '이동하는 날마다 다른 색으로 그려지고, 카드에 날마다 이동 거리와 여행 전체 합계가 나와요.',
  'help.guide.map-whole-trip.tip.1':
    '합계는 몇 구간씩 차례로 계산돼요. 뒤에 …가 보이는 동안은 부분 합계이고, 모든 구간이 계산되면 확정돼요.',
  'help.guide.map-whole-trip.tip.2':
    '라우터가 계산하지 못한 구간은 직선으로 남고 합계에 들어가지 않아요. 카드에서 알려 주니, 아무 경고 없이 합계가 작아 보이지는 않아요.',
  'help.guide.map-whole-trip.tip.3':
    '위치가 있는 일정이 두 개 미만이고 숙소를 오가는 이동도 없는 날은 그릴 경로가 없어서 카드에 아예 나오지 않아요.',
  // map-booking-routes
  'help.guide.map-booking-routes.title': '예약 경로를 지도에 표시하기',
  'help.guide.map-booking-routes.goal': '예약한 항공편, 기차, 자동차 이동을 지도에 표시하고 다시 지워요.',
  'help.guide.map-booking-routes.step.1':
    '예약 경로는 켜기 전까지 꺼져 있어요. 일자 열의 교통 행 오른쪽 끝에 작은 경로 아이콘 “예약 경로 표시”가 있어요.',
  'help.guide.map-booking-routes.step.2':
    '클릭하면 예약이 지도에 나타나요: 항공편은 대권 항로 곡선으로, 차량 이동은 실제 도로를 따라, 기차는 역을 잇는 선으로. ‘확정됨’은 실선, ‘대기 중’은 점선이고, 양 끝은 교통 아이콘이 든 파란 버튼이에요.',
  'help.guide.map-booking-routes.step.3':
    '끝 버튼을 클릭하면 예약 상세 정보가 열려요: 색이 있는 헤더에 상태, 유형, 날짜 버튼, 양 끝 시간, 그 아래 나머지 정보, 맨 아래에 이 경로를 다시 끄는 ‘지도에서’, 대중교통 연결이면 ‘경로 변경’, 예약을 삭제하는 휴지통, ‘편집’이 있어요. 헤더의 X로 닫아요.',
  'help.guide.map-booking-routes.step.4':
    '날 목록 위 도구 모음의 경로 아이콘은 여행 전체에 한 번에 적용돼요: ‘모든 예약 경로 표시’는 경로가 있는 모든 예약을 그려요.',
  'help.guide.map-booking-routes.step.5':
    '이 버튼은 이전 선택을 대신해서, 예약마다 하나씩 켠 경로가 초기화돼요. 버튼이 ‘모든 예약 경로 숨기기’로 바뀌었으니, 다시 누르면 모든 예약 경로가 숨겨져요.',
  'help.guide.map-booking-routes.result':
    '선택한 예약이 지도에 그려지고, 이 선택은 바꾸기 전까지 이 브라우저에서 이 여행에 유지돼요.',
  'help.guide.map-booking-routes.tip.1':
    '‘설정’ > ‘화면’의 ‘여행 및 지도’에서 ‘예약 경로 레이블’을 켜야 양 끝에 공항 코드나 역 이름이 보이고, 아니면 아이콘만 보여요.',
  'help.guide.map-booking-routes.tip.2':
    '같은 섹션의 ‘예약 경로 항상 표시’를 켜면, 아직 직접 정하지 않은 모든 여행에서 처음부터 예약 경로가 보여요.',
  'help.guide.map-booking-routes.tip.3':
    '예약을 지도에 그리려면 좌표가 있는 출발지와 도착지가 필요해요. 그래서 호텔이나 식당에는 경로 아이콘이 없어요.',
  // map-dawarich-trail
  'help.guide.map-dawarich-trail.title': '실제로 다닌 경로 보기',
  'help.guide.map-dawarich-trail.goal':
    'Dawarich가 휴대폰으로 기록한 경로를 계획한 경로 옆에 점선으로 지도에 표시하고, 여행이 실제로 어떻게 진행됐는지 날마다 확인해요.',
  'help.guide.map-dawarich-trail.step.1':
    '둥근 Dawarich 버튼은 지도 오른쪽 아래 ‘전체 여행 보기’ 밑에 있어요. 마우스를 올리면 ‘기록된 경로 표시’가 보여요. 클릭하세요. TREK가 Dawarich에 여행 기간의 데이터를 요청하고, 응답을 기다리는 동안 버튼 둘레에 링이 돌아요.',
  'help.guide.map-dawarich-trail.step.2':
    '기록된 경로가 날마다 다른 색 점선으로 보이고, 계획이 잘 보이도록 계획한 경로 아래에 그려져요. 버튼이 ‘기록된 경로 숨기기’로 바뀌어요. 하루는 현지 자정에 끝나요. 날 열에서 날을 접으면 그날 점선과 들를 곳이 지도에서 숨겨져요.',
  'help.guide.map-dawarich-trail.step.3':
    '‘전체 여행 보기’도 클릭하면, 계획한 모든 날이 점선 기록 옆에 실선으로 그려져요. 두 선이 겹치는 곳은 계획대로 간 거고, 점선이 계획 경로를 벗어나는 곳은 아니었던 거예요.',
  'help.guide.map-dawarich-trail.result':
    '계획한 경로와 실제로 이동한 경로가 점선과 실선으로 지도에 함께 표시돼요. 버튼 위 카드에는 여전히 계획한 일자와 거리가 나와요.',
  'help.guide.map-dawarich-trail.tip.1':
    '켜고 끈 상태는 여행마다 계정에 저장되어 모든 브라우저와 기기에서 같아요. 경로가 켜져 있으면 TREK이 2분마다 Dawarich에서 다시 가져오므로 진행 중인 여행이 새로 고침 없이 업데이트돼요. 경로 자체는 저장되지 않아서 TREK 데이터베이스와 백업에 없고 오프라인에서도 볼 수 없어요.',
  'help.guide.map-dawarich-trail.tip.2':
    '버튼의 라벨로 지도가 비어 있는 이유를 알 수 있어요: 불러오는 동안에는 “기록된 경로를 불러오는 중…”, 그 밖에 “해당 날짜에 기록된 내용이 없습니다”, “기록된 경로를 불러올 수 없습니다”, TREK이 오프라인이면 “기록된 경로를 보려면 연결이 필요합니다”.',
  // map-compass
  'help.guide.map-compass.title': '지도 회전하고 북쪽 다시 맞추기',
  'help.guide.map-compass.goal': '가는 방향에 맞춰 지도를 돌리고, 클릭 한 번으로 다시 북쪽으로 돌려요.',
  'help.guide.map-compass.step.1':
    '오른쪽 버튼으로 끌거나 Ctrl을 누른 채 왼쪽 버튼으로 끌어 지도를 돌려요. 터치스크린에서는 두 손가락으로 돌려요. 지도 위쪽 카테고리 아이콘 줄 옆의 둥근 나침반도 함께 돌아가요: 화살표가 항상 북쪽을 가리켜서 지도와 같은 각도로 기울어요.',
  'help.guide.map-compass.step.2':
    '나침반을 클릭하세요. 버튼 이름처럼 ‘북쪽으로 초기화’가 지도를 북쪽이 위로 오게 돌리고, 화면을 다시 평평하게 하며, 화살표도 다시 위를 가리켜요.',
  'help.guide.map-compass.result':
    '지도가 다시 북쪽을 향하고 수평으로 돌아와요. 나침반은 보기만 바꾸므로 여행 내용은 그대로예요.',
  'help.guide.map-compass.tip.1':
    '나침반은 MapLibre GL과 Mapbox GL 지도에만 있어요. Leaflet 지도는 회전할 수 없어서 나침반이 없어요. 어떤 지도를 쓸지는 “설정”의 “지도”에서 “지도 공급자”로 정하고, “지도 저장”으로 저장해요.',
  'help.guide.map-compass.tip.2':
    '클릭하면 기울기도 없어져요. 오른쪽 마우스 버튼으로 위아래로 드래그하면 보기가 기울고, Reset north를 누르면 수평이 되고 회전도 초기화돼요. Mapbox GL에서 “3D 건물 및 지형”이 켜져 있으면 다시 기울일 때까지 3D 보기도 평평해져요.',

  // ── Screen: trip-collab ───────────────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': '협업',
  'help.ctx.trip-collab.summary':
    '그룹이 함께 계획하는 탭이고, 카드 다섯 개로 되어 있어요: 왼쪽에 채팅, 그 옆에 ‘메모’와 ‘링크’, 그 아래 ‘투표’와 ‘다음 할 일’. 여기 쓴 내용은 새로 고침 없이 다른 모든 멤버의 화면에 바로 나타나요.',
  'help.ctx.trip-collab.bullet.1':
    '채팅은 왼쪽 카드예요. “메시지 입력...”에 입력하고 Enter를 누르세요. Shift와 Enter를 함께 누르면 줄이 바뀌어요. 스마일 아이콘으로 이모지를 넣고, “이미지 첨부”로 메시지에 사진을 최대 네 장까지 붙일 수 있어요.',
  'help.ctx.trip-collab.bullet.2':
    '메시지에 마우스를 올리면 “답장”이, 내 메시지에는 “삭제”도 나와요. 오른쪽 클릭하면 빠른 반응 여덟 가지가 나와요. 삭제한 메시지 자리에는 누가 삭제했는지 알려 주는 안내가 남아요.',
  'help.ctx.trip-collab.bullet.3':
    '‘메모’는 함께 쓰는 메모 공간이에요. 헤더의 ‘새 메모’로 메모를 만들고, 옆의 톱니바퀴로 ‘카테고리 관리’를 열어 이름과 색을 정해요. 카테고리가 생기면 헤더 아래 버튼 줄로 카드를 걸러요: ‘전체’ 또는 카테고리 하나. 메모 카드에는 카테고리가 색 점으로, 링크가 둥근 버튼으로 보이고, 점 세 개(‘추가 옵션’)에 ‘펼치기’, ‘고정’, ‘편집’, ‘삭제’가 있어요.',
  'help.ctx.trip-collab.bullet.4':
    '“링크”에는 여행에 필요한 웹 주소를 모아요. “링크 추가”에 제목과 http 또는 https 주소를 입력하세요. 칩 끝에 “링크 편집”, “링크 고정”, “링크 삭제”가 있고, 고정한 링크는 맨 앞에 남아요.',
  'help.ctx.trip-collab.bullet.5':
    '투표로 결정을 내려요. “새 투표”로 선택지가 두 개 이상인 질문을 만들고, 선택지를 클릭하면 투표돼요. 투표 헤더 오른쪽의 자물쇠(“닫기”)와 휴지통(“삭제”)으로 투표를 마감하거나 삭제해요.',
  'help.ctx.trip-collab.bullet.6':
    '‘다음 할 일’에 여행에서 아직 남은 들를 곳이 최대 8개까지 시간, 함께하는 사람과 함께 나와요. 일정만 읽어 오고, 시간은 일정에서 정해요.',
  // write-note
  'help.guide.write-note.title': '함께 보는 메모 쓰기',
  'help.guide.write-note.goal': '규칙, 주소, 알림처럼 그룹 전체에 필요한 내용을 모두가 찾을 수 있는 곳에 둬요.',
  'help.guide.write-note.step.1':
    '“메모” 카드 헤더의 “새 메모”를 클릭하세요. 메모 대화 상자가 열리고 커서가 제목 입력란에 놓여 있어요.',
  'help.guide.write-note.step.2':
    '대화 상자 맨 위 “메모 제목”에 제목을 입력하세요. 필수 항목은 제목뿐이에요. 제목을 입력하기 전에는 “생성”이 회색으로 비활성화되어 있고, 제목에서 Enter를 누르면 메모가 바로 만들어져요.',
  'help.guide.write-note.step.3':
    '“내용”에 본문을 쓰고, Markdown으로 굵은 글씨, 목록, 제목을 넣을 수 있어요. 카드에는 처음 세 줄이 보이고, 메뉴의 “펼치기”로 메모 전체를 열 수 있어요.',
  'help.guide.write-note.step.4':
    '‘카테고리’에서 메모가 속할 카테고리를 고르세요. 그 색이 지금은 창 헤더에, 나중에는 카드 헤더에 쓰여요. 첫 번째 카테고리가 미리 선택돼 있어요. 버튼은 이미 있는 카테고리이고, 새 카테고리는 ‘카테고리 관리’에서 만들어요. 여행에 카테고리가 아직 없으면 이 줄은 없어요.',
  'help.guide.write-note.step.5':
    '“웹사이트”에는 메모와 관련된 링크를 넣어요. 그러면 카드 위쪽에 링크를 여는 둥근 버튼이 생겨요.',
  'help.guide.write-note.step.6':
    '‘생성’을 클릭하세요. 창은 ‘취소’와 X로만 닫혀서, 바깥을 클릭하거나 Esc를 눌러도 쓴 내용이 사라지지 않아요.',
  'help.guide.write-note.result':
    '메모가 ‘메모’ 패널에 카테고리 색의 헤더를 단 카드로 생기고, 다른 모든 멤버에게도 바로 보여요.',
  'help.guide.write-note.tip.1':
    '카드의 점 세 개(‘추가 옵션’)에 ‘펼치기’, ‘고정’, ‘편집’, ‘삭제’가 있어요. ‘고정’하면 메모가 카테고리 색 테두리와 함께 패널 맨 위에 있어요. 나머지 메모는 마지막으로 바뀐 순서로 정렬돼요.',
  'help.guide.write-note.tip.2':
    '“새 메모” 옆 톱니바퀴를 누르면 “카테고리 관리”가 열려요. 여기서 카테고리에 색을 지정하거나, 이름을 모든 곳에서 한 번에 바꾸거나, 메모에 쓰기 전에 미리 추가할 수 있어요. “저장”을 클릭해야 변경 사항이 적용돼요.',
  'help.guide.write-note.tip.3':
    '여행에 파일을 올릴 권한이 있으면 ‘파일 첨부’로 메모에 문서를 붙여요. ‘첨부’를 누르면 파일 선택 창이 열리고, 이미지나 PDF를 창에 붙여 넣을 수도 있어요.',
  'help.guide.write-note.tip.4':
    '“메모”는 “애드온”의 Collab 아래에 별도 스위치가 있어요. 관리자가 메모만 꺼도 채팅, 링크, 투표, What’s Next는 계속 쓸 수 있어요.',
  // shared-links
  'help.guide.shared-links.title': '여행 링크 모으기',
  'help.guide.shared-links.goal': '예약 사이트, 공유 앨범, 시간표를 한곳에 모아 채팅에서 찾을 필요가 없게 해요.',
  'help.guide.shared-links.step.1':
    '‘링크’ 카드 헤더의 ‘링크 추가’를 클릭하세요. 창이 열리고 맨 위 칸에 커서가 있어요.',
  'help.guide.shared-links.step.2':
    '‘링크 제목’에 이름을 입력하고, 그 아래 ‘링크’에 주소를 붙여 넣은 뒤 ‘링크 저장’을 클릭하세요.',
  'help.guide.shared-links.step.3': '칩에 이름과 연결된 웹사이트가 보여요. 클릭하면 새 탭에서 페이지가 열려요.',
  'help.guide.shared-links.step.4':
    '끝에 있는 둥근 버튼 세 개는 “링크 편집”, “링크 고정”, “링크 삭제”예요. “링크 고정”은 칩을 패널 맨 앞으로 옮기고 강조색으로 표시해요. “링크 삭제”는 모든 멤버에게서 링크가 사라지기 때문에 먼저 확인을 받아요.',
  'help.guide.shared-links.result': '링크가 “링크” 패널 맨 앞에 칩으로 고정되고, 모든 멤버 화면에 바로 나타나요.',
  'help.guide.shared-links.tip.1':
    'http나 https 주소만 받아요. 다른 주소는 거부되고, 입력한 내용이 그대로 든 채 대화 상자가 열려 있어요.',
  'help.guide.shared-links.tip.2':
    '고정한 링크가 먼저, 그다음은 최신순이에요. 제목 옆 작은 아이콘은 사이트에서 직접 불러오는 파비콘이라, 인터넷이 없으면 대신 기본 링크 아이콘이 표시돼요.',
  'help.guide.shared-links.tip.3':
    '‘링크’는 ‘애드온’에서 협업 아래에 따로 스위치가 있어서, 관리자가 탭의 나머지는 두고 이 패널만 끌 수 있어요.',
  // create-poll
  'help.guide.create-poll.title': '그룹에 물어보기',
  'help.guide.create-poll.goal': '채팅에서 아무도 답하지 않는 질문을 모두가 투표할 수 있는 투표로 만들어요.',
  'help.guide.create-poll.step.1': '“투표” 카드 헤더의 “새 투표”를 클릭하세요. 대화 상자가 열려요.',
  'help.guide.create-poll.step.2':
    '“질문” 아래에 질문을 쓰세요. 입력란 아래 “Markdown 지원”은 굵은 글씨, 줄바꿈, 짧은 목록을 쓸 수 있다는 뜻이에요.',
  'help.guide.create-poll.step.3':
    '“옵션” 아래 “옵션 1”과 “옵션 2”를 채우세요. 내용이 있는 선택지가 최소 두 개 필요하고, 선택지 하나에 여러 줄을 써도 돼요.',
  'help.guide.create-poll.step.4':
    '그 아래 “옵션 추가”로 세 번째, 네 번째 선택지를 필요한 만큼 추가해요. 선택지가 두 개보다 많아지면 행 옆에 작은 X가 나타나고, 누르면 그 선택지가 삭제돼요.',
  'help.guide.create-poll.step.5':
    '‘복수 선택’을 켜면 모두 옵션을 여러 개 고를 수 있어요. 끄면 다른 옵션을 고를 때 표가 그쪽으로 옮겨 가요.',
  'help.guide.create-poll.step.6': '‘투표 만들기’를 클릭하세요.',
  'help.guide.create-poll.result': '‘투표’ 패널 맨 위에 투표가 열린 상태로 생기고, 헤더에 0표가 보여요.',
  'help.guide.create-poll.tip.1': '질문은 Markdown으로 표시되고, 선택지는 일반 텍스트로 표시돼요.',
  'help.guide.create-poll.tip.2': '질문과 내용이 있는 선택지가 두 개 이상 있어야 “투표 만들기”가 활성화돼요.',
  'help.guide.create-poll.tip.3':
    '마감 시간은 휴대폰 앱에서만 정할 수 있어요. 마감 시간이 있는 투표는 헤더에 남은 시간이 주황색 칩으로 표시되고, 시간이 다 되면 마감돼요.',
  'help.guide.create-poll.tip.4':
    '“투표”는 “애드온”의 Collab 아래에 별도 스위치가 있어요. 관리자가 투표만 꺼도 나머지 네 패널은 계속 쓸 수 있어요.',
  // vote-poll
  'help.guide.vote-poll.title': '투표하고 결과 보기',
  'help.guide.vote-poll.goal': '투표하고, 그룹의 결과를 보고, 투표를 바꿔요.',
  'help.guide.vote-poll.step.1':
    '원하는 옵션을 클릭하세요. 동그라미에 체크가 생기고, 옵션에 강조 색 테두리가 생기며, 뒤의 막대가 늘어나요.',
  'help.guide.vote-poll.step.2':
    '이제 전체 결과를 볼 수 있어요. 막대는 비율, 오른쪽 숫자는 퍼센트이고, 작은 동그라미는 그 선택지를 고른 사람이에요. 최대 세 명까지 표시돼요.',
  'help.guide.vote-poll.step.3':
    '마음이 바뀌었나요? 다른 선택지를 클릭하세요. “복수 선택”이 아닌 투표에서는 표가 하나 더 생기지 않고 새 선택지로 옮겨 가요.',
  'help.guide.vote-poll.step.4':
    '투표 수는 질문 아래 칩에 나와요. 이미 고른 선택지를 다시 클릭하면 내 표가 취소되고 숫자가 줄어요.',
  'help.guide.vote-poll.result':
    '내가 고른 선택지에 체크가 표시되고, 막대로 그룹의 투표 결과를, 동그라미로 누가 무엇을 골랐는지 보여 줘요.',
  'help.guide.vote-poll.tip.1':
    '비율과 누가 무엇에 투표했는지는 내가 투표했거나 투표가 마감된 뒤에만 보여요. 헤더의 투표 수는 누구에게나 보여요.',
  'help.guide.vote-poll.tip.2': '투표는 익명이 아니에요. 옵션의 동그라미에 마우스를 올리면 투표한 사람 이름이 보여요.',
  // close-poll
  'help.guide.close-poll.title': '투표 마감하거나 삭제하기',
  'help.guide.close-poll.goal': '그룹이 결정하면 투표를 마감하고, 더 필요 없는 투표는 삭제해요.',
  'help.guide.close-poll.step.1':
    '투표 헤더 오른쪽의 자물쇠 “닫기”를 누르면 투표가 마감돼요. 더 이상 선택지를 누를 수 없어요.',
  'help.guide.close-poll.step.2':
    '마감한 투표는 패널 맨 아래로 내려가고, 위에 진행 중인 투표가 있으면 ‘종료됨’ 제목 아래에 놓여요. ‘종료됨’ 칩이 붙고, 투표했든 안 했든 모두에게 결과가 보여요. 1위 옵션은 초록 막대에 굵게 표시되고, 내가 고른 옵션이라면 막대가 내 강조 색으로 보여요.',
  'help.guide.close-poll.step.3':
    '헤더 오른쪽의 휴지통 “삭제”를 누르면 투표가 삭제돼요. 마감된 투표에서는 자물쇠가 사라져서 이 버튼만 남아요. 확인 없이 바로 삭제되고, 투표 기록도 함께 삭제돼요.',
  'help.guide.close-poll.result':
    '삭제한 투표는 모든 멤버의 패널에서 사라져요. 마감만 한 투표는 결과와 함께 맨 아래에 계속 표시돼요.',
  'help.guide.close-poll.tip.1':
    '마감은 되돌릴 수 없어요. 다시 여는 기능이 없으니, 실수로 마감했다면 새로 투표를 만들어야 해요.',
  'help.guide.close-poll.tip.2': '‘삭제’는 투표와 모든 표를 모두에게서 확인 없이 바로 삭제해요.',
  // whats-next
  'help.guide.whats-next.title': '‘다음 할 일’ 보기',
  'help.guide.whats-next.goal': '계획을 열지 않고도 그룹의 다음 일정을 확인해요.',
  'help.guide.whats-next.step.1':
    '카드에는 앞으로의 여행 일정이 최대 여덟 개까지 시간순으로 나와요. 일자마다 “오늘”, “내일” 또는 날짜가 제목으로 붙고, 그날에 제목이 있으면 옆에 함께 표시돼요. 헤더에 일정 개수가 나와요.',
  'help.guide.whats-next.step.2':
    '일정마다 왼쪽에 시간이 나와요: 시작 시각, 종료 시각이 있으면 “까지”와 함께 종료 시각, 시간이 아직 정해지지 않았으면 TBD.',
  'help.guide.whats-next.step.3':
    '옆에는 이름, 주소, 그 일정에 가는 사람이 칩으로 나와요. 일정에 지정된 사람이 없으면 여행 멤버 전원이 표시돼요.',
  'help.guide.whats-next.result':
    '앞으로의 일정을 읽기 전용 목록으로 보여 줘요. 계획을 따를 뿐, 여기서는 아무것도 바뀌지 않아요.',
  'help.guide.whats-next.tip.1':
    '여기서 정하는 건 없어요. 시간은 일정에서 가져와서, 일정에서 바꾸면 이 목록도 바로 바뀌어요.',
  'help.guide.whats-next.tip.2':
    '아직 남은 것만 나와요: 시작 시간이 지난 들를 곳은 빠지고, 시간 없는 오늘의 들를 곳은 하루가 끝날 때까지 남으며, 여행이 끝나면 패널은 비어요.',
  'help.guide.whats-next.tip.3':
    '‘다음 할 일’은 ‘애드온’에서 협업 아래에 따로 스위치가 있어요. 데스크톱 패널이라 휴대폰 앱의 협업 탭에는 없어요.',
  // trip-chat
  'help.guide.trip-chat.title': '그룹과 대화하기',
  'help.guide.trip-chat.goal': '메시지를 보내고, 특정 메시지에 답장하고, 다른 메시지에 반응하고, 내 메시지를 삭제해요.',
  'help.guide.trip-chat.step.1':
    '“메시지 입력...”에 입력하고 Enter를 누르세요. 입력란 옆 둥근 화살표를 눌러도 돼요. Shift와 Enter를 함께 누르면 대신 줄이 바뀌어요.',
  'help.guide.trip-chat.step.2':
    '스마일 아이콘을 누르면 Smileys, Reactions, Travel이 있는 이모지 선택기가 열려요. 고른 이모지는 쓰고 있는 글에 추가될 뿐, 따로 전송되지 않아요.',
  'help.guide.trip-chat.step.3':
    '다른 사람의 메시지에 마우스를 올리면 모서리에 작은 둥근 버튼이 나타나요. 그게 ‘답장’이에요.',
  'help.guide.trip-chat.step.4':
    '답장할 메시지가 입력창 위에 인용돼요. 메시지를 써서 보내면 인용도 함께 전송돼요. 인용의 X를 클릭하면 인용이 빠져요.',
  'help.guide.trip-chat.step.5':
    '메시지를 오른쪽 클릭하면 빠른 반응 여덟 개가 보여요. 내 반응은 메시지 아래에 나타나요. 같은 반응을 다시 클릭하면 취소돼요.',
  'help.guide.trip-chat.step.6':
    '내가 보낸 메시지에는 “답장” 옆에 휴지통 아이콘 “삭제”가 있어요. 누르면 메시지가 바로 삭제되고, 내가 삭제했다는 안내가 남아요. 되돌릴 수 없어요.',
  'help.guide.trip-chat.result':
    '내 답장이 가장 최근 메시지가 되고, 맨 위에 인용한 메시지가 표시돼요. 내 반응은 상대 메시지 아래에 나타나요. 삭제한 메시지 자리에는 내가 삭제했다는 안내가 남아요.',
  'help.guide.trip-chat.tip.1':
    'Enter는 전송, Shift와 Enter는 줄바꿈이에요. 이모지 한 개에서 세 개만 있는 메시지는 크게 표시돼요.',
  'help.guide.trip-chat.tip.2':
    '“이미지 첨부”로 메시지 하나에 사진을 최대 네 장까지 붙일 수 있어요. 입력란에 붙여 넣거나 드래그해서 놓아도 돼요.',
  'help.guide.trip-chat.tip.3':
    '링크가 있는 메시지 아래에는 미리보기 카드가 붙어요. 내 TREK가 직접 가져오기 때문에, 나만 접근할 수 있는 링크는 일반 링크로 남아요.',
  'help.guide.trip-chat.tip.4':
    '채팅은 ‘애드온’에서 협업 아래에 따로 스위치가 있어요. 관리자가 채팅만 끄고 메모, 링크, 투표, ‘다음 할 일’은 켜 둘 수 있어요.',

  // ── Screen: trip-lists ────────────────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': '목록',
  'help.ctx.trip-lists.summary':
    '한 여행에 목록이 두 개 있어요. 누가 무엇을 가져가고 무게가 얼마인지 담는 짐 목록, 그리고 여행 전과 여행 중에 해야 할 일을 모두 적는 할 일 목록이에요. 이 탭은 “목록” 애드온이 켜져 있을 때만 나와요.',
  'help.ctx.trip-lists.bullet.1':
    '위쪽 바의 ‘짐 목록’과 ‘할 일’로 둘 사이를 오가고, 각각 항목 수가 보여요. 바 오른쪽 끝 버튼은 열려 있는 쪽에 해당해요.',
  'help.ctx.trip-lists.bullet.2':
    '짐 목록은 ‘문서’나 ‘의류’처럼 원하는 이름을 붙인 목록으로 나뉘어요. 목록마다 카드 하나예요. 헤더에는 목록 전체를 다른 위치로 끌어 옮기는 손잡이, 색 점, 챙긴 개수/전체 배지, ‘이름 바꾸기’, ‘전체 체크’, ‘전체 체크 해제’, ‘목록 삭제’가 든 점 세 개, 카드를 접는 화살표가 있어요. 위쪽 바의 ‘목록 추가’로 새 목록을 만들어요.',
  'help.ctx.trip-lists.bullet.3':
    '한 줄에는 끌기 손잡이, 체크박스, 이름이 있고, 이어서 그 물건을 챙길 사람의 작은 아바타가 있어요. 수량이 2 이상이면 3/10 같은 챙김 카운터와 빼기, 더하기 버튼도 붙어요. 그다음 작은 배지로 수량이, ‘가방 추적’이 켜져 있으면 그램 단위 무게와 가방 동그라미가 나오고, 끝으로 휴지통과 ‘목록으로 이동’, ‘공유’, ‘이름 바꾸기’, ‘삭제’가 든 점 세 개 메뉴가 있어요. 쓰지 않는 컨트롤은 마우스를 올리기 전까지 흐리게 보여요.',
  'help.ctx.trip-lists.bullet.4':
    '‘공유됨’과 ‘내 목록’으로 짐 목록이 둘로 나뉘어요: 모두가 보는 목록과 내 개인 목록. 옆의 ‘전체’, ‘미결’, ‘완료’로 열린 쪽을 걸러요. 줄 맨 끝의 ‘가나다순’은 각 목록의 항목을 이름순으로 보여 주고, 다시 클릭하면 내 순서로 돌아가요. 위쪽 진행 카드에서 챙긴 개수를 세요.',
  'help.ctx.trip-lists.bullet.5':
    '‘템플릿 적용’과 ‘템플릿으로 저장’으로 목록을 채우거나 저장해서 일일이 입력하지 않아도 돼요. 그 뒤 아이콘 두 개 ‘내보내기’와 ‘가져오기’로 목록을 인쇄물, PDF, 파일로 내보내거나 가져와요. 진행 카드 오른쪽 끝 빨간 버튼에 체크한 항목 수가 보이고, 누르면 그 항목들을 삭제해요.',
  'help.ctx.trip-lists.bullet.6':
    '‘할 일’에는 사이드바가 따로 있어요: 진행 카드, ‘전체’, ‘내 작업’, ‘기한 초과’, ‘완료’ 필터, 목록마다 한 줄, 그 아래 ‘목록 추가’. 할 일은 카드 안에 있고, 카드 헤더에 필터 이름과 정렬 순서(‘우선순위’ 또는 ‘마감일’)가 보여요. 할 일을 클릭하면 오른쪽 창에서 열려요. 바의 ‘새 작업 추가’로 ‘새 작업’ 창을 열어요.',
  // packing-categories
  'help.guide.packing-categories.title': '짐 목록 만들기',
  'help.guide.packing-categories.goal': '챙길 물건을 목록으로 묶고, 항목을 추가하고, 목록마다 담당자를 정해요.',
  'help.guide.packing-categories.step.1':
    '목록 위 바에서 “목록 추가”를 클릭하세요. 작은 대화 상자가 열리면 맨 위 “목록 이름 (예: 의류)” 자리에 이름을 입력하고 “추가”를 클릭하세요.',
  'help.guide.packing-categories.step.2':
    '새 목록은 흐린 점 세 개만 보이는 빈 행으로 시작해요. 행 아래 “항목 추가”를 클릭하고 “항목 이름...”에 항목을 입력한 뒤 Enter를 누르세요. 첫 항목이 빈 행을 대신하고, 다음 항목을 넣을 수 있게 입력란이 열린 채로 있어요.',
  'help.guide.packing-categories.step.3': '줄 이름을 클릭하거나, 오른쪽 끝 점 세 개의 ‘이름 바꾸기’로 이름을 바꾸세요.',
  'help.guide.packing-categories.step.4':
    '목록 위쪽 띠의 사람 아이콘이 있는 점선 원으로 여행 멤버를 목록에 배정해요. 이름을 고르세요. 다시 빼려면 나타난 칩을 클릭하세요.',
  'help.guide.packing-categories.step.5':
    '개수 옆 점 세 개에 옵션이 더 있어요: ‘이름 바꾸기’, ‘전체 체크’, ‘전체 체크 해제’, ‘목록 삭제’. ‘목록 삭제’는 다시 묻지 않고 목록과 그 안의 항목을 모두 삭제해요. 맨 오른쪽 화살표로 목록을 접어요.',
  'help.guide.packing-categories.result':
    '새 목록이 색 점과 함께 격자에 나타나고 그 아래에 항목이 표시돼요. 배지에는 이미 챙긴 개수가 나와요.',
  'help.guide.packing-categories.tip.1':
    '목록은 항목이 있어야 존재해요. 마지막 항목을 삭제하면 그 행이 빈 자리로 바뀌어 목록의 위치와 색이 유지되고, 그 행까지 삭제하면 목록이 삭제돼요.',
  'help.guide.packing-categories.tip.2':
    '목록에 담당자를 지정하면 그 사람에게 짐 알림이 가요. 항목을 볼 수 있는 사람은 바뀌지 않아요. 그건 행의 점 세 개 메뉴에 있는 “공유”에서 정해요.',
  'help.guide.packing-categories.tip.3':
    '두 목록의 이름이 같아도 돼요. TREK이 내부적으로 구분하므로 이름은 입력한 그대로 유지돼요.',
  // check-off-packing
  'help.guide.check-off-packing.title': '짐 싸면서 체크하기',
  'help.guide.check-off-packing.goal': '가방에 넣은 것을 표시하고, 진행 막대를 확인하고, 챙긴 항목을 정리해요.',
  'help.guide.check-off-packing.step.1': '줄 왼쪽의 상자를 클릭하세요. 이름에 취소선이 그어지고 진행 막대가 바뀌어요.',
  'help.guide.check-off-packing.step.2':
    '목록 위 진행 카드에서 전체 항목 중 몇 개를 챙겼는지 숫자, 퍼센트, 막대로 보여 줘요.',
  'help.guide.check-off-packing.step.3':
    '목록 전체를 한 번에 체크하려면 목록 헤더의 점 세 개 메뉴에서 “전체 체크”나 “전체 체크 해제”를 고르세요.',
  'help.guide.check-off-packing.step.4':
    '“공유됨”과 “내 목록” 옆의 “전체”, “미결”, “완료”로 격자를 필터링해요. “미결”은 아직 챙기지 않은 것만 보여 주므로, 다 챙긴 목록은 숨겨져요.',
  'help.guide.check-off-packing.step.5':
    '진행 카드 오른쪽 끝에 체크한 항목 수가 적힌 빨간 ‘… 체크된 항목 삭제’ 버튼을 누르면, 브라우저에서 한 번 확인한 뒤 모두 한꺼번에 삭제해요.',
  'help.guide.check-off-packing.result': '남은 항목만 표시되고, 위쪽 막대에 짐을 얼마나 쌌는지 나와요.',
  'help.guide.check-off-packing.tip.1': '체크한 항목도 이름을 클릭하면 바꿀 수 있어요.',
  'help.guide.check-off-packing.tip.2': '‘전체 체크’와 ‘전체 체크 해제’는 그 목록의 점 세 개에서 한 목록에만 적용돼요.',
  'help.guide.check-off-packing.tip.3': '모든 항목을 체크하면 카운터가 ‘모두 완료!’로 바뀌고 막대가 초록색이 돼요.',
  // apply-packing-template
  'help.guide.apply-packing-template.title': '짐 목록 템플릿 적용하기',
  'help.guide.apply-packing-template.goal':
    '미리 만든 목록을 여행에 추가하고, 이번 여행의 목록을 다음 여행을 위해 저장해요.',
  'help.guide.apply-packing-template.step.1': '목록 위 바에서 “템플릿 적용”을 클릭하세요.',
  'help.guide.apply-packing-template.step.2': '템플릿을 고르세요. 줄마다 이름과 항목 수가 나와요.',
  'help.guide.apply-packing-template.step.3':
    '항목은 지금 보고 있는 화면에 추가돼요: ‘공유됨’이면 모두가 보는 공유 목록에, ‘내 목록’이면 내 목록에 들어가요.',
  'help.guide.apply-packing-template.step.4':
    '이번 여행 목록을 다음 여행에도 쓰려면 ‘템플릿으로 저장’을 클릭하세요. 작은 창이 열려요. 위쪽 ‘템플릿 이름’ 칸에 이름을 입력하고 ‘저장’을 클릭하세요.',
  'help.guide.apply-packing-template.result': '템플릿의 목록과 항목이 기존 항목 옆에 여행으로 추가돼요.',
  'help.guide.apply-packing-template.tip.1':
    '템플릿은 항목마다 목록, 수량, 무게, 가방을 복사하고, 여행에 없는 가방은 새로 만들어요. 체크 표시는 복사되지 않고, 목록에 이미 있는 항목은 삭제되지 않아요.',
  'help.guide.apply-packing-template.tip.2':
    '“템플릿 적용”은 템플릿이 있어야 나타나요. 템플릿이 없으면 버튼 자체가 보이지 않아요.',
  'help.guide.apply-packing-template.tip.3':
    '“템플릿으로 저장”은 인스턴스 관리자에게만, 목록에 항목이 있을 때만 나타나요. 공유 항목과 내 항목을 저장하고, 다른 멤버의 비공개 항목은 저장하지 않아요.',
  // import-packing-list
  'help.guide.import-packing-list.title': '짐 목록 통째로 붙여넣기',
  'help.guide.import-packing-list.goal': '다른 곳에 있던 목록을 한 번에 짐 항목으로 바꿔요.',
  'help.guide.import-packing-list.step.1': '목록 위 바 오른쪽 끝의 아래쪽 화살표 아이콘 ‘가져오기’를 클릭하세요.',
  'help.guide.import-packing-list.step.2':
    '한 줄에 항목 하나: 카테고리, 이름, 무게(g, 선택), 가방(선택), checked/unchecked(선택). 상자 안 회색 예시에 네 가지 형식이 모두 보이고, 왼쪽 숫자는 입력한 줄 수예요. Markdown 목록도 돼요: 제목이 목록 이름이 되고, "- [ ]"와 "- [x]"가 항목이 돼요.',
  'help.guide.import-packing-list.step.3':
    '또는 창 왼쪽 아래 ‘CSV/TXT/MD 불러오기’로 파일에서 줄을 불러오세요. .csv, .txt, .md 파일을 받고, 상자 안의 내용을 대체해요.',
  'help.guide.import-packing-list.step.4': '오른쪽 아래의 “3개 가져오기”를 클릭하세요. 숫자는 TREK이 인식한 줄 수예요.',
  'help.guide.import-packing-list.result':
    '줄마다 한 행이 되어 첫 번째 칸에 적힌 목록에 들어가요. 이미 있던 항목은 바뀌지 않아요.',
  'help.guide.import-packing-list.tip.1':
    '쉼표, 세미콜론, 탭으로 칸을 나누고, 큰따옴표로 묶으면 한 칸이 돼요. 그래서 "Shirt, blue"는 이름 하나로 들어가요. 값이 하나뿐인 줄은 이름만 있는 항목이에요. 목록이 지정되지 않은 줄은 “기타”에 들어가요. 이름 앞에 "3x"를 붙이면 수량이 정해져요.',
  'help.guide.import-packing-list.tip.2':
    '네 번째 칸에 적은 가방이 여행에 아직 없으면 TREK가 만들어요. 여러 항목의 무게와 가방을 한 번에 넣는 방법은 ‘가져오기’와 ‘템플릿 적용’ 두 가지예요.',
  // export-packing-list
  'help.guide.export-packing-list.title': '짐 목록 인쇄하거나 내보내기',
  'help.guide.export-packing-list.goal':
    '목록을 인쇄하거나, PDF로 저장하거나, 다른 앱이나 다음 여행에 쓸 파일로 내보내요.',
  'help.guide.export-packing-list.step.1':
    '목록 위 바에서 ‘가져오기’ 바로 앞의 위쪽 화살표 아이콘 ‘내보내기’를 클릭하세요.',
  'help.guide.export-packing-list.step.2':
    '‘Markdown 체크리스트 (.md)’와 ‘가져오기용 CSV (.csv)’는 목록을 바로 파일로 저장해요.',
  'help.guide.export-packing-list.step.3':
    '“인쇄 또는 PDF로 저장”을 클릭하세요. 미리 보기에서 목록이 한 페이지로 보여요. 맨 위에 여행, 날짜, 챙긴 정도가 있고, 그 아래에 목록마다 카드가 있으며 항목마다 체크 상자가 붙어 있어요.',
  'help.guide.export-packing-list.step.4':
    '미리 보기 아래의 “인쇄 또는 PDF로 저장”을 클릭하세요. 브라우저의 인쇄 대화 상자가 열리면 프린터를 고르거나, 파일로 저장하려면 “PDF로 저장”을 고르세요.',
  'help.guide.export-packing-list.result':
    '인쇄물과 파일에는 지금 열린 보기(“공유됨” 또는 “내 목록”)가 수량, 무게, 체크 표시와 함께 담겨요.',
  'help.guide.export-packing-list.tip.1':
    'CSV는 “가져오기”가 읽는 형식이고 가방 정보도 들어가요. 그래서 나만의 짐 목록 템플릿처럼 다음 여행에 가져와 쓸 수 있어요.',
  'help.guide.export-packing-list.tip.2':
    'Markdown 파일은 Obsidian, Notion, GitHub에서 체크리스트로 열리고, ‘가져오기’로 다시 가져올 수 있어요.',
  // share-packing-item
  'help.guide.share-packing-item.title': '항목을 볼 사람과 챙길 사람 정하기',
  'help.guide.share-packing-item.goal': '항목을 그룹 공유 목록, 내 목록, 내가 대신 챙겨 줄 사람들 사이에서 옮겨요.',
  'help.guide.share-packing-item.step.1':
    '목록 위의 “공유됨”은 모두가 보는 목록이고 “내 목록”은 나만의 목록이에요. 각각 항목 수가 표시돼요. 내 목록을 보려면 “내 목록”을 클릭하세요.',
  'help.guide.share-packing-item.step.2': '다시 “공유됨”으로 돌아가 행 끝의 점 세 개를 열고 “공유”를 클릭하세요.',
  'help.guide.share-packing-item.step.3':
    '단계는 세 가지예요: 그룹 전체가 보는 “공유됨”, 나만 보는 “개인”, 항목을 누구를 위한 건지 고르는 “공유 대상…”.',
  'help.guide.share-packing-item.step.4': '“개인” 항목은 “내 목록”에만 있어요. “내 목록”으로 전환해서 찾으세요.',
  'help.guide.share-packing-item.step.5':
    '‘공유’를 다시 열고 ‘공유 대상…’에서 이름을 체크하세요. 그 사람의 목록에도 항목이 보이고, 줄에는 공유한 사람 수가 적힌 작은 배지가 붙어요.',
  'help.guide.share-packing-item.result': '항목이 고른 범위에 들어가고, 줄에 누가 챙기는지 보여요.',
  'help.guide.share-packing-item.tip.1':
    '항목의 공유 설정은 그 항목을 챙기는 사람만 바꿀 수 있어요. 공유받은 사람은 자기 ‘내 목록’에서 작은 손 배지가 붙은 항목을 보고(마우스를 올리면 내 이름이 보여요), 체크할 수 있어요.',
  'help.guide.share-packing-item.tip.2':
    '다른 사람이 가져가는 공유 항목에서는 점 세 개 메뉴에 “공유” 대신 두 가지가 나와요. “저도 가져갈 수 있어요”는 나를 그 사람 옆에 추가하고, “내 목록으로 복사”는 나만 보는 사본을 만들어요.',
  'help.guide.share-packing-item.tip.3':
    '새 항목의 공유 설정은 추가한 화면에 따라 정해져요. ‘공유됨’에서 추가하면 모두와 공유돼요. ‘내 목록’에서 추가하면 ‘개인’이 되지만, 그 목록의 모든 항목이 같은 사람들과 공유돼 있다면 새 항목도 그 사람들과 공유돼요.',
  // packing-bags
  'help.guide.packing-bags.title': '가방 무게 재기',
  'help.guide.packing-bags.goal': '항목마다 무게를 넣고, 가방에 나눠 담고, 가방마다 항공사 제한을 넘지 않게 관리해요.',
  'help.guide.packing-bags.step.1': '동그라미 앞의 무게 배지를 클릭하고 항목 무게를 그램 단위로 입력하세요.',
  'help.guide.packing-bags.step.2': '무게 뒤의 동그라미가 그 항목의 가방이에요. 클릭하세요.',
  'help.guide.packing-bags.step.3':
    '아직 가방이 없으면 ‘가방 추가’를 클릭하고 이름을 입력한 뒤 Enter를 누르세요. 가방이 만들어지고 항목이 그 안에 들어가요.',
  'help.guide.packing-bags.step.4':
    '가방이 하나라도 있으면 목록 오른쪽에 ‘가방’ 카드가 나타나요. 가방마다 이름, 맡은 사람, 채움 막대, 든 항목 수, 무게가 보여요. 가방 아래에는 ‘미배정’과 ‘총 무게’가 있고, 그 아래 ‘완료’에는 이미 챙긴 무게와 그 비율을 보여 주는 얇은 막대가 있어요.',
  'help.guide.packing-bags.step.5':
    '가방 무게 옆 ‘제한 설정’을 클릭하고, 항공사 기준처럼 킬로그램 단위로 제한을 입력하세요.',
  'help.guide.packing-bags.step.6':
    '가방 이름 줄 끝, X 바로 앞의 점선 +를 누르면 ‘멤버 배정’이 열려요. 가방을 들 멤버를 체크하면 + 옆에 보이고, 카드 아래쪽 ‘1인당’에 각자 드는 물건이 나와요.',
  'help.guide.packing-bags.result':
    '오른쪽 ‘가방’ 카드에 가방마다 무게와 한도, 어느 가방에도 없는 물건, 사람마다 드는 물건, 총 무게와 그중 챙긴 양이 보여요.',
  'help.guide.packing-bags.tip.1':
    '무게 입력란, 가방 동그라미, “가방” 카드는 관리자가 “목록” 애드온에서 “가방 추적”을 켰을 때만 나타나요. 창이 좁으면 대신 진행 카드 위의 “가방” 버튼으로 가방을 열어요.',
  'help.guide.packing-bags.tip.2':
    '가방 무게는 내가 볼 수 없는 항목까지 포함해 모든 멤버의 항목으로 서버가 계산해요. 그래서 표시된 숫자가 실제 가방 무게예요.',
  'help.guide.packing-bags.tip.3':
    '제한이 없는 가방은 가장 무거운 가방을 기준으로 비교되어 막대끼리 비교할 수 있어요. 제한을 정하면 막대는 그 제한을 기준으로 표시돼요.',
  // create-todo
  'help.guide.create-todo.title': '작업 추가하기',
  'help.guide.create-todo.goal': '할 일을 목록, 우선순위, 날짜, 담당자와 함께 적어 둬요.',
  'help.guide.create-todo.step.1': '바 오른쪽 끝의 ‘새 작업 추가’를 클릭하세요.',
  'help.guide.create-todo.step.2':
    '‘새 작업’ 창이 열리고 헤더에 커서가 있어요. ‘작업 이름’ 칸에 이름을 입력하고, 기억할 내용은 ‘설명’에 적으세요.',
  'help.guide.create-todo.step.3':
    '“목록”으로 작업을 묶어요. 목록을 하나 고르거나, 옆의 더하기 버튼을 눌러 작은 대화 상자에서 새 목록 이름을 정하세요.',
  'help.guide.create-todo.step.4':
    '“우선순위”에는 버튼이 네 개 있어요: “없음”, P1, P2, P3. 빨간색부터 파란색 순이에요.',
  'help.guide.create-todo.step.5':
    '“목록” 옆의 “마감일”을 누르면 달력이 열리고, “배정 대상”으로 작업을 사람에게 맡길 수 있어요.',
  'help.guide.create-todo.step.6': '“작업 만들기”를 클릭하세요.',
  'help.guide.create-todo.result':
    '할 일이 우선순위, 마감일, 목록 배지와 함께 목록에 들어가고, 줄 끝에 담당자 아바타가 보이며, 오른쪽 창에서 열려요.',
  'help.guide.create-todo.tip.1': '필수는 이름뿐이에요. 나머지는 나중에 오른쪽 창에서 채워도 돼요.',
  'help.guide.create-todo.tip.2': '사이드바에서 목록을 선택해 두면 새 할 일이 그 목록에 들어가요.',
  'help.guide.create-todo.tip.3': '이름 입력란에서 Enter를 누르면 다른 칸은 건드리지 않고 바로 작업이 만들어져요.',
  // todo-filters
  'help.guide.todo-filters.title': '작업 찾아서 바꾸기',
  'help.guide.todo-filters.goal': '지금 중요한 작업만 보고, 찾은 작업을 편집해요.',
  'help.guide.todo-filters.step.1':
    '사이드바의 “작업”: “전체”는 아직 남은 작업 전부, “내 작업”은 나에게 배정된 작업, “기한 초과”는 날짜가 지난 작업, “완료”는 끝난 작업을 보여 줘요. 각각 개수가 표시돼요. “기한 초과”를 클릭하세요.',
  'help.guide.todo-filters.step.2':
    '‘목록’에 목록마다 줄이 있어요. 하나를 고르면 완료한 할 일까지 포함해 그 목록이 보여요.',
  'help.guide.todo-filters.step.3':
    '목록 위쪽 정렬로 화면의 순서를 바꿔요: ‘우선순위’는 P1을 맨 앞에, ‘마감일’은 마감이 가까운 것을 맨 앞에 둬요. 둘 중 하나만 쓸 수 있고, 다시 클릭하면 내 순서로 돌아가요.',
  'help.guide.todo-filters.step.4': '할 일을 클릭하면 오른쪽 창에서 열려요.',
  'help.guide.todo-filters.step.5':
    '필요한 부분을 바꾸세요: 이름, ‘우선순위’, ‘목록’, ‘마감일’, ‘배정 대상’. ‘설명’은 링크가 동작하는 글로 보이고, 클릭하면 편집할 수 있어요. 그다음 창 아래쪽 ‘변경 사항 저장’을 클릭하세요. 창 헤더의 상자로 할 일을 완료 처리하고, ‘변경 사항 저장’ 옆 ‘삭제’는 바로 삭제해요.',
  'help.guide.todo-filters.result': '원하는 작업만 목록에 표시되고, 고른 작업은 오른쪽 창에서 편집할 수 있어요.',
  'help.guide.todo-filters.tip.1':
    '목록 행에는 남은 작업 수만 표시되지만, 선택하면 완료한 작업도 보여요. “전체”, “내 작업”, “기한 초과”는 완료한 작업을 숨기고, “완료”는 완료한 작업만 보여 줘요.',
  'help.guide.todo-filters.tip.2':
    '정렬의 “우선순위”와 “마감일”은 함께 쓸 수 없어요. 둘 중 하나라도 켜져 있으면 행을 드래그해 순서를 직접 바꿀 수 없어요.',

  // ── Screen: trip-bookings ─────────────────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': '예약',
  'help.ctx.trip-bookings.summary':
    '이 탭에는 교통을 뺀 여행 예약이 모두 있어요: 숙소, 식당 자리, 티켓, 투어, 주차. 예약마다 카드, 목록의 줄, 타임라인의 막대로 보이고, 코드, 문서, 동행자, 비용이 함께 있어요. 예약을 클릭하면 상세 정보가 열려요.',
  'help.ctx.trip-bookings.bullet.1':
    '바 오른쪽 끝의 ‘직접 예약’으로 ‘새 예약’을 열어요. 여섯 종류의 예약을 만들 수 있어요: ‘숙박’, ‘레스토랑’, ‘이벤트’, ‘투어’, ‘주차’, ‘기타’. 항공편, 기차 등 교통은 ‘교통’ 탭에 있고 여기에는 나오지 않아요.',
  'help.ctx.trip-bookings.bullet.2':
    '‘직접 예약’ 앞의 다운로드 아이콘 ‘예약 확인서 가져오기’로 확인서를 올리면 TREK가 자동으로 읽어요: EML, PDF, PKPass, HTML, TXT 파일을 각 10MB까지 최대 다섯 개, AI 모델이 이미지를 읽을 수 있으면 사진도 돼요. 서버가 읽을 수 있을 때만 이 아이콘이 보여요.',
  'help.ctx.trip-bookings.bullet.3':
    '“검색”은 제목, 유형, 장소, 메모, 예약 코드, 동행자에서 찾아요. 옆의 깔때기 아이콘 “필터”로 “상태”, 개수가 함께 표시되는 “유형”, 그리고 예약에 사람이 지정되어 있으면 “동행자”로 탭을 좁힐 수 있어요. 깔때기 위 숫자는 켜져 있는 필터 수예요.',
  'help.ctx.trip-bookings.bullet.4':
    '‘필터’ 뒤의 아이콘 세 개로 보기를 바꿔요: ‘카드’, ‘목록’, ‘타임라인’. 그 옆 슬라이더 ‘보기 옵션’으로 카드와 목록을 묶고 정렬하거나 타임라인의 줄을 정하고, 그 뒤 스프레드시트 아이콘 ‘스프레드시트로 내보내기 (CSV)’로 탭에 보이는 내용을 파일로 내려받아요. 기본적으로 카드는 ‘확정됨’과 ‘대기 중’으로, 목록은 날짜별로 묶여요. 구역 제목을 클릭하면 접혀요.',
  'help.ctx.trip-bookings.bullet.5':
    '카드 헤더는 상태에 따라 색이 달라지고 상태 점(클릭하면 “대기 중”과 “확정됨”이 바뀌어요), 유형, 제목, 연필, 휴지통이 있어요. 그 아래에 예약에 있는 정보가 나와요: “날짜”, “시간”, “예약 코드”, “체크인”과 “체크아웃”, “위치 / 주소”, “숙박”, “연결 대상”(계획 속 일정), “링크”, “메모”, “동행자”, “파일”, 연결된 비용.',
  'help.ctx.trip-bookings.bullet.6':
    '카드, 줄, 막대를 클릭하면 예약 상세 정보가 열리고, 아래쪽에 ‘지도에서’(예약에 장소가 있을 때), 휴지통, ‘편집’이 있어요. 삭제할 때는 한 번 물어봐요(‘예약을 삭제할까요?’, 비용도 함께 삭제되면 알려 줘요). 그러면 예약과 연결된 지출이 삭제되고, 숙박이면 일정에서 숙박일도 빠져요.',
  // booking-views
  'help.guide.booking-views.title': '보기 전환하고 예약 열기',
  'help.guide.booking-views.goal': '예약을 카드, 목록, 타임라인으로 보고, 하나를 열어 모든 상세 정보를 봐요.',
  'help.guide.booking-views.step.1':
    '바에서 ‘필터’ 뒤 아이콘 세 개가 보기 방식이고, 가리키면 이름이 나와요: ‘카드’, ‘목록’, ‘타임라인’. 탭은 ‘카드’로 열리고, 예약마다 카드가 ‘확정됨’과 ‘대기 중’ 구역에 나와요. 가운데 ‘목록’을 클릭하세요.',
  'help.guide.booking-views.step.2':
    '‘목록’은 날마다 제목 아래 예약을 한 줄씩 보여 주고, 오른쪽에 날짜와 시간이 나와요. 화살표 키로 줄을 옮겨 다녀요. 세 개 중 마지막인 ‘타임라인’을 클릭하세요.',
  'help.guide.booking-views.step.3':
    '‘타임라인’은 여행 기간 위에 예약을 보여 줘요: 유형마다 줄이 하나씩 있고, 예약마다 시작부터 끝까지 막대가 그려져요. 대기 중인 예약은 점선 테두리예요. ‘여행’은 여행 전체를 화면 폭에 맞추고, 날 제목을 클릭하면 그날을 시간 단위로 봐요.',
  'help.guide.booking-views.step.4':
    '‘하루’는 하루를 시간 눈금 위에 보여 주고, 막대 길이가 시간을 나타내요. 날 이름 옆 화살표로 전날과 다음 날로 넘어가요. 여행이 진행 중이면 ‘오늘’로 현재 날로 가고, 오른쪽 ‘여행’과 ‘하루’ 전환으로 여행 전체로 돌아가요.',
  'help.guide.booking-views.step.5':
    '막대에 마우스를 올리면 날짜, 시간, 장소가 나오고, 클릭하면 예약 상세가 열려요. “카드”의 카드나 “목록”의 행을 눌러도 같은 팝업이 열려요.',
  'help.guide.booking-views.step.6':
    '상세 보기 헤더에는 제목과 함께 상태(클릭하면 바뀌어요), 유형, 일자, 예약 코드 배지가 있고, 예약 코드를 복사하는 버튼도 있어요. 그 아래에는 시간이 타일로 나오고, 예약에 있으면 장소, 동행자, 메모, 비용, 파일이 이어지며, 맨 아래에 “지도에서”, 휴지통, “편집”이 있어요.',
  'help.guide.booking-views.result':
    '예약 상세 보기가 열려요. “편집”은 양식을 열고, “지도에서”는 계획에서 위치를 보여 주며, “닫기”나 Escape를 누르면 원래 보기로 돌아가요.',
  'help.guide.booking-views.tip.1':
    '보기 아이콘 뒤의 슬라이더 아이콘 “보기 옵션”에서 “그룹 기준”과 “정렬”로 “카드”와 “목록”을 묶고 정렬할 수 있어요. “타임라인”에서는 “유형별로 한 줄씩”과 “다른 탭도 표시”를 쓸 수 있어요. “다른 탭도 표시”는 “교통” 탭의 항목을 맨 위 얇은 레인에 흐리게 보여 줘요. “보기 초기화”는 기본값으로 되돌리고, 탭마다 이 브라우저에서 보기를 기억해요.',
  'help.guide.booking-views.tip.2':
    '여행 전후의 예약이나 날짜가 없는 예약은 타임라인에 나올 수 없어요. 그런 예약은 차트 아래 ‘여행 전’, ‘여행 후’, ‘날짜 없음’에 작은 카드로 보여요.',
  'help.guide.booking-views.tip.3':
    '예약이 보이는 곳이면 어디서든 같은 상세 정보가 열려요: ‘교통’ 탭, 일정, 날 상세, 장소 상세. 제목을 클릭하면 예약 이름을 바꿔요.',
  // create-booking
  'help.guide.create-booking.title': '예약 만들기',
  'help.guide.create-booking.goal': '식당, 이벤트, 투어, 주차 공간 등 무엇이든 직접 여행에 추가해요.',
  'help.guide.create-booking.step.1':
    '바 오른쪽 끝의 “직접 예약”을 클릭하세요. “새 예약”이 열리고, 맨 위 헤더에 제목과 배지 두 개가 있어요.',
  'help.guide.create-booking.step.2':
    '맨 위 띠의 유형 라벨(새 예약에서는 “기타”)을 클릭하고 “예약 유형”을 고르세요. 이 탭에서는 “숙박”, “레스토랑”, “이벤트”, “투어”, “주차”, “기타” 여섯 가지를 만들 수 있어요. 고른 유형에 따라 양식이 바뀌고, 날짜 대신 기간을 쓰는 건 “숙박”뿐이에요.',
  'help.guide.create-booking.step.3':
    '맨 위 띠, 배지 위의 입력란에 제목을 입력하세요. 필수 항목은 제목뿐이고, 입력하기 전에는 “추가”가 회색으로 비활성화돼요.',
  'help.guide.create-booking.step.4':
    '‘날짜’와 ‘시작 시간’을 정하고, 끝이 있는 예약이면 ‘종료 날짜’와 ‘종료 시간’도 정하세요. 캘린더에는 여행 기간의 날만 나와요. 종료 날짜와 시간이 시작보다 늦지 않으면 빨간색으로 보이고 ‘추가’할 수 없어요. 종료 날짜 없이 종료 시간이 시작 시간보다 이르면 경고만 해요. 다음 날 끝나는 예약이라면 종료 날짜를 정하세요.',
  'help.guide.create-booking.step.5':
    '확인서의 ‘예약 코드’를 입력하고, 헤더의 유형 옆 상태 버튼을 클릭하세요. 새 예약은 ‘대기 중’으로 보이고, 클릭하면 ‘확정됨’으로 바뀌어요. 상태에 따라 카드가 들어갈 구역이 정해져요.',
  'help.guide.create-booking.step.6': '양식 아래쪽 ‘추가’를 클릭하세요.',
  'help.guide.create-booking.result':
    '예약이 해당 구역에 카드로 나타나요. 헤더 색이 상태를 나타내고, 카드에 유형, 날짜와 시간, 코드가 보여요. 여행의 다른 모든 사람에게도 바로 보여요.',
  'help.guide.create-booking.tip.1':
    '“위치 / 주소”는 입력하는 동안 실제 주소를 추천해 줘요. 추천을 고르면 입력한 내용이 바뀌고, 직접 입력한 주소는 그대로 유지돼요.',
  'help.guide.create-booking.tip.2':
    '“링크”에는 예약처에 있는 해당 예약 페이지 주소를 넣으세요. 카드와 상세 보기에서 새 탭으로 열리는 링크로 표시돼요.',
  'help.guide.create-booking.tip.3':
    '메모는 Markdown을 지원해서 목록이나 굵은 글씨가 카드와 상세 보기에 그대로 표시돼요.',
  // booking-hotel
  'help.guide.booking-hotel.title': '숙소 예약하기',
  'help.guide.booking-hotel.goal': '숙소를 입력해서 예약과 일정의 숙박일로 한 번에 들어가게 해요.',
  'help.guide.booking-hotel.step.1':
    '‘직접 예약’을 클릭하고 위쪽 띠의 유형 버튼에서 ‘숙박’을 고르세요. 날짜 칸 대신 호텔 정보 칸이 나타나요.',
  'help.guide.booking-hotel.step.2':
    '‘숙박’에서 호텔을 고르세요. 목록에는 가져온 트랙과 투어를 뺀 여행 장소가 나와요. 하나를 고르면 제목이 비어 있을 때 이름이, ‘위치 / 주소’에 주소가 들어가요.',
  'help.guide.booking-hotel.step.3':
    '‘부터’와 ‘까지’를 정하세요: 첫날 밤과 떠나는 날 아침이에요. 둘 다 여행 날짜를 보여 주고, TREK가 ‘까지’를 항상 ‘부터’ 뒤로 유지해요.',
  'help.guide.booking-hotel.step.4': '“체크인”, “체크인 마감”, “체크아웃”과 확인 메일의 “예약 코드”를 입력하세요.',
  'help.guide.booking-hotel.step.5': '“추가”를 클릭하세요.',
  'help.guide.booking-hotel.result':
    '카드의 “날짜” 아래에 숙박 기간, 체크인과 체크아웃 시간, 주소가 나와요. 숙박이 계획의 해당 일자에도 표시돼요.',
  'help.guide.booking-hotel.tip.1':
    '“날짜”와 “시작 시간”이 없는 유형은 “숙박”뿐이에요. 대신 시작일과 종료일이 있고, 달력 날짜가 아니라 여행의 일자에서 골라요.',
  'help.guide.booking-hotel.tip.2':
    '‘숙박’을 비워 두고 주소를 대신 입력해도 돼요. 장소를 찾아서 만들고 지도에 핀을 꽂아 줘요.',
  'help.guide.booking-hotel.tip.3': '예약을 삭제하면 일정에서 숙박일도 함께 빠져요.',
  // link-booking
  'help.guide.link-booking.title': '예약을 계획에 연결하기',
  'help.guide.link-booking.goal': '예약을 일정과 장소에 연결해 필요한 곳에 표시되게 해요.',
  'help.guide.link-booking.step.1': '연결할 카드에 마우스를 올리고 헤더의 연필을 클릭하세요. “예약 편집”이 열려요.',
  'help.guide.link-booking.step.2':
    '“날 배정에 연결”을 여세요. 목록에 계획이 그대로 나와요. 일자마다 제목이 있고, 그 아래에 그날 일정이 번호와 시간과 함께 있어요. 예약에 해당하는 일정을 고르세요.',
  'help.guide.link-booking.step.3':
    '“장소 / 활동”에서는 장소 자체를 연결해요. 여기서 고르면 비어 있는 제목과 “위치 / 주소”가 채워져요.',
  'help.guide.link-booking.step.4': '‘업데이트’를 클릭하세요.',
  'help.guide.link-booking.result':
    '카드의 ‘연결 대상’에 날과 들를 곳이 보이고, 일정에서 예약이 그 들를 곳과 함께 나와요.',
  'help.guide.link-booking.tip.1':
    '목록 맨 위 ‘연결 없음 (독립)’으로 연결을 다시 해제해요. ‘숙박’에는 들를 곳 선택이 없고, 숙박일로 연결돼요.',
  'help.guide.link-booking.tip.2':
    '날짜가 정해진 일자의 일정을 고르면 비어 있는 “날짜”가 자동으로 채워져요. 이미 정한 날짜는 바뀌지 않아요.',
  // booking-travelers
  'help.guide.booking-travelers.title': '예약 대상자 정하기',
  'help.guide.booking-travelers.goal': '예약이 어떤 동행자를 위한 건지 표시하고, 그 사람의 예약만 볼 수 있게 해요.',
  'help.guide.booking-travelers.step.1':
    '카드의 연필로 예약을 여세요. “동행자”는 “예약 코드” 옆에 있고, 아무도 지정되지 않았을 때는 “동행자 지정”이 표시돼요.',
  'help.guide.booking-travelers.step.2':
    '클릭하고 이 예약에 해당하는 사람을 고르세요. 이름을 정한 게스트도 목록에 있어요. 고른 사람에게 체크가 붙고 칸에 아바타가 나타나요. 이름을 다시 클릭하면 빠져요.',
  'help.guide.booking-travelers.step.3': '‘업데이트’를 클릭하세요.',
  'help.guide.booking-travelers.step.4':
    '바의 ‘필터’를 클릭하고 ‘동행자’에서 사람을 클릭하면 그 사람의 예약만 보여요. 여러 명을 한꺼번에 켤 수 있어요.',
  'help.guide.booking-travelers.result': '카드에 대상자가 표시되고, “필터”로 고른 사람의 예약만 탭에 남길 수 있어요.',
  'help.guide.booking-travelers.tip.1':
    '카드와 상세 보기에서는 동행자가 표시만 되고 바꿀 수 없어요. 여기 양식에서 정하세요.',
  'help.guide.booking-travelers.tip.2':
    '여행 멤버가 두 명 이상이고 사람이 지정된 예약이 하나라도 있으면 “필터”에 “동행자”가 나와요. 고른 값은 브라우저 탭을 닫을 때까지 유지돼요.',
  // booking-files
  'help.guide.booking-files.title': '바우처를 예약에 보관하기',
  'help.guide.booking-files.goal': '확인서, 티켓, 패스를 해당 예약에 첨부해요.',
  'help.guide.booking-files.step.1':
    '카드의 연필로 예약을 여세요. ‘파일’은 ‘링크’ 옆에 있어요. 거기서 ‘파일 첨부’를 클릭하세요. 이미 있는 예약이면 문서가 바로 올라가고 ‘파일이 업로드되었습니다’가 보여요.',
  'help.guide.booking-files.step.2': '문서가 이름으로 나오고, 여는 버튼과 옆에 X가 있어요.',
  'help.guide.booking-files.step.3':
    '“기존 파일 연결”에는 이 예약에 아직 없는 여행 문서가 나와요. 하나를 고르면 다시 업로드하지 않고 바로 첨부돼요.',
  'help.guide.booking-files.step.4': '“업데이트”를 클릭하세요.',
  'help.guide.booking-files.result':
    '카드와 상세 보기의 ‘파일’ 아래에 문서가 나열돼요. 문서를 클릭하면 열려요. 상세 보기 목록 위의 ‘파일에서 보기’를 누르면 ‘파일’ 탭으로 이동해요.',
  'help.guide.booking-files.tip.1':
    '아직 만들고 있는 예약이라면 ‘추가’를 클릭할 때 문서가 올라가요. 업로드에는 인터넷 연결이 필요해요.',
  'help.guide.booking-files.tip.2':
    '문서 옆의 X는 연결만 끊고 문서는 삭제하지 않아요. 문서는 여행의 “파일” 탭에 남아요.',
  'help.guide.booking-files.tip.3':
    '첨부할 수 있는 파일 형식은 관리자가 “허용된 파일 형식”에서 정해요. 기본적으로 문서, 텍스트, 이미지가 허용돼요.',
  // booking-cost
  'help.guide.booking-cost.title': '예약 금액을 비용으로 만들기',
  'help.guide.booking-cost.goal': '예약 비용을 ‘비용’에 넣고, 내는 사람들끼리 나눠요.',
  'help.guide.booking-cost.step.1':
    '카드의 연필로 예약을 열고 양식 맨 아래로 가세요. ‘비용’ 아래에 ‘지출 만들기’와 ‘기존 지출 연결’이 있고, ‘예약을 저장한 뒤 비용 편집기를 엽니다’라는 안내가 있어요.',
  'help.guide.booking-cost.step.2':
    '“지출 만들기”를 클릭하세요. 예약이 저장되고 양식이 닫힌 뒤 비용 편집기가 “지출 추가”로 열려요.',
  'help.guide.booking-cost.step.3':
    '헤더의 이름에는 이미 예약 제목이, 날에는 이미 예약 날짜가 들어 있어요. ‘총 금액’을 입력하고 옆의 ‘통화’를 확인하세요.',
  'help.guide.booking-cost.step.4':
    '헤더의 배지가 “카테고리”이고, 예약 유형에 맞는 카테고리로 이미 정해져 있어요. “누가 지불했나요?”에서 지불한 사람을 고르고, “나누기”에서 금액을 어떻게 나눌지 정하세요.',
  'help.guide.booking-cost.step.5': '“지출 추가”를 클릭하세요.',
  'help.guide.booking-cost.result':
    '카드 아래쪽에 금액이 표시되고, 예약 양식의 “연결된 지출”에 지출이 나와요. 같은 지출이 이 예약에 연결된 채로 “비용” 탭에도 나타나요.',
  'help.guide.booking-cost.tip.1':
    '카테고리는 유형에 따라 정해져요: ‘레스토랑’은 ‘식음료’, ‘숙박’은 ‘숙박’, ‘주차’는 ‘주차’, ‘이벤트’와 ‘투어’는 둘 다 ‘기타’가 돼요.',
  'help.guide.booking-cost.tip.2':
    '예약 하나에 지출을 여러 개 붙일 수 있어요. ‘기존 지출 연결’에는 ‘비용’ 중 아직 어디에도 연결되지 않은 지출이 나와요. 연결된 지출에서 ‘연결 해제, 지출은 유지’는 연결만 끊고 지출은 ‘비용’에 남기고, 휴지통은 지출을 삭제해요.',
  'help.guide.booking-cost.tip.3': '‘비용’은 관리자가 ‘애드온’에서 비용 애드온을 켰을 때만 양식에 보여요.',
  // filter-bookings
  'help.guide.filter-bookings.title': '예약 찾기',
  'help.guide.filter-bookings.goal': '긴 탭을 단어, 상태, 유형, 사람으로 필터링해요.',
  'help.guide.filter-bookings.step.1':
    '바의 “검색”에 입력하세요. 제목, 유형, 장소와 주소, 메모, 예약 코드, 동행자 이름에서 찾고, 입력할수록 결과가 줄어들어요. Escape를 누르면 입력란이 비워져요.',
  'help.guide.filter-bookings.step.2':
    '검색 옆 깔때기 아이콘 “필터”를 클릭하세요. 패널에 “상태”, “유형”, 그리고 사람이 지정된 예약이 있으면 “동행자”가 나와요.',
  'help.guide.filter-bookings.step.3':
    '‘상태’에서 ‘확정됨’이나 ‘대기 중’을 고르면 그것만 보이고, ‘전체’는 둘 다 보여 줘요.',
  'help.guide.filter-bookings.step.4':
    '‘유형’에서 유형을 하나 이상 클릭하면 그 유형만 남아요. 유형마다 예약 수가 보이고, 고른 유형에는 체크가 붙어요.',
  'help.guide.filter-bookings.step.5':
    '‘필터’ 위 숫자는 켜진 필터 수이고, 검색 옆 칩에 전체 예약 중 남은 수가 보여요. 칩이나 패널 아래쪽 ‘필터 초기화’를 클릭하면 다시 모두 보여요.',
  'help.guide.filter-bookings.result':
    '“카드”, “목록”, “타임라인” 어디서나 고른 항목만 표시되고, 필터는 브라우저 탭을 닫을 때까지 이 여행에 유지돼요.',
  'help.guide.filter-bookings.tip.1':
    '“유형”은 탭에 유형이 두 가지 이상 있을 때만 나오고, 탭에 있는 유형만 보여 줘요. 그래서 탭에 투어가 없으면 “유형”에 “투어”가 없어요.',
  'help.guide.filter-bookings.tip.2':
    '필터에 맞는 항목이 없으면 탭에 “이 필터에 맞는 항목이 없습니다”가 나오고 바로 아래에 “필터 초기화”가 있어요.',
  // import-booking-file
  'help.guide.import-booking-file.title': '확인 메일에서 예약 가져오기',
  'help.guide.import-booking-file.goal':
    '업체가 보낸 메일이나 PDF에서 TREK가 예약을 읽어 와서 다시 입력할 필요가 없어요.',
  'help.guide.import-booking-file.step.1':
    '바의 다운로드 아이콘 ‘예약 확인서 가져오기’를 클릭하세요. 마우스를 올리면 이름이 나와요. 같은 이름의 창이 열려요.',
  'help.guide.import-booking-file.step.2':
    '확인서를 상자에 끌어다 놓거나, 상자를 클릭해 고르세요: EML, PDF, PKPass, HTML, TXT 파일을 각 10MB까지 최대 다섯 개, AI 모델이 이미지를 읽을 수 있으면 사진(JPG, PNG, WEBP)도 돼요. 고른 파일 이름이 상자에 보여요.',
  'help.guide.import-booking-file.step.3': '‘가져오기’를 클릭하세요. 읽기는 백그라운드에서 하므로 창이 바로 닫혀요.',
  'help.guide.import-booking-file.step.4':
    '오른쪽 아래 카드에서 파일 이름 아래에 진행 상황이 표시돼요. 앱 안에서 다른 곳으로 이동하거나 새로 고침해도 계속 보여요. 읽기가 끝나면 “파일 분석 중…”이 체크 표시로 바뀌고 카드에 “가져오기”가 나타나요. 클릭하세요.',
  'help.guide.import-booking-file.step.5':
    '찾은 예약이 하나씩 차례로 “새 예약”에 채워진 채로 열려요. 호텔이라면 제목에 호텔 이름, 여행에 그 장소가 있으면 “숙박”에 장소, “위치 / 주소”, 숙박일에 맞춘 시작일과 종료일, “체크인”과 “체크아웃”, “예약 코드”, “파일” 아래의 확인서, 그리고 “비용”이 켜져 있으면 “연결된 지출”에 가격이 들어가요. 확인하고 “추가”를 클릭하세요.',
  'help.guide.import-booking-file.result':
    '예약이 숙박일, 코드, “파일” 아래의 확인서와 함께 “대기 중”에 카드로 나타나요. 숙박은 계획의 해당 일자에 표시돼요. “비용”이 켜져 있으면 가격이 예약에 연결된 지출로 추가돼요.',
  'help.guide.import-booking-file.tip.1':
    '가져오기 아이콘은 서버가 확인서를 읽을 수 있을 때만 나와요. 그러려면 추출기나 “AI 분석” 애드온이 필요해요. “AI 분석” 애드온은 관리자가 “애드온”에서 켜요. 예약이 없는 탭에서는 “파일에서 가져오기” 버튼으로도 나와요.',
  'help.guide.import-booking-file.tip.2':
    '아무것도 읽지 못하면 카드에 그렇게 나와요. ‘AI 분석’이 켜져 있으면 ‘AI로 읽어 보기’가 나오는데, 같은 파일을 모델로 바로 보내요. 분석 결과는 10분 동안 보관되니 그 안에 검토를 시작하세요.',
  'help.guide.import-booking-file.tip.3':
    '확인서는 그 형식이 관리자 설정의 ‘허용된 파일 형식’에 있을 때만 첨부돼요. PDF는 기본으로 허용되고, 메일(EML)은 먼저 추가해야 해요. 아니면 확인서 없이 예약만 저장돼요.',
  // edit-booking
  'help.guide.edit-booking.title': '예약 수정하기',
  'help.guide.edit-booking.goal':
    '시간을 고치거나, 나중에 받은 코드를 넣거나, 예약을 “대기 중”에서 “확정됨”으로 바꿔요.',
  'help.guide.edit-booking.step.1':
    '카드에 마우스를 올리고 헤더의 연필을 클릭하세요. 예약의 모든 정보가 담긴 “예약 편집”이 열려요.',
  'help.guide.edit-booking.step.2': '바꿀 내용을 고치세요. 예를 들어 업체가 나중에 보낸 “예약 코드”를 넣을 수 있어요.',
  'help.guide.edit-booking.step.3': '맨 위 띠의 “대기 중” 배지를 클릭하세요. “확정됨”으로 바뀌고 띠가 초록색이 돼요.',
  'help.guide.edit-booking.step.4': '‘업데이트’를 클릭하세요.',
  'help.guide.edit-booking.result':
    '카드가 옮겨 가요: 확정된 예약은 초록 점과 초록 띠와 함께 ‘확정됨’ 구역에 나오고, 여행의 모든 사람에게도 바뀐 모습이 보여요.',
  'help.guide.edit-booking.tip.1':
    '‘예약 코드’가 안 보인다면 ‘설정’의 ‘화면’에서 ‘예약 코드 흐리게’가 켜져 있는 거예요. 코드에 마우스를 올리거나 클릭하면 보여요.',
  'help.guide.edit-booking.tip.2':
    '유형을 바꾸면 연결된 지출의 카테고리도 함께 바뀌어요. 단, 비용 편집기에서 카테고리를 직접 고른 경우는 예외예요.',
  'help.guide.edit-booking.tip.3':
    '예약 상세 보기 맨 아래의 “편집”으로도 같은 양식이 열려요. 상태는 양식 없이도 바꿀 수 있어요. 카드나 행의 점, 또는 상세 보기의 상태 배지를 클릭하세요.',
  // delete-booking
  'help.guide.delete-booking.title': '예약 삭제하기',
  'help.guide.delete-booking.goal': '취소된 예약을 여행에서 삭제해요.',
  'help.guide.delete-booking.step.1':
    '카드를 가리키고 헤더의 휴지통을 클릭하세요. 예약 상세 정보 아래쪽 휴지통도 같아요.',
  'help.guide.delete-booking.step.2':
    '‘예약을 삭제할까요?’에 고른 예약 이름이 나오고, 영구 삭제된다고 알려 줘요. 연결된 비용이 있으면 함께 삭제된다고 알려 줘요.',
  'help.guide.delete-booking.step.3': '‘삭제’를 클릭하세요.',
  'help.guide.delete-booking.result':
    '여행의 모든 사람에게서 카드가 삭제돼요. 예약 삭제는 되돌릴 수 없으니, 확인 질문이 취소할 마지막 기회예요.',
  'help.guide.delete-booking.tip.1':
    '예약을 삭제하면 연결된 지출도 함께 삭제돼요. 숙소를 삭제하면 일정표에서 그 숙박일도 사라져요.',
  'help.guide.delete-booking.tip.2': '첨부했던 문서는 여행의 “파일” 탭에 남아요. 예약과의 연결만 끊어져요.',

  // ── Screen: trip-costs ────────────────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': '비용',
  'help.ctx.trip-costs.summary':
    '여행의 돈 관리예요: 모든 지출이 날짜별 내역이나 표에 영수증 통화 그대로 기록되고, 누가 입력했는지, 누가 부담하는지가 나와요. 오른쪽 열에는 정산하려면 누가 누구에게 얼마를 줘야 하는지 보여요.',
  'help.ctx.trip-costs.bullet.1':
    '위쪽 바에 여행 날짜와 비용을 나누는 동행자가 보이고, ‘지출 검색…’, ‘필터’(깔때기), ‘CSV 내보내기’(다운로드 아이콘), ‘목록’ / ‘표’ 전환이 있어요.',
  'help.ctx.trip-costs.bullet.2':
    '바 오른쪽 끝에서 ‘정산하기’는 남은 송금을 한 번에 모두 기록하고, ‘영수증 스캔’은 AI 분석 애드온이 이미지를 읽을 수 있을 때 사진으로 지출을 채우며, ‘지출 추가’는 편집기를 열어요.',
  'help.ctx.trip-costs.bullet.3':
    '바 아래 카드 네 장: “내가 줄 돈”과 “받을 돈”은 정산에서 내 몫이고, “미정산 금액”은 기록됐지만 아직 지불한 사람이 없는 금액이에요. “총 여행 지출”은 전체 합계이고, 그 아래에 “내 몫”과 “내가 지불함”이 나와요.',
  'help.ctx.trip-costs.bullet.4':
    '내역은 날짜별로 최신순으로 묶이고, 날마다 항목 수와 쓴 금액이 헤더에 보여요. 줄에는 색 탭으로 카테고리, 이름, 각자 낸 금액이 있는 결제자 칩, 그 아래 동행자별 몫이 있는 ‘나누기’(체크는 자기 몫을 낸 사람), 메모와 금액이 있어요. 나누기 결과 다른 사람이 나에게 줄 돈이 있거나 내가 줄 돈이 있으면 ‘빌려줌’ 또는 ‘빌림’이 보여요.',
  'help.ctx.trip-costs.bullet.5':
    '오른쪽 열에 결과가 나와요: “정산하기”는 누가 누구에게 줄지, “잔액”은 동행자마다 더 냈거나 덜 낸 금액, “최종 부담액”은 각자에게 여행이 얼마 들었는지, “카테고리별”은 어디에 돈을 썼는지 보여 줘요.',
  'help.ctx.trip-costs.bullet.6':
    '기록한 송금은 같은 내역에 별도 줄로 나오고, 옆에 연필과 ‘실행 취소’가 있어요. 지출에는 연필과 휴지통이 있고, 휴지통은 지출을 삭제하기 전에 확인해요. 영수증이 있는 지출은 이름 옆에 ‘영수증’ 칩이 있어 누르면 열려요.',
  'help.ctx.trip-costs.bullet.7':
    '바의 “표”는 같은 지출을 카테고리별로 묶어 시트로 보여 주고, “인원”, “일”, 1인당 금액과 하루당 금액이 나와요. 이때 “카테고리별” 자리에 “요약”이 나와요. “비용”은 고른 보기를 기억해요.',
  // add-expense
  'help.guide.add-expense.title': '지출 추가하기',
  'help.guide.add-expense.goal': '무엇에 얼마를 썼는지, 누가 냈는지, 누구와 나누는지 기록해요.',
  'help.guide.add-expense.step.1':
    '바 오른쪽 끝의 ‘지출 추가’를 클릭하세요. 오늘 날짜, 내가 결제한 것으로, 모두가 나누기에 들어간 채 편집기가 열려요.',
  'help.guide.add-expense.step.2':
    '창 위쪽 칸에 무엇에 쓴 돈인지 입력하세요. 비어 있을 때는 ‘예: 저녁 식사, 기념품, 주유…’가 보여요. 이게 지출 이름이고, 이름이 없으면 저장할 수 없어요.',
  'help.guide.add-expense.step.3':
    '이름 아래 배지가 “카테고리”이고, 다른 걸 고르기 전까지는 “식음료”예요. 카테고리는 열네 개로 고정되어 있어요. 고른 카테고리의 색으로 헤더가 바뀌고, 행의 탭과 “카테고리별”의 막대도 같은 색이 돼요.',
  'help.guide.add-expense.step.4':
    '영수증 금액을 “총 금액”에 입력하세요. 옆의 “통화”는 처음에 “비용”의 표시 통화로 설정되어 있고, 바꾸면 편집기에 환산 금액이 나와요. “날짜”는 처음에 오늘로 설정되고, 목록에서 지출이 이 날짜 아래에 묶여요.',
  'help.guide.add-expense.step.5':
    '“누가 지불했나요?”에서 실제로 돈을 낸 사람을 클릭하세요. 기본으로 “나”가 선택되어 있어요. “아직 아무도 지불하지 않음”은 누구도 빚지지 않은 채 금액만 기록하고, 제목 옆 전환의 “여러 명이 결제함”은 여러 사람이 나눠 낸 것으로 기록해요.',
  'help.guide.add-expense.step.6':
    '아래 “나누기”는 “균등하게”로 시작하고, 모두 체크되어 있으며 이름 옆에 각자의 몫이 나와요. 그대로 두거나 바꾸세요. 대화 상자 맨 아래 “지출 추가”를 클릭하면 저장돼요.',
  'help.guide.add-expense.result':
    '지출이 그날 아래 내역에 들어가고 ‘총 여행 지출’에 더해지며, 정산 열이 누가 누구에게 줄지 다시 계산해요.',
  'help.guide.add-expense.tip.1':
    '기본값을 바꾸지 않으면 지출은 오늘 날짜, 내가 결제, 모두 똑같이 나누기로 저장돼요. 이름과 금액만 채우면 돼요.',
  'help.guide.add-expense.tip.2':
    '금액 옆 ±를 누르면 지출이 환불이 돼요. 합계가 음수면 돈을 돌려받는 거고, 나누기도 반대로 계산돼요.',
  'help.guide.add-expense.tip.3':
    '창 아래쪽 ‘영수증 및 청구서’ 옆의 ‘첨부’로 이미지와 PDF를 올려요. 저장할 때 업로드되어 여행의 ‘파일’에 보관되고, 목록의 이름 옆에 ‘영수증’ 칩이 생겨요.',
  // expense-payers
  'help.guide.expense-payers.title': '지불한 사람 정하기',
  'help.guide.expense-payers.goal': '지출을 누가 냈는지 기록해요. 정산 계산의 나머지 절반이에요.',
  'help.guide.expense-payers.step.1':
    '행 옆의 연필로 지출을 열고 “누가 지불했나요?”를 보세요. 제목 옆 전환의 기본값은 “한 명이 결제함”이에요. 동행자마다 칩이 하나씩 있고, 테두리가 있는 칩이 지불한 사람이에요. 다른 칩을 클릭하면 바뀌어요.',
  'help.guide.expense-payers.step.2':
    '동행자 칩 뒤의 점선 칩 “아직 아무도 지불하지 않음”은 누구도 빚지지 않게 금액만 기록해요. 지출은 여전히 “총 여행 지출”에 포함돼요.',
  'help.guide.expense-payers.step.3':
    '같은 전환의 다른 옵션 ‘여러 명이 결제함’을 고르면 모든 동행자가 체크박스와 함께 나오고, 체크한 사람마다 금액 칸이 생겨요. 돈을 낸 사람을 체크하고 각자 낸 금액을 입력하세요. 합계가 총액과 같아야 해요.',
  'help.guide.expense-payers.step.4':
    '아무도 결제하지 않은 지출은 줄에 ‘미완료’로 표시되고, ‘미정산 금액’ 카드에 더해져요. 이 카드는 아직 결제자가 없는 지출을 합산해요.',
  'help.guide.expense-payers.result':
    '누가 냈는지로 누가 돌려받을지가, 나누기로 누가 부담할지가 정해지고, ‘잔액’은 그 둘의 차이예요.',
  'help.guide.expense-payers.tip.1':
    '“누가 지불했나요?”와 “나누기”는 따로 정해요. 내가 가지 않은 저녁값을 낼 수도 있고, 내가 내지 않은 지출을 나눠 낼 수도 있어요.',
  'help.guide.expense-payers.tip.2':
    '지불한 사람이 여럿이면 금액의 합이 총액과 같아야 해요. 지불한 사람을 한 명 더 체크하면 직접 입력하지 않은 금액끼리 나머지를 다시 나눠요. 금액이 맞지 않는 동안에는 편집기가 맞춰야 할 총액을 보여 주고 저장되지 않아요.',
  'help.guide.expense-payers.tip.3':
    '지출을 “아직 아무도 지불하지 않음”으로 되돌려도 지출은 삭제되지 않아요. 금액은 “총 여행 지출”에 남고 행은 “미완료”가 돼요.',
  // split-expense
  'help.guide.split-expense.title': '동행자끼리 비용 나누기',
  'help.guide.split-expense.goal': '지출을 누가 부담할지 정해요: 모두 똑같이, 금액별로, 또는 영수증 항목별로.',
  'help.guide.split-expense.step.1':
    '지출 편집기의 ‘나누기’에 모든 동행자가 체크박스와 함께 나와요. 이름의 체크를 풀면 이 지출에서 빠져요: 이름이 회색이 되고, 몫이 없어지며, 부담할 금액도 없어요.',
  'help.guide.split-expense.step.2':
    '제목 옆 전환에서 ‘균등하게’가 기본값이에요: 체크한 동행자마다 같은 몫을 부담하고, 몫은 이름 옆에 보여요. 목록 아래 배지에 몇 명이 나누는지와 한 사람 몫이 얼마인지 나와요.',
  'help.guide.split-expense.step.3':
    '“직접 설정”을 고르면 몫 대신 금액 입력란이 나와요. 동행자마다 부담할 금액을 입력하세요. 아래 배지가 입력에 맞춰 바뀌고, 금액이 맞으면 “분할 금액이 합계와 일치합니다”와 함께 초록색이 돼요. 금액이 합계와 맞지 않으면 저장할 수 없어요.',
  'help.guide.split-expense.step.4':
    '“영수증”은 영수증을 줄별로 나눠요. “항목 추가”를 누르고 줄마다 이름과 가격을 입력한 뒤, “나눔:” 옆에서 그 항목을 나눌 동행자를 고르세요.',
  'help.guide.split-expense.step.5':
    '줄 아래 “개인별 부담”에는 동행자마다 최종적으로 부담할 금액이 나오고, 맨 위 “총 금액”은 줄의 합계예요. 대화 상자 맨 아래 “저장”을 클릭하세요.',
  'help.guide.split-expense.result':
    '모든 잔액은 이 나누기로 계산돼요. 나누기는 지출과 함께 저장되고, 그 줄에 동행자별 몫과 함께 ‘나누기’로 보여요. 나중에 다른 것은 건드리지 않고 바꿀 수 있어요.',
  'help.guide.split-expense.tip.1':
    '체크를 해제한 동행자는 이 지출에 대해 부담하지 않고, 나머지 사람들이 각자 몫을 내요.',
  'help.guide.split-expense.tip.2':
    '‘균등하게’는 1센트 단위까지 정확히 나눠요. 남는 1센트는 지출마다 다른 사람에게 가서, 늘 같은 사람이 더 내지 않아요.',
  'help.guide.split-expense.tip.3':
    '‘영수증’ 모드는 ‘총 금액’을 직접 계산하고 칸을 회색으로 잠가요: 총액은 영수증 줄의 합계예요.',
  'help.guide.split-expense.tip.4':
    '직접 나누기는 퍼센트로도 입력할 수 있어요: ‘몫 입력 방식’을 %로 바꾸면, 몫의 합이 100 %가 돼야 저장돼요.',
  // expense-currency
  'help.guide.expense-currency.title': '다른 통화로 지출 입력하기',
  'help.guide.expense-currency.goal': '영수증에 적힌 금액을 입력하면 TREK이 환율을 저장해요.',
  'help.guide.expense-currency.step.1':
    '“지출 추가”를 여세요. 대화 상자 맨 위에 이름을 입력하고, “총 금액”에는 환산한 금액이 아니라 영수증에 적힌 금액을 그대로 입력하세요.',
  'help.guide.expense-currency.step.2':
    '금액 옆의 “통화”를 열고 영수증의 통화를 고르세요. 목록에는 TREK이 아는 모든 통화 코드가 있고, 세 글자를 입력해 검색할 수 있어요.',
  'help.guide.expense-currency.step.3':
    '칸 아래에 배지 한 줄이 나타나요: 입력한 금액과 지금 가치가 ‘실시간 환율’ 표시와 함께 보여요. 미리보기일 뿐, 저장되는 값은 아니에요.',
  'help.guide.expense-currency.step.4':
    '창 아래쪽 ‘지출 추가’를 클릭하세요. 환율은 그 순간 고정돼서, 이 지출은 입력한 날의 금액을 그대로 유지해요.',
  'help.guide.expense-currency.step.5':
    '내역의 그 줄 이름 아래에 두 금액이 보여요: 입력한 금액, 화살표, 여행 통화로 바꾼 금액. ‘비용’ 탭의 모든 합계, 잔액, 정산은 두 번째 금액을 써요.',
  'help.guide.expense-currency.result':
    '지출은 입력한 금액과 통화 그대로 저장돼요. 장부에는 둘 다 표시되고, 여행의 합계와 잔액은 여행 통화로 계산돼요.',
  'help.guide.expense-currency.tip.1':
    '환율은 저장할 때 고정돼요. 그래서 다음 주에 환율이 바뀌어도 정산이 끝난 금액은 달라지지 않아요. 새 환율은 지출의 통화를 바꿀 때만 저장돼요.',
  'help.guide.expense-currency.tip.2':
    '“설정”의 “표시 통화”는 금액을 보여 주는 방식만 바꿔요. 저장된 금액은 바뀌지 않아요. 비워 두면 여행마다 그 여행의 통화로 표시돼요.',
  'help.guide.expense-currency.tip.3':
    '여행 통화는 여행 자체의 “여행 편집”에서 정하고, “여행 상세 편집” 권한이 필요해요. 여행 통화를 바꾸면 고정된 환율이 모두 새 통화 기준으로 다시 계산돼요. 금액 자체는 환산되지 않아요.',
  // filter-costs
  'help.guide.filter-costs.title': '지출 하나나 하루 지출 찾기',
  'help.guide.filter-costs.goal': '긴 지출 목록을 원하는 것만 보이도록 걸러요.',
  'help.guide.filter-costs.step.1':
    '바의 ‘지출 검색…’에 입력하세요. 입력하는 대로 지출 이름을 찾고, Esc로 다시 지워요.',
  'help.guide.filter-costs.step.2':
    '검색 옆 깔때기 아이콘 “필터”를 누르면 필터가 열려요. 맨 위 스위치로 장부를 내 기준으로 볼 수 있어요: “전체”, 내가 낸 지출만 보는 “내가 지불”, 내 몫보다 더 낸 지출을 보는 “받을 돈”.',
  'help.guide.filter-costs.step.3':
    '“카테고리”에서 열네 개 중 하나를 고르면 그 카테고리의 지출만 보여요. 깔때기에 켜진 필터 수가 표시돼요.',
  'help.guide.filter-costs.step.4':
    '“날짜”에서 지출이 있는 날 중 하나를 고르세요. 날짜 머리글 대신 배너가 나와 그 날짜 전체와 지출 건수, 합계를 보여 줘요.',
  'help.guide.filter-costs.step.5':
    '깔때기 옆 다운로드 아이콘 “CSV 내보내기”를 누르면 모든 지출이 원래 금액, 통화, 환산 금액과 함께 파일로 저장돼요.',
  'help.guide.filter-costs.result': '필터를 함께 쓸 수 있고, 날짜 묶음마다 남은 지출의 합계가 다시 계산돼요.',
  'help.guide.filter-costs.tip.1':
    '기록한 송금에는 이름도 카테고리도 없어서 검색, 카테고리 필터, ‘받을 돈’ 필터를 쓰면 숨겨져요. 날 필터에서는 송금한 날 아래에 남아요.',
  'help.guide.filter-costs.tip.2': '‘CSV 내보내기’는 화면에서 무엇을 걸렀든 항상 모든 지출을 한 줄씩 내보내요.',
  'help.guide.filter-costs.tip.3':
    '필터가 켜져 있으면 필터 메뉴 아래쪽에 ‘필터 초기화’가 나오고, 누르면 모두 한 번에 꺼져요.',
  // settle-up
  'help.guide.settle-up.title': '누가 누구에게 얼마를 줄지 보고 정산하기',
  'help.guide.settle-up.goal': '여러 공동 지출을 가장 적은 송금 횟수로 정리하고, 송금하면 기록해요.',
  'help.guide.settle-up.step.1':
    '오른쪽 열의 “정산하기” 카드에 모든 빚을 정리할 송금이 나와요. 누가 누구에게 얼마를 보내는지 아바타 두 개로 표시되고, 이름은 툴팁에 나와요. 카드 헤더의 숫자는 아직 남은 송금 수예요.',
  'help.guide.settle-up.step.2':
    '송금 옆의 “정산”을 누르면 완료로 기록돼요. 송금이 카드에서 사라지고 잔액이 업데이트돼요.',
  'help.guide.settle-up.step.3':
    '기록한 송금은 송금한 날 아래 내역에 한 줄로 들어가고, ‘결제’ 표시와 두 동행자, 금액이 보여요.',
  'help.guide.settle-up.step.4':
    '그 줄 옆 연필로 송금을 고치고, ‘실행 취소’로 취소하면 그 송금이 ‘정산하기’ 카드로 돌아가요.',
  'help.guide.settle-up.step.5':
    '카드 헤더의 ‘결제 추가’로 제안과 다른 송금을 기록해요. 보낸 사람과 받는 사람, 금액, 통화, 송금한 날을 고르고, 원하면 결제 방법 같은 ‘메모’를 넣은 뒤 창 아래쪽 ‘결제 추가’를 클릭하세요.',
  'help.guide.settle-up.step.6':
    '위쪽 바의 ‘정산하기’는 묻지 않고 남은 송금을 한 번에 모두 기록해요. 예를 들어 여행 끝에 모든 빚을 한꺼번에 정리할 때 써요.',
  'help.guide.settle-up.result':
    '기록한 송금은 장부에 한 줄씩 추가되고 “정산하기” 카드에서 한 줄씩 사라져요. 카드에 “모두 정산 완료”가 나오면 여행 정산이 끝난 거예요.',
  'help.guide.settle-up.tip.1':
    '카드에는 모든 빚이 아니라 최소한의 송금만 나와요. 세 사람이 돌고 돌며 서로 빚졌다면 한두 번의 송금으로 줄여 줘요.',
  'help.guide.settle-up.tip.2':
    '“정산”은 송금을 기록만 하고 돈을 보내지는 않아요. 평소 쓰는 결제 수단으로 보낸 다음 “정산”을 클릭하세요.',
  'help.guide.settle-up.tip.3':
    '어떤 통화로든 송금할 수 있어서 엔화 빚을 유로로 갚아도 괜찮아요. 대화 상자에 별도 통화 선택기가 있고, 그 환율도 고정돼요.',
  // final-budget
  'help.guide.final-budget.title': '동행자별 여행 비용 보기',
  'help.guide.final-budget.goal': '사람마다 숫자를 확인해요: 오늘 기준 잔액과 1인당 실제 비용.',
  'help.guide.final-budget.step.1':
    '‘잔액’에 동행자마다 상태가 보여요: 받을 돈이 있으면 오른쪽으로 초록 막대, 줄 돈이 있으면 왼쪽으로 빨간 막대가 뻗고, 이름 옆에 금액이 나와요.',
  'help.guide.final-budget.step.2':
    '그 아래 “최종 부담액”은 다른 걸 알려 줘요. 지금 누가 얼마를 줘야 하는지가 아니라, 모두 돌려받은 뒤 동행자마다 여행에 실제로 든 비용이에요.',
  'help.guide.final-budget.step.3':
    '이름을 클릭하면 계산 내역이 나와요: “지불한 지출”, 그 아래에 “정산 (순액)”과 “미정산 금액”.',
  'help.guide.final-budget.step.4':
    '세 줄 아래에는 동행자 이름마다 그 줄을 구성하는 항목 목록이 있어요: 그 사람이 지불한 지출, 이미 기록된 송금, 아직 남은 송금. 각 목록의 합계는 같은 이름의 줄과 정확히 일치해요.',
  'help.guide.final-budget.result':
    '“잔액”은 지금 누가 받을 돈이 있고 누가 줄 돈이 있는지 보여 줘요. “최종 부담액”은 모두 돌려받은 뒤 각자에게 여행이 얼마 들었는지 보여 줘요.',
  'help.guide.final-budget.tip.1':
    '송금을 기록해도 누구의 최종 부담액도 바뀌지 않아요. 금액이 정산 대기에서 정산 완료로 옮겨질 뿐이에요.',
  'help.guide.final-budget.tip.2': '결제자가 없는 지출은 정산 제안에서 빠지는 것처럼 두 카드에서도 빠져요.',
  // expense-from-booking
  'help.guide.expense-from-booking.title': '예약을 지출로 만들기',
  'help.guide.expense-from-booking.goal': '항공편, 숙소, 장소에 실제로 든 비용을 해당 기록에 붙여요.',
  'help.guide.expense-from-booking.step.1': '‘교통’이나 ‘예약’ 탭에서 예약을 찾아 카드 위쪽의 연필을 클릭하세요.',
  'help.guide.expense-from-booking.step.2':
    '양식 끝 쪽의 “비용”까지 스크롤하세요. 예약을 먼저 저장하는 “지출 만들기”와, 이미 “비용”에 있는 지출을 연결하는 “기존 지출 연결”이 있어요.',
  'help.guide.expense-from-booking.step.3':
    '‘지출 만들기’를 클릭하세요. 예약이 저장되고 양식이 닫힌 뒤 비용 편집기가 열려요. 예약 제목이 이름으로, 유형에 맞는 카테고리가, 예약 날짜가 지출 날짜로 채워져 있어요.',
  'help.guide.expense-from-booking.step.4':
    '다른 지출처럼 금액과 통화, 지불한 사람, 나누기를 입력하고 “지출 추가”를 클릭하세요. 예약을 다시 열면 “연결된 지출” 아래에 지출이 나오고, 편집하는 연필, 연결만 끊고 지출은 남기는 “연결 해제, 지출은 유지”, 삭제하는 휴지통이 있어요.',
  'help.guide.expense-from-booking.result':
    '예약에 비용이 표시되고, 지출은 “비용” 탭에 다른 지출처럼 지불한 사람, 나누기, 통화가 있는 일반 행으로 들어가요.',
  'help.guide.expense-from-booking.tip.1':
    '예약을 삭제하면 연결된 지출도 삭제되고, 확인 질문에서 알려 줘요. 예약의 ‘비용’ 블록에 있는 ‘지출 삭제’는 반대로 지출만 삭제하고 예약은 남겨요. ‘연결 해제, 지출은 유지’는 둘 다 남겨요.',
  'help.guide.expense-from-booking.tip.2':
    '장소 양식에도 같은 블록이 있고, ‘지출 만들기’를 누르면 장소를 먼저 저장해요.',
  // costs-table
  'help.guide.costs-table.title': '표로 비용 계획하기',
  'help.guide.costs-table.goal': '지출을 표로 보고 고쳐요. 카테고리별로 정렬되고, 1인당과 하루당 금액이 계산돼요.',
  'help.guide.costs-table.step.1':
    '바의 “목록” / “표” 전환에서 두 번째 아이콘 “표”를 클릭하세요. 장부 대신 같은 지출이 표로 나오고, 검색과 필터도 그대로 적용돼요.',
  'help.guide.costs-table.step.2':
    '표는 카테고리별로 묶여 있어요. 그룹 헤더에 이름, 지출 수, 소계가 보이고, 헤더를 클릭하면 그룹이 접혀요. 열은 ‘이름’, ‘날짜’, ‘합계’, ‘인원’, ‘일’이고, 이어서 이를 바탕으로 계산한 ‘1인당’, ‘일당’, ‘1인/일’이 회색 배경으로 나와요. 맨 아래 ‘합계’ 줄에서 모두 더해요.',
  'help.guide.costs-table.step.3':
    '셀을 클릭하면 바로 바꿀 수 있어요: 이름, 합계, “인원”, “일”. 입력한 뒤 Enter를 누르거나 다른 곳을 클릭하면 저장되고, Esc를 누르면 취소돼요. 날짜를 누르면 달력이 열려요. “1인당”과 다른 계산 열은 바로 업데이트돼요.',
  'help.guide.costs-table.step.4':
    '자물쇠가 붙은 합계는 여기서 바꿀 수 없어요. 누군가 결제했거나 다른 통화로 입력된 금액이고, 툴팁에 이유가 나와요. 클릭하면 대신 지출이 열려서 잔액과 고정된 환율이 정확하게 유지돼요.',
  'help.guide.costs-table.step.5':
    '카테고리 끝의 “지출 추가”를 누르면 그 카테고리에 “새 항목”이라는 행이 추가되고, 날짜는 그 카테고리의 가장 최근 항목 날짜로 정해져요. 이름 입력란이 이미 열려 있어서 바로 바꿀 수 있어요. 합계도 같은 방식으로 입력하세요.',
  'help.guide.costs-table.step.6':
    '이 보기에서는 오른쪽 열에 ‘카테고리별’ 대신 ‘요약’이 보여요. 지출을 네 가지로 합산해요: ‘카테고리’, ‘날짜’, ‘결제자’(아직 결제하지 않은 건 ‘아직 결제자 없음’), 그리고 ‘지불됨’과 ‘미결’을 비교하는 ‘상태’.',
  'help.guide.costs-table.result':
    '모든 지출이 카테고리별로 1인당, 하루당 금액과 함께 보여요. 칸에서 합계를 바꾸면 위 카드와 ‘요약’도 바로 바뀌어요.',
  'help.guide.costs-table.tip.1': '‘비용’은 이 브라우저에서 보기를 기억해서, 다시 ‘목록’을 클릭할 때까지 표로 열려요.',
  'help.guide.costs-table.tip.2':
    '“직접 설정”이나 “영수증”으로 나눈 지출은 1인당 몫이 하나로 정해지지 않아서 “1인당”과 “1인/일”이 비어 있어요.',
  'help.guide.costs-table.tip.3':
    '지불한 사람, 나누기, 메모, 영수증은 지출 자체에서 편집해요. 행 끝의 “추가 옵션”에 “편집”과 행을 지우는 “삭제”가 있어요.',

  // ── Screen: trip-transports ───────────────────────────────────────────────────────────
  'help.ctx.trip-transports.title': '교통',
  'help.ctx.trip-transports.summary':
    '들를 곳 사이를 오가는 모든 이동이에요: 항공편, 기차, 버스, 차량, 택시, 자전거, 크루즈, 페리, 케이블카, 그리고 TREK가 찾아 주는 대중교통 연결. 이 탭에 목록으로 나와요. 계획에서도 만들고 볼 수 있고, 지도에도 그려져요.',
  'help.ctx.trip-transports.bullet.1':
    '이 탭에는 이동만 나와요. 숙박, 식당, 이벤트, 티켓은 ‘예약’ 탭에 있어서 같은 항목이 두 번 나오지 않아요.',
  'help.ctx.trip-transports.bullet.2':
    '위쪽 바에는 ‘검색’, 상태, 유형, 동행자로 거르는 ‘필터’, 세 가지 보기 ‘카드’, ‘목록’, ‘타임라인’, ‘보기 옵션’, 보이는 내용을 내려받는 ‘스프레드시트로 내보내기 (CSV)’가 있어요. 오른쪽 ‘교통’으로 이동을 직접 추가해요. 그 앞의 ‘예약 확인서 가져오기’와 ‘AirTrail에서 가져오기’ 아이콘은 서버가 확인서를 읽을 수 있거나 AirTrail이 연결돼 있을 때 보여요. 빈 탭에서는 같은 작업이 가운데에 ‘교통’, ‘파일에서 가져오기’, AirTrail로 나와요.',
  'help.ctx.trip-transports.bullet.3':
    '탭은 ‘카드’ 보기로 열려요: ‘확정됨’ 다음 ‘대기 중’이고, 구역 제목을 클릭하면 접혀요. 계획한 대중교통 연결은 상태가 없어서 확정된 이동 사이에 시간순으로 나오는데, ‘보기 옵션’에서 따로 구역을 주면 ‘자동 대중교통’에 모여요. ‘목록’은 날짜별로 묶고, ‘타임라인’은 모든 이동을 여행 기간 위에 보여 줘요.',
  'help.ctx.trip-transports.bullet.4':
    '카드 위쪽 띠는 상태에 따라 색이 달라요: 확정은 초록색, 대기 중은 주황색, 계획한 연결은 파란색. 띠에 상태 점, 유형, 제목, 연필, 휴지통이 있어요. 그 아래에 날짜, 시간, ‘예약 코드’, ‘경로’, 그리고 항공사와 항공편 번호 또는 열차 번호, 승강장, 좌석이 보여요. 카드를 클릭하면 상세 정보가 열려요.',
  'help.ctx.trip-transports.bullet.5':
    '계획에서도 교통을 만들 수 있어요: 날 헤더의 +(툴팁 ‘날에 추가’)나 헤더 오른쪽 클릭에 ‘교통 추가’와 ‘대중교통’이 있어요. 두 들를 곳 사이의 이동 시간 연결선은 그 구간만 같은 검색을 열어요.',
  'help.ctx.trip-transports.bullet.6':
    '양 끝이 정해진 교통은 지도에 선을 그려요. 일정 줄의 경로 아이콘이나 상세 정보의 ‘지도에서’로 그 선을 켜요. 날 목록 위 도구 모음의 ‘모든 예약 경로 표시’로 여행 전체의 선을 켜거나 꺼요.',
  // transports-list
  'help.guide.transports-list.title': '“교통” 탭 살펴보기',
  'help.guide.transports-list.goal': '무언가를 바꾸기 전에 목록에 무엇이 표시되는지 알아봐요.',
  'help.guide.transports-list.step.1':
    '‘교통’은 ‘계획’(투어 애드온이 켜져 있으면 ‘투어’) 다음에 있는 여행 탭이에요. 이동만 담겨요. 호텔, 식당, 이벤트, 티켓은 ‘예약’ 탭에 있어요.',
  'help.guide.transports-list.step.2':
    '바 왼쪽의 ‘검색’은 입력하는 대로 이동 목록을 걸러 줘요. 그 옆 깔때기 모양 ‘필터’를 누르면 선택지가 열려요: ‘상태’(‘전체’, ‘확정됨’, ‘대기 중’)와, 사용 중인 유형이 개수와 함께 나와요. 유형을 하나 이상 체크하면 그 유형만 보여요. 깔때기 위 숫자는 켜진 필터 수이고, 바에는 ‘4개 중 1개’처럼 보이는 이동 수가 나와요. 메뉴 아래쪽 ‘필터 초기화’를 누르면 다시 모두 보여요.',
  'help.guide.transports-list.step.3':
    '옆의 “카드”, “목록”, “타임라인”으로 교통을 카드, 일자별로 묶인 행, 여행 일자에 걸친 막대로 볼 수 있어요. 슬라이더 아이콘 “보기 옵션”에서 “카드”와 “목록”의 “그룹 기준”과 “정렬”, “타임라인”의 레인을 정해요. “보기 초기화”로 기본값으로 돌아가요. “카드”에서 “대중교통을 별도 구역으로”를 켜면 계획한 대중교통 경로가 “자동 대중교통” 아래에 모여요.',
  'help.guide.transports-list.step.4':
    '카드마다 모든 정보가 나와요. 맨 위 띠는 “확정됨”이면 초록색, “대기 중”이면 주황색이고, 상태 점, 유형, 제목이 있어요. 그 아래 “날짜”에는 걸친 날과 날짜가 나와요. 이어서 “시간”, “예약 코드”, 정류장 사이에 유형 아이콘이 있는 “경로”, 그리고 항공사와 항공편 번호 또는 열차 번호, 승강장, 좌석이 나와요. 카드를 클릭하면 상세 정보가 열려요.',
  'help.guide.transports-list.step.5':
    '상태 점을 클릭하면 ‘대기 중’과 ‘확정됨’이 바뀌어요. 툴팁에 ‘대기 중으로 설정’처럼 어느 쪽으로 바뀌는지 나와요. 헤더의 연필은 교통 양식을 열고, 휴지통은 ‘예약을 삭제할까요?’라고 물은 뒤 삭제해요. 이때 연결된 비용을 포함해 무엇이 삭제되는지 알려 줘요.',
  'help.guide.transports-list.result': '카드마다 예약 여부가 보이고, 바로 언제든 목록을 걸러 보거나 정렬할 수 있어요.',
  'help.guide.transports-list.tip.1':
    '탭이 설정을 기억해요: 보기, 그룹, 정렬은 이 브라우저에서, 접은 구역은 여행마다, 필터는 브라우저 탭을 닫을 때까지.',
  'help.guide.transports-list.tip.2':
    '‘교통’ 앞의 아이콘 두 개 ‘예약 확인서 가져오기’와 ‘AirTrail에서 가져오기’는 서버가 확인서를 읽을 수 있을 때, AirTrail 인스턴스가 연결돼 있을 때만 보여요. 없으면 직접 입력하거나 대중교통 검색으로 목록을 채워요.',
  // add-transport
  'help.guide.add-transport.title': '일자에 교통 추가하기',
  'help.guide.add-transport.goal': '한 일정에서 다음 일정으로 가는 교통편을 해당 일자에 추가해요.',
  'help.guide.add-transport.step.1':
    '이동하는 날의 헤더에서 툴팁이 ‘날에 추가’인 +를 클릭하고 ‘교통 추가’를 고르세요. 날 헤더를 오른쪽 클릭해도 같은 메뉴가 나와요. 그날이 이미 채워진 양식이 열려요.',
  'help.guide.add-transport.step.2':
    '헤더의 유형 버튼에 교통 유형이 보이고, 기본값은 ‘비행’이에요. 클릭하면 ‘비행’, ‘기차’, ‘버스’, ‘차량’, ‘택시’, ‘자전거’, ‘크루즈’, ‘페리’, ‘케이블카’, ‘기타’를 고를 수 있고, 양식도 맞춰 바뀌어요: 항공편은 경유지마다 공항, 기차는 이어지는 역, 크루즈는 ‘승선’, ‘기항지’, ‘하선’, 차량은 ‘픽업’, ‘반납’, ‘가는 길의 경유지’가 생겨요.',
  'help.guide.add-transport.step.3':
    '맨 위 띠의 회색 예시 글자 자리에 제목을 바로 입력하세요. 필수 항목은 제목뿐이에요. 입력하기 전에는 아래 줄에 “제목 *”이 표시되고 “추가”가 회색으로 비활성화돼요. 출발 안내판에서 알아볼 만한 제목을 쓰세요.',
  'help.guide.add-transport.step.4':
    '“경로” 아래의 출발지와 도착지에는 역, 항구, 주소를 입력해요. 입력하기 전에는 여행의 장소가 먼저 추천돼요. 세 글자 이상 입력하면 검색되니 결과를 고르세요. 결과에서 고르지 않고 입력만 한 이름은 저장되지 않고 지도에도 표시되지 않아요.',
  'help.guide.add-transport.step.5':
    '‘날짜’와 ‘시작 시간’은 출발 시점, ‘종료 날짜’와 ‘종료 시간’은 도착 시점이에요. 다음 날 도착하는 이동이면 다음 날로 정하세요. 아래쪽 ‘예약 코드’와 ‘메모’는 선택이에요. 헤더의 ‘대기 중’ 버튼을 클릭하면 ‘확정됨’으로 바뀌어요.',
  'help.guide.add-transport.step.6': '‘추가’를 클릭하세요.',
  'help.guide.add-transport.result':
    '교통이 그날 들를 곳 사이 시간 자리에 줄로 들어가고, ‘교통’ 탭의 ‘대기 중’ 또는 ‘확정됨’에 카드로 생겨요.',
  'help.guide.add-transport.tip.1':
    '행은 시작 시간에 따라 그보다 먼저 시작하는 마지막 일정 뒤에 놓여요. 손잡이를 드래그해 그날의 다른 위치나 다른 일자로 옮길 수 있어요.',
  'help.guide.add-transport.tip.2':
    '티켓은 “파일” 아래의 “파일 첨부”로 추가하세요. “비용” 아래의 “지출 만들기”를 누르면 예약이 저장되고 요금을 입력할 비용 편집기가 열려요.',
  'help.guide.add-transport.tip.3':
    '양식의 첫 블록 “동행자”에서 이 교통을 누가 이용하는지 정해요. 여행 멤버가 두 명 이상이고 교통에 사람이 지정되어 있으면, 탭의 “필터”에 “동행자”도 나와서 한 사람의 교통만 볼 수 있어요.',
  // import-transport-file
  'help.guide.import-transport-file.title': '전자 항공권에서 항공편 가져오기',
  'help.guide.import-transport-file.goal':
    '운송사가 보낸 티켓에서 TREK가 항공편, 기차, 페리를 읽어 오고, 저장 전에 확인해요.',
  'help.guide.import-transport-file.step.1':
    '‘교통’ 탭 바에서 ‘교통’ 앞의 다운로드 아이콘(툴팁 ‘예약 확인서 가져오기’)을 클릭하세요. ‘예약’ 탭과 같은 이름의 창이 열려요. 빈 탭에서는 가운데 ‘파일에서 가져오기’가 같은 기능이에요.',
  'help.guide.import-transport-file.step.2':
    '티켓을 상자에 끌어다 놓거나 상자를 클릭해 파일을 고르세요: EML, PDF, PKPass, HTML, TXT 파일을 각 10MB까지 최대 다섯 개 올릴 수 있고, 서버에 읽을 수 있는 AI 모델이 있으면 티켓 사진(JPG, PNG, WEBP)도 돼요. 고른 파일 이름이 상자에 보여요.',
  'help.guide.import-transport-file.step.3': '‘가져오기’를 클릭하세요. 창이 바로 닫히고, 파일은 백그라운드에서 읽어요.',
  'help.guide.import-transport-file.step.4':
    '오른쪽 아래 카드의 파일 이름 아래에 진행 상황이 보여요. 다 읽으면 ‘파일 분석 중…’이 체크로 바뀌고 카드에 ‘가져오기’가 나와요. 클릭하세요.',
  'help.guide.import-transport-file.step.5':
    '항공편은 내용이 채워진 채로 “교통 추가”에서 열려요. 유형은 “비행”, 헤더 제목에는 항공사와 항공편 번호, “경로” 아래에는 “출발”과 “도착” 공항과 각 시간 및 시간대, 그리고 “항공사”, “항공편 번호”, “예약 코드”, “파일” 아래의 티켓까지 들어 있어요. 확인하고 “추가”를 클릭하세요.',
  'help.guide.import-transport-file.result':
    '항공편이 “교통” 탭의 “대기 중” 아래에 카드로, 출발일에는 행으로 나타나고, 티켓은 “파일” 아래에 있어요. 두 공항을 모두 알면 지도에 항공편이 곡선으로 표시돼요.',
  'help.guide.import-transport-file.tip.1':
    '두 탭은 같은 가져오기 기능을 써요. 항공편과 호텔이 함께 든 파일은 어느 탭에서 시작했든 항공편은 “교통 추가”로, 호텔은 “새 예약”으로 차례로 열려요.',
  'help.guide.import-transport-file.tip.2':
    '공항은 코드로 위치를 찾아요. 역이나 항구의 위치를 찾지 못하면 오른쪽 아래 가져오기 카드에 이름이 주황색으로 표시돼요. “추가”를 클릭하기 전에 “경로”에서 직접 고르세요. 그러지 않으면 교통이 지도에 표시되지 않아요.',
  // plan-transit
  'help.guide.plan-transit.title': '대중교통 연결 계획하기',
  'help.guide.plan-transit.goal':
    'TREK가 하루 중 두 지점 사이의 실제 기차와 버스를 찾게 하고, 고른 것을 계획에 넣어요.',
  'help.guide.plan-transit.step.1':
    '날 헤더의 +를 클릭하고 ‘대중교통’을 고르세요. 그날 검색이 열려요: 헤더에 날이 버튼으로 보이고, 옆의 ‘직접’과 ‘자동’으로 이 검색과 일반 양식을 오가요.',
  'help.guide.plan-transit.step.2':
    '출발지와 도착지에는 정류장이나 역을 넣어요. 칸이 비어 있으면 TREK가 그날 숙소, 그날 예약에 있는 역과 공항, 그날 들를 곳을 제안해요. 두 글자를 입력하면 대신 시간표의 역을 검색해요. 두 칸 사이의 교체 버튼으로 출발지와 도착지를 맞바꿔요.',
  'help.guide.plan-transit.step.3':
    '“출발 시각” 또는 “도착”과 시간으로 언제 이동할지 정하고, “최적 경로”, “환승 최소”, “도보 최소”로 결과 정렬 방식을 정하세요.',
  'help.guide.plan-transit.step.4':
    '아래 칩은 이용할 수 있는 교통수단이에요: “기차”, “지하철”, “트램”, “버스”, “페리”, “케이블카”. 끄면 그 수단은 제외되고, 최소 하나는 켜져 있어야 해요. 그런 다음 “검색”을 클릭하세요.',
  'help.guide.plan-transit.step.5':
    '결과마다 출발과 도착, 소요 시간, 환승 횟수, 도보 거리, 노선 배지가 나오고, 시간표에 노선 색이 있으면 그 색으로 표시돼요. 결과를 클릭하면 구간별로 펼쳐져 타고 갈아타는 정류장, 승강장, 노선 사이 도보 구간을 볼 수 있어요.',
  'help.guide.plan-transit.step.6': '“날에 추가”를 클릭하세요.',
  'help.guide.plan-transit.result':
    '연결이 노선 배지와 함께 그날 한 줄로 들어가요. 화살표를 클릭하면 구간마다 보여요. ‘교통’ 탭에도 확정된 이동 사이에 파란색 카드로 나와요.',
  'help.guide.plan-transit.tip.1':
    '연결 정보는 공개 시간표 데이터를 쓰는 무료 커뮤니티 서비스 Transitous에서 가져와요. 키도 계정도 필요 없어요. 관리자가 Google로 검색하도록 바꿀 수 있어요.',
  'help.guide.plan-transit.tip.2':
    '결과가 없나요? 피드는 지역과 기간별로 제공돼요. 다른 시간을 시도하거나, 이동 수단을 더 켜거나, 장소 대신 역을 골라 보세요. 메시지에 응답한 서비스 이름이 나와요. 날짜가 없는 여행은 검색할 날이 없어서 일반 양식만 있어요.',
  'help.guide.plan-transit.tip.3':
    '구간 하나에 대해서도 같은 검색이 열려요: 두 들를 곳 사이 이동 시간 연결선을 클릭하고 ‘대중교통’을 고르세요. 출발지, 도착지, 출발 시간이 미리 채워져요.',
  // change-transit-route
  'help.guide.change-transit-route.title': '계획한 대중교통 경로 열고 바꾸기',
  'help.guide.change-transit-route.goal': '경로를 한 구간씩 확인하고, 이름을 바꾸거나 경로를 다시 검색해요.',
  'help.guide.change-transit-route.step.1':
    '“교통” 탭에서 계획한 대중교통 경로는 위쪽 띠가 파란 카드로, 확정된 교통과 함께 시간순으로 나와요. “보기 옵션”에서 “대중교통을 별도 구역으로”를 켜면 대신 “자동 대중교통” 아래에 나와요. 카드를 클릭하면 경로가 예약으로 열려요.',
  'help.guide.change-transit-route.step.2':
    '맨 위 타일에 출발과 도착 정류장, “기간”, “환승”, “도보”가 나와요. 그 아래 “여정”에서 경로를 한 구간씩 시간, 승강장, 노선 사이 도보 구간과 함께 볼 수 있어요.',
  'help.guide.change-transit-route.step.3':
    '예약 아래쪽 ‘경로 변경’을 누르면 이 연결의 양 끝과 날짜가 채워진 검색이 다시 열려요.',
  'help.guide.change-transit-route.step.4':
    '‘검색’을 클릭하고 다른 연결을 펼쳐 ‘날에 추가’를 클릭하면 이전 연결을 대신해요. 예약 아래쪽 맨 오른쪽 ‘편집’을 누르면 대신 일반 교통 양식이 열리고, 거기서 ‘예약 코드’, 동행자, 메모, 파일을 고칠 수 있어요.',
  'help.guide.change-transit-route.result': '이제 새 일정으로 이동하고, ‘교통’ 탭의 카드에 새 노선과 시간이 보여요.',
  'help.guide.change-transit-route.tip.1':
    '예약 헤더의 제목을 클릭하면 경로는 그대로 두고 이름만 바꿀 수 있어요. 메모는 “편집”으로 여는 교통 양식에서 적으세요.',
  'help.guide.change-transit-route.tip.2':
    '예약 맨 아래의 휴지통을 누르면 확인 후 경로가 삭제돼요. 그날의 일정은 그대로 남아요.',
  // leg-travel-mode
  'help.guide.leg-travel-mode.title': '한 구간의 이동 수단 바꾸기',
  'help.guide.leg-travel-mode.goal':
    '자동차로 이동하는 날의 한 구간을 도보로 바꾸거나, 그 구간을 대중교통 검색으로 계획해요.',
  'help.guide.leg-travel-mode.step.1':
    '들를 곳 사이 연결선은 그날 경로를 켜야 보여요. 날 헤더를 클릭해 열고, 들를 곳 아래 바에서 ‘경로’를 클릭하세요.',
  'help.guide.leg-travel-mode.step.2':
    '연결선마다 그 구간의 이동 시간과 거리가, 경로를 계산한 이동 수단 아이콘과 함께 보여요: 자동차는 차, 도보는 발, 자전거는 자전거 아이콘이에요.',
  'help.guide.leg-travel-mode.step.3':
    '연결선을 클릭하세요. 메뉴에 ‘자동차’, ‘도보’, ‘자전거’, 이 구간만 쓰는 ‘대중교통’, ‘하루 기본값 사용’이 있어요.',
  'help.guide.leg-travel-mode.step.4': '‘도보’를 고르세요. 이 구간만 바뀌고, 그날 나머지 구간은 원래 수단 그대로예요.',
  'help.guide.leg-travel-mode.result':
    '그 구간에 발 아이콘과 걷는 시간이 보이고, 그날 다른 구간은 원래 수단 그대로예요.',
  'help.guide.leg-travel-mode.tip.1':
    '이동 수단은 날이 아니라 구간에 속해요. 하루 전체의 ‘자동차’, ‘도보’, ‘자전거’ 버튼은 직접 정한 구간을 덮어쓰지 않아요. ‘하루 기본값 사용’을 누르면 그 구간이 다시 그 버튼을 따라요.',
  'help.guide.leg-travel-mode.tip.2':
    '같은 메뉴의 “대중교통”을 누르면 바로 이 구간의 경로 검색이 열리고, 출발지와 도착지, 출발 시간이 이미 채워져 있어요.',
  'help.guide.leg-travel-mode.tip.3':
    '시간은 실제 도로와 보행로를 기준으로 공용 라우터가 계산해요. 라우터가 계산하지 못한 구간은 직선으로 남고 시간이 표시되지 않아요.',
  // edit-transport
  'help.guide.edit-transport.title': '교통 수정하거나 삭제하기',
  'help.guide.edit-transport.goal': '시간, 승강장, 예약 코드를 고치거나 여행에서 교통을 삭제해요.',
  'help.guide.edit-transport.step.1':
    '일정에서 교통은 들를 곳 사이의 줄로, 유형별로 색이 달라요. 클릭하면 예약이 열려요: 위쪽에는 상태, 유형, 날짜, ‘예약 코드’(복사 버튼 포함)가 버튼으로 나오고, 아래에는 출발과 도착 시간이 공항이나 역과 함께 나와요.',
  'help.guide.edit-transport.step.2':
    '예약 아래쪽 ‘편집’을 누르면 처음 만든 양식이 열리고, 헤더 제목 위에 ‘교통 편집’이 보여요. 여기서 모든 걸 바꿀 수 있어요: 제목, 상태와 유형 버튼, 경로, 날짜와 시간, ‘예약 코드’.',
  'help.guide.edit-transport.step.3':
    '항공편 경로는 공항이, 기차는 역이, 크루즈는 항구가 이어진 거예요. ‘경유지 추가’(크루즈는 ‘기항지 추가’)로 사이에 하나를 더 넣고, 구간마다 시간과 항공편 번호나 열차 번호가 따로 있어요.',
  'help.guide.edit-transport.step.4':
    '‘업데이트’를 클릭하세요. 교통을 완전히 삭제하려면 같은 바 왼쪽의 휴지통, 예약 아래쪽 휴지통, ‘교통’ 탭 카드의 휴지통 중 하나를 쓰고 확인하세요.',
  'help.guide.edit-transport.result': '‘교통’ 탭, 운행하는 날, 지도의 선까지 교통이 보이는 모든 곳에 반영돼요.',
  'help.guide.edit-transport.tip.1':
    '같은 양식을 두 곳에서 열 수 있어요. 일정표의 행에서 여는 예약의 “편집”, 그리고 “교통” 탭 카드의 연필 아이콘이에요. 계획한 대중교통 경로도 예약으로 열려요. 거기서 “경로 변경”은 검색을 다시 열고, “편집”은 이 양식을 열어요.',
  'help.guide.edit-transport.tip.2':
    '교통을 다른 일자로 옮길 때는 양식이 필요 없어요. 행을 한 일자 카드에서 다른 카드로 드래그하세요.',
  // transport-on-map
  'help.guide.transport-on-map.title': '지도에 교통 표시하기',
  'help.guide.transport-on-map.goal': '항공편, 자동차 이동, 대중교통 경로가 실제로 지나는 길을 봐요.',
  'help.guide.transport-on-map.step.1':
    '양 끝이 정해진 교통은 일정의 줄에 작은 경로 아이콘이 있어요. 클릭하면 툴팁이 ‘예약 경로 숨기기’로 바뀌어요.',
  'help.guide.transport-on-map.step.2': '지도에 경로가 그려지고, 양 끝에 교통 아이콘이 든 버튼 모양 표시가 생겨요.',
  'help.guide.transport-on-map.step.3':
    '끝 표시를 클릭하면 지도 위에 예약이 열려요. 헤더에 상태, 유형, 날짜, ‘예약 코드’가 있고, 그 아래에 공항이나 역과 함께 시간, 항공사, 항공편 번호가 나와요. 헤더의 ‘닫기’로 닫아요.',
  'help.guide.transport-on-map.step.4':
    '일자 위 도구 모음의 경로 아이콘은 여행 전체에 한 번에 적용돼요. “모든 예약 경로 표시”로 보여 주고, “모든 예약 경로 숨기기”로 다시 숨겨요.',
  'help.guide.transport-on-map.step.5':
    '계획한 대중교통 경로에는 별도의 경로 아이콘이 없어요. 그날의 “경로” 토글로 그려지기 때문에, 그날 경로가 켜져 있는 동안에는 “모든 예약 경로 숨기기”를 눌러도 숨겨지지 않아요.',
  'help.guide.transport-on-map.result': '경로가 양쪽 끝에 표시와 함께 지도에 그려지고, 끌 때까지 그대로 남아요.',
  'help.guide.transport-on-map.tip.1':
    '항공편, 크루즈, 페리는 곡선으로 그려져요. 자동차, 버스, 택시, 자전거는 실제 도로를 따라가요. 기차와 계획한 대중교통 경로는 정차하는 역을 지나가요.',
  'help.guide.transport-on-map.tip.2':
    '확정된 예약은 실선, 대기 중인 예약은 점선이에요. ‘예약 경로 레이블’ 설정을 켜면 끝 표시에 공항 코드나 역 이름이 보여요.',
  'help.guide.transport-on-map.tip.3':
    '‘모든 예약 경로 표시’는 지금 켠 경로에 더하는 게 아니라, 아이콘으로 하나씩 정한 설정을 대신해요. 누르고 나면 모든 경로가 다 보이거나 다 숨겨져요.',
  // airtrail-import
  'help.guide.airtrail-import.title': 'AirTrail에서 항공편 가져오기',
  'help.guide.airtrail-import.goal':
    'AirTrail에 있는 항공편을 한 번에 여행으로 가져오고, 이후에도 AirTrail 기준으로 계속 업데이트해요.',
  'help.guide.airtrail-import.step.1':
    'AirTrail 애드온이 켜져 있고 “설정”의 “통합”에서 인스턴스를 연결했다면, “교통” 탭 바의 “교통” 앞에 비행기 아이콘 “AirTrail에서 가져오기”가 나와요. 클릭하세요.',
  'help.guide.airtrail-import.step.2':
    '“AirTrail에서 가져오기”에 내 계정의 항공편이 두 그룹으로 나와요. “이 여행 기간”에는 여행 기간 안의 항공편이 체크된 채로, “기타 항공편”에는 나머지가 체크되지 않은 채로 있어요. 이미 여행에 있는 항공편은 회색으로 표시되고 “가져옴”이 붙어요.',
  'help.guide.airtrail-import.step.3':
    '행마다 체크 상자와 함께 항공사와 항공편 번호, 두 공항, 날짜가 있어요. 행을 클릭해 항공편을 넣거나 빼세요. “기타 항공편”의 항공편은 체크해야만 가져와요.',
  'help.guide.airtrail-import.step.4':
    '이어지는 항공편은 함께 묶여요: 각 항공편이 앞 항공편이 착륙한 공항에서 하루 안에 출발하는 경우예요. 아래 체크박스 ‘그 공항을 경유하는 항공편 하나로 가져오기’는 이미 켜져 있어요. 경유 한 번짜리 예약으로 두려면 그대로 두고, 구간을 각각 항공편으로 가져오려면 끄세요.',
  'help.guide.airtrail-import.step.5':
    '오른쪽 아래 버튼을 클릭하세요. 버튼에 ‘2개 가져오기’처럼 체크한 항공편 수가 보여요. 이어서 가져온 항공편 수를 알려 줘요.',
  'help.guide.airtrail-import.step.6':
    '항공편이 ‘확정됨’에 카드로 들어가고, 제목 옆에 파란 AirTrail 표시가 붙으며, 운항하는 날에 줄로 보여요. 경유 항공편은 카드 하나이고, 경로가 경유지를 지나가요.',
  'help.guide.airtrail-import.result':
    'AirTrail의 항공편이 “교통” 탭에는 카드로, 해당 일자에는 행으로 나타나요. 각각 출처를 알려 주는 AirTrail 배지가 붙어 있어요.',
  'help.guide.airtrail-import.tip.1':
    '번호와 날짜가 같은 항공편이 이미 여행에 있으면 건너뛰고, 몇 개를 건너뛰었는지 메시지로 알려 줘요. 일자 위 도구 모음의 실행 취소 화살표로 가져오기 전체를 되돌릴 수 있어요.',
  'help.guide.airtrail-import.tip.2':
    '데이터의 기준은 계속 AirTrail이에요. TREK은 여행을 열 때와 백그라운드에서 몇 분마다 변경 사항을 읽어 와요. AirTrail에서 삭제한 항공편은 TREK에 카드가 남고 라벨이 “동기화되지 않음”으로 바뀌어요. TREK에서 수정한 내용은 “통합”에서 “변경 사항을 AirTrail에 다시 기록”이 켜져 있을 때만 AirTrail로 보내져요.',
  'help.guide.airtrail-import.tip.3':
    '합친 연결편은 동기화할 수 있는 하나의 AirTrail 항공편이 아니라서 한 번만 가져와요. 파란 배지가 그대로 있고, 배지에 마우스를 올리면 그렇게 안내해요. 동기화된 항공편에 경유지를 직접 추가해도 마찬가지예요.',

  // ── Screen: trip-roadtrip ─────────────────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': '로드트립',
  'help.ctx.trip-roadtrip.summary':
    '계획을 하나의 드라이브로 보여 줘요. 같은 일자와 장소가 경유지로 이어지고 그 사이의 운전 구간이 왼쪽 열의 레일과 지도에 표시돼요. 거리와 운전 시간, 주유가 필요한 곳, 길가에 있는 곳을 알려 줘요.',
  'help.ctx.trip-roadtrip.bullet.1':
    '왼쪽 열 맨 위의 “일”과 “로드트립”으로 일정표와 드라이브 보기를 전환해요. 아무것도 복사되거나 바뀌지 않아요. “일”에는 계획이 원래 모습 그대로 나와요.',
  'help.ctx.trip-roadtrip.bullet.2':
    '레일 위쪽에 여행 합계가 보여요: ‘거리’, ‘운전 시간’, ‘지점’. 그 아래 운전하는 날마다 카드가 있어요: 타일에 날 번호와 날짜, 그리고 킬로미터와 운전 시간, 들를 곳 수, 넘는 항목, ‘트랙’ 배지가 버튼으로 보여요. 예약한 항공편, 기차, 페리는 순서 안에 별도 카드로 나와요.',
  'help.ctx.trip-roadtrip.bullet.3':
    '번호가 붙은 곳은 그날의 목적지예요. 주유, 충전, 휴게소처럼 가는 길에 들르는 곳은 번호 대신 종류 아이콘이 붙고 번호에 포함되지 않아요. 번호를 클릭해 종류를 바꾸고, ‘머문 곳’ 배지를 클릭해 머무는 시간을 정하고, 들를 곳을 끌어 같은 날 안이나 다른 날로 옮겨요.',
  'help.ctx.trip-roadtrip.bullet.4':
    '두 정차지 사이의 운전 띠에 구간 거리와 시간이 나와요. 클릭하면 “이 구간을 가는 방법”이 열리고, 지도의 경로를 클릭하면 구간이 경유 지점을 지나도록 바꿀 수 있어요.',
  'help.ctx.trip-roadtrip.bullet.5':
    '오른쪽 열이 ‘경로 중간’으로 바뀌어요. 찾을 대상과 날을 한 줄에서 고르고, 경로 양옆으로 얼마나 넓게 찾을지 정한 뒤 ‘검색’하세요. 결과의 + 버튼 ‘추가’는 실제로 지나가는 지점에 맞춰 주행에 넣고, 호텔의 침대 아이콘은 하룻밤 숙박을 추가해요. ‘직접’으로 검색에 안 나온 곳을 추가하고, 제목 옆 점 세 개로 Google Maps 경로를 가져와요.',
  'help.ctx.trip-roadtrip.bullet.6':
    '그 아래 ‘주행 설정’에는 제한, 차량과 주행 가능 거리, 하루 이동 시간, 피할 것, 선을 그리는 방식, 현재 경고를 지도에 표시할지가 있어요. 이 설정은 여행에 속하므로 모두 같은 차로 계획해요.',
  // roadtrip-mode
  'help.guide.roadtrip-mode.title': '여행을 하나의 드라이브로 보기',
  'help.guide.roadtrip-mode.goal': '계획을 로드 트립 모드로 바꾸고 레일에 나오는 내용을 알아봐요.',
  'help.guide.roadtrip-mode.step.1':
    '왼쪽 열 맨 위 ‘일’과 ‘로드트립’ 전환에서 ‘로드트립’을 클릭하세요. 일정 대신 주행이 보이고, 지도에 경로가 있는 모든 날이 보여요.',
  'help.guide.roadtrip-mode.step.2':
    '레일 맨 위 카드에 여행 전체의 ‘거리’, ‘운전 시간’, ‘지점’ 합계가 나와요. 날을 스크롤해도 제자리에 고정돼요.',
  'help.guide.roadtrip-mode.step.3':
    '그 아래에 운전하는 날마다 카드가 있고, 운전하지 않는 날은 빠져요. 카드 헤더에 날 번호와 그 아래 날짜, 그리고 주행 거리와 시간, 그날 들를 곳 수 버튼이 보여요.',
  'help.guide.roadtrip-mode.step.4':
    '카드 안에서 하루가 순서대로 이어져요: 장소마다 번호 붙은 들를 곳, 들를 곳 사이마다 운전 구간, 오른쪽 끝에 도착 시간. 예약한 항공편, 기차, 페리는 그 순서 안에 별도 카드로 보여요.',
  'help.guide.roadtrip-mode.step.5':
    '날 헤더를 클릭하면 접히고, 끝의 화살표가 돌아가요. 접힌 날은 지도에서도 숨겨져요. 헤더를 다시 클릭하면 다시 보여요.',
  'help.guide.roadtrip-mode.result':
    '왼쪽 열에 주행이, 지도에 주행하는 모든 날이 보여요. ‘일’을 누르면 바로 원래 계획으로 돌아가고, 계획은 바뀌지 않아요.',
  'help.guide.roadtrip-mode.tip.1':
    '이 선택은 여행마다 계정에 저장돼요. 새로 고침하거나 다른 브라우저, 다른 기기에서 열어도 여행이 로드트립 보기로 열려요.',
  'help.guide.roadtrip-mode.tip.2':
    '이 스위치는 관리자가 관리자 패널의 “애드온”에서 “로드트립” 애드온을 켜야 나타나요.',
  'help.guide.roadtrip-mode.tip.3': '휴대폰에는 스위치가 없어요. 애드온이 “계획” 옆에 별도의 “로드트립” 탭을 추가해요.',
  // roadtrip-stops
  'help.guide.roadtrip-stops.title': '가는 길에 들르는 곳과 머무는 시간',
  'help.guide.roadtrip-stops.goal':
    '주행 경로의 장소를 가는 길에 들르는 곳으로 만들고, 들를 곳마다 머무는 시간을 정해요.',
  'help.guide.roadtrip-stops.step.1':
    '레일에서 들를 곳 앞의 번호를 클릭하세요. 레이블은 ‘경유 정차로 변경’이고, 아래에 들를 곳 종류가 색 동그라미 줄로 열려요.',
  'help.guide.roadtrip-stops.step.2':
    '종류를 고르세요. 동그라미에 마우스를 올리면 이름이 보여요: ‘숙박’, ‘연료’, ‘충전’, ‘휴게소’, ‘캠핑장’, ‘식사’, ‘명소’. 번호가 그 종류 아이콘으로 바뀌고, 그 아래 들를 곳 번호가 다시 매겨져요.',
  'help.guide.roadtrip-stops.step.3':
    '가는 길에 들르는 곳은 목적지가 아니라서 그날 헤더의 정차 수가 하나 적게 표시돼요.',
  'help.guide.roadtrip-stops.step.4':
    '아이콘을 다시 클릭해 “정차 유형 변경”을 열고 “다시 목적지로”를 고르면 정차지에 번호가 다시 붙어요.',
  'help.guide.roadtrip-stops.step.5':
    '들를 곳마다 ‘머문 곳’ 배지가 있고, 계획이 없으면 +가 보여요. 클릭하면 ‘이 경유지 체류 시간’이 열려요.',
  'help.guide.roadtrip-stops.step.6':
    '슬라이더, 빼기와 더하기 버튼, 또는 미리 설정된 값 중 하나로 머무는 시간을 정하세요. “도착”은 차가 도착하는 시각에 고정되고 “출발”이 바뀌어요. 그런 다음 “저장”을 클릭하세요.',
  'help.guide.roadtrip-stops.result':
    '바꾼 정차지의 “머문 곳” 배지에 새 시간이 표시되고, 그 뒤의 도착 시간이 모두 맞춰 옮겨져요. 유형을 바꿨다가 되돌린 정차지는 다시 번호가 붙은 목적지가 돼요.',
  'help.guide.roadtrip-stops.tip.1':
    '머무는 시간은 방문 한 번이 아니라 장소에 속해요. 이틀에 걸쳐 넣은 장소는 두 날 모두 머무는 시간이 같아요.',
  'help.guide.roadtrip-stops.tip.2':
    '가는 길에 들르는 곳은 ‘일’에도 보여요. ‘주행 설정’의 ‘편의시설 경유지’에서 ‘일별 보기에도 표시’를 끄면 ‘로드트립’에만 남아요.',
  'help.guide.roadtrip-stops.tip.3': '같은 창의 ‘체류 없음’으로 머무는 시간을 다시 지워요.',
  'help.guide.roadtrip-stops.tip.4':
    '가는 길에 들르는 곳이나 예약한 숙박을 클릭하면 지도 위에 카드가 열려요. “로드트립”이 켜져 있으면 거기서 “편집”을 눌렀을 때 장소 양식 대신 검색에서 쓰는 간단한 대화 상자가 열리고, 그 대화 상자의 “자세히 입력”을 누르면 전체 양식이 열려요.',
  // roadtrip-corridor
  'help.guide.roadtrip-corridor.title': '경로를 따라 주유소, 식당, 숙소 찾기',
  'help.guide.roadtrip-corridor.goal': '실제로 달리는 길을 따라 검색하고, 찾은 곳을 맞는 구간에 추가해요.',
  'help.guide.roadtrip-corridor.step.1':
    '“찾는 항목”에서 목록을 열고 필요한 것을 체크하세요. “연료”, “충전”, “휴게소”, “캠핑장”, “숙박”, “식사”, “명소”를 함께 고를 수 있어요. 목록은 다음 선택을 위해 열린 채로 있고, 입력란에 종류마다 아이콘이 표시돼요.',
  'help.guide.roadtrip-corridor.step.2':
    '같은 줄 끝 드롭다운에서 날을 고르세요. 레일에 카드가 있는 날이 나오고, 고른 날의 경로가 계산될 때까지 ‘검색’은 기다려요.',
  'help.guide.roadtrip-corridor.step.3':
    '‘반경’에서 도로 양옆으로 얼마나 멀리 찾을지 2km, 5km, 10km 중에 고르고 ‘검색’을 클릭하세요.',
  'help.guide.roadtrip-corridor.step.4':
    '결과는 종류별로, 지나가는 순서대로 묶여 나와요. 각 결과에 경로에서 얼마나 떨어져 있는지, 그날 주행의 어느 지점쯤인지 보여요.',
  'help.guide.roadtrip-corridor.step.5':
    '결과의 + 버튼 ‘추가’를 클릭하세요. ‘경유지로 추가’에서 어느 날 몇 번째에 들어가는지 알려 주고, ‘경유지 종류’와 ‘이 경유지 체류 시간’을 물어봐요. 충전소라면 ‘이용 가능 여부와 요금’도 보여요. ‘추가’로 주행에 넣고, ‘자세히 입력’을 누르면 대신 전체 장소 양식이 열려요.',
  'help.guide.roadtrip-corridor.result':
    '추가한 곳이 실제로 지나는 지점에 종류 아이콘과 함께 경로에 들어가요. 그곳을 지나도록 그날 경로를 다시 계산하면서 목록이 비워지니, 다음 들를 곳은 다시 검색하세요.',
  'help.guide.roadtrip-corridor.tip.1':
    '“검색”을 누르기 전에는 아무것도 검색하지 않아요. 검색 한 번에 공용 서비스로 요청이 많이 가기 때문이에요.',
  'help.guide.roadtrip-corridor.tip.2':
    '“이름으로 필터”는 다시 검색하지 않고 결과를 좁히고, “결과 지우기”는 목록과 핀을 모두 지워요. 결과를 클릭하면 지도에 표시돼요.',
  'help.guide.roadtrip-corridor.tip.3':
    '지도의 결과를 경로 위로 드래그해도 돼요. 같은 길을 두 번 지날 때 구간을 직접 고를 수 있어요. “검색” 옆의 “직접”은 이름으로 찾아서 검색에 안 나온 장소를 추가해요.',
  // roadtrip-via
  'help.guide.roadtrip-via.title': '경유 지점으로 구간 경로 바꾸기',
  'help.guide.roadtrip-via.goal': '들를 곳을 추가하지 않고, 구간이 원하는 도로로 가게 해요.',
  'help.guide.roadtrip-via.step.1':
    '원하는 구간을 지도에 띄우세요: 레일에서 들를 곳을 클릭한 뒤, 지도 위에 열린 카드를 닫으세요.',
  'help.guide.roadtrip-via.step.2':
    '그려진 경로를 클릭하세요. 클릭한 구간에 경유 지점이 생기고, 그 지점을 지나도록 구간 경로를 다시 계산해요.',
  'help.guide.roadtrip-via.step.3':
    '레일이 업데이트돼요. 그날 헤더에 새 거리와 운전 시간이 나오고, 경유 지점 이후의 도착 시간도 모두 함께 바뀌어요.',
  'help.guide.roadtrip-via.step.4':
    '손잡이에 마우스를 올리면 사용법이 나와요: 드래그하면 경로 모양이 바뀌고, 오른쪽 클릭하면 삭제돼요. 다른 곳으로 드래그하면 구간이 새 지점을 지나도록 다시 그려져요.',
  'help.guide.roadtrip-via.step.5': '손잡이를 오른쪽 클릭하면 삭제돼요. 구간이 다시 직행 경로로 돌아가요.',
  'help.guide.roadtrip-via.result': '구간이 고른 길을 따라가고, 그날의 거리, 운전 시간, 도착 시간이 다시 계산돼요.',
  'help.guide.roadtrip-via.tip.1':
    '경유 지점은 들르는 곳이 아니에요. 번호, 머무는 시간, 도착 시간이 없고, 그날 들를 곳 수에도 들어가지 않아요.',
  'help.guide.roadtrip-via.tip.2': '손잡이는 확대 수준 9부터 보여서, 여행 전체가 보이는 지도에서는 선만 보여요.',
  'help.guide.roadtrip-via.tip.3':
    '그려진 구간에서 2km보다 먼 곳을 클릭하면 무시되고, 항공편, 기차, 페리 위를 클릭해도 마찬가지예요.',
  // roadtrip-alternatives
  'help.guide.roadtrip-alternatives.title': '구간을 다른 길로 가 보기',
  'help.guide.roadtrip-alternatives.goal':
    '드라이브의 한 구간에 대해 라우터가 제안하는 다른 경로를 보고 하나를 골라요.',
  'help.guide.roadtrip-alternatives.step.1':
    '사이드바에서 운전 띠를 클릭하세요. 두 정차지 사이에서 구간 거리와 시간을 보여 주는 줄이에요. 라벨은 “다른 경로”예요.',
  'help.guide.roadtrip-alternatives.step.2':
    '지도 위에 “이 구간을 가는 방법”이 열리고, 길마다 길이와 함께 항목이 하나씩 나와요. 지도에는 길마다 운전 시간이 표시되고, 지금 경로는 진한 파란색, 나머지는 연한 파란색으로 그려져요.',
  'help.guide.roadtrip-alternatives.step.3':
    '항목에 마우스를 올리면 그 도로가 강조돼요. ‘현재’는 지금 쓰는 도로, ‘가장 빠름’은 가장 빠른 도로이고, 나머지는 얼마나 더 느린지나 어떤 도로 등급을 피하는지 보여 줘요.',
  'help.guide.roadtrip-alternatives.step.4': '항목을 클릭하면 그 경로를 쓰고, ‘닫기’를 누르면 지금 경로를 그대로 둬요.',
  'help.guide.roadtrip-alternatives.result': '구간이 고른 도로를 쓰고, 옆 열의 거리와 그 뒤 도착 시간도 함께 바뀌어요.',
  'help.guide.roadtrip-alternatives.tip.1':
    '다른 길을 고르면 TREK이 먼저 로드트립 라우터로 그 길을 확인해요. 그런 다음 필요한 만큼만 경유 지점을 넣어 구간을 그 길로 유지하고, 구간에 있던 경유 지점은 대체해요. 라우터가 따라갈 수 없는 길은 저장되지 않아요. 라우터가 제안한 기본 길을 고르면 경유 지점이 다시 사라져요.',
  'help.guide.roadtrip-alternatives.tip.2':
    '“고속도로 제외”, “통행료 없음”, “페리 없음”은 속도 모델이 다른 두 번째 엔진에서 계산하므로, 그 시간은 다른 경로와 비교할 수 없어요.',
  // roadtrip-limits
  'help.guide.roadtrip-limits.title': '차량과 운전 한도 설정하기',
  'help.guide.roadtrip-limits.goal': '어떤 차를 타는지, 쉬지 않고 얼마나 운전할지 TREK에 알려 줘요.',
  'help.guide.roadtrip-limits.step.1':
    '‘주행 설정’은 오른쪽 열 검색 아래에 있어요. 배지에 설정한 내용이 보이고, 클릭하면 열려요.',
  'help.guide.roadtrip-limits.step.2':
    '‘운전’ 아래 ‘연속 운전 최대’와 ‘하루 운전’은 분 단위예요. 칸을 비우면 꺼진 것이고, 아무것도 표시하지 않아요.',
  'help.guide.roadtrip-limits.step.3':
    '‘차량’에서 차 종류를 정하세요. ‘연료’는 주유소에서만, ‘전기’는 충전소에서만, ‘둘 다’는 양쪽에서 채워요.',
  'help.guide.roadtrip-limits.step.4':
    '‘1회 주유 주행거리’나 ‘한 번 충전 주행거리’를 직접 입력하세요. 또는 ‘충전 목표’ 아래 ‘차량 데이터로 계산하기’를 열면 ‘연료탱크’와 ‘소비량’, 또는 ‘배터리 용량’, ‘소비량’, ‘배터리 열화’로 주행 가능 거리를 계산해 줘요.',
  'help.guide.roadtrip-limits.step.5':
    '왼쪽 열의 ‘가능하면 피하기’는 금지가 아니라 선호예요. 다른 길이 없는 날은 그 도로를 그대로 쓰고, 날 헤더에 안내가 표시돼요.',
  'help.guide.roadtrip-limits.step.6':
    '‘닫기’를 클릭하세요. 카드의 배지에 설정한 내용이 보이고, 레일에서 제한을 넘는 구간과 날이 모두 표시돼요.',
  'help.guide.roadtrip-limits.result':
    '카드의 배지에 설정된 값이 표시되고, 한도를 넘는 구간과 날은 레일에 배지가 붙어요.',
  'help.guide.roadtrip-limits.tip.1': '설정은 여행에 속해서, 여행 멤버 모두가 같은 차와 같은 한도로 계획해요.',
  'help.guide.roadtrip-limits.tip.2':
    '‘충전 목표’는 들를 곳에서 연료나 배터리를 어디까지 채울지 정해요. 이동 중에 100%까지 채우는 사람은 없으니까요. 주유소나 충전소는 줄의 배터리 배지로 따로 정할 수 있어요.',
  'help.guide.roadtrip-limits.tip.3':
    '“경로 선”에서 “날짜 잇기”를 켜면 하루의 마지막 정차지에서 다음 날 첫 정차지까지도 경로로 이어요. “매일 숙소에서 시작하고 숙소에서 끝내기”는 그날 밤 예약한 숙소에서 하루를 시작하고 끝내요. “날짜별 색상”은 날마다 다른 색으로 보여 줘요.',
  // roadtrip-day-window
  'help.guide.roadtrip-day-window.title': '운전하는 날의 시작과 끝 정하기',
  'help.guide.roadtrip-day-window.goal': '원하는 시각에 운전을 멈추고, 하루를 어디서 끝낼지 정해요.',
  'help.guide.roadtrip-day-window.step.1': '오른쪽 열에서 ‘주행 설정’을 열고 창 왼쪽 열의 ‘일일 이동 시간’을 찾으세요.',
  'help.guide.roadtrip-day-window.step.2':
    '‘하루 시작 시간’을 정하세요. 이것만으로는 아무 일도 일어나지 않아요. 아래 안내처럼 두 시간을 모두 정해야 해요.',
  'help.guide.roadtrip-day-window.step.3':
    '‘하루 종료 시간’을 정하세요. 이제 그 시각에 운전을 멈추고 다음 날 아침에 이어 가며, 옆 열에 ‘하루 일정 종료’ 줄과 ‘여행 계속’ 줄이 보여요.',
  'help.guide.roadtrip-day-window.step.4':
    '“하루 종료 지점”에서 종료 시각에 길 위에서 멈추려면 “경로 중간”을, 다음 운전이 지나치기 전에 마지막 장소에서 멈추려면 “마지막 장소”를 고르세요.',
  'help.guide.roadtrip-day-window.step.5': '‘닫기’를 클릭하세요. ‘주행 설정’ 카드에 두 시간이 배지로 보여요.',
  'help.guide.roadtrip-day-window.result':
    '드라이브가 설정한 길이의 이동일로 나뉘고, 들어가지 않는 부분은 마지막 날 뒤에 계산된 날로 이어져요. 내 일자와 장소는 바뀌지 않아요.',
  'help.guide.roadtrip-day-window.tip.1':
    '두 시각 중 하나라도 지우면 이 기능이 다시 꺼져요. 정차지에 직접 정한 시간이 항상 우선이에요.',
  'help.guide.roadtrip-day-window.tip.2':
    '하루 이동 시간을 정하면 날짜가 항상 이어져요. 한 날의 마지막 정차지에서 다음 날 첫 정차지까지의 운전도 경로로 계산되고 집계돼요.',
  'help.guide.roadtrip-day-window.tip.3':
    '하루의 끝은 지도에도 날 번호가 적힌 달 마커로 보여요. 경로를 따라 끌거나 장소 위로 끌면 하루가 다른 곳에서 끝나요. 오른쪽 클릭하면 자동 종료 지점으로 돌아가요. 이 창의 ‘자동 하루 종료 복원’은 이런 변경을 모두 되돌려요. 들를 곳 한 곳에서 하루를 끝내려면 그곳을 클릭하고 카드에서 ‘여기서 하루 종료’를 켜세요.',
  // roadtrip-refuel
  'help.guide.roadtrip-refuel.title': '연료가 떨어지기 전에 채우기',
  'help.guide.roadtrip-refuel.goal': '차가 아직 갈 수 있는 구간에서 주유하거나 충전할 곳을 찾아 주행에 추가해요.',
  'help.guide.roadtrip-refuel.step.1':
    '주행 가능 거리를 정해 두면 옆 열에서 연료나 배터리가 떨어지는 구간에 띠가 보여요: ‘여기서 연료 소진’, 전기차라면 ‘여기서 배터리가 바닥납니다’. 그 아래에 구간의 어디쯤인지 나와요.',
  'help.guide.roadtrip-refuel.step.2':
    '띠에 있는 램프 아이콘이 버튼이에요. “주유소 찾기”, 전기차라면 “충전소 찾기”예요. 그 지점 전까지의 길을 따라 찾고, 찾는 동안 “경로를 따라 찾는 중…”이 표시돼요.',
  'help.guide.roadtrip-refuel.step.3':
    '주유소를 최대 세 곳까지 보여 주고, 각각 경로에서 떨어진 거리와 남게 될 주행 가능 거리가 나와요.',
  'help.guide.roadtrip-refuel.step.4':
    '추천 항목의 더하기 버튼을 누르면 주유 정차로 추가돼요. “경유지로 추가”가 유형과 시간이 채워진 채로 열리고, “추가”를 누르면 경로가 실제로 그곳을 지나는 지점에 구간으로 들어가요.',
  'help.guide.roadtrip-refuel.result':
    '정차지가 맞는 구간에 전용 아이콘과 함께 추가되고, 주행 가능 거리가 그 정차지부터 다시 계산돼요. 띠는 이제 연료가 바닥나는 지점으로 옮겨 가거나, 더 들르지 않고 끝까지 갈 수 있으면 사라져요.',
  'help.guide.roadtrip-refuel.tip.1':
    '주행 가능 거리는 마지막 주유소나 충전소부터 날을 넘어 이어서 계산해요. 차량 종류에 따라 어떤 곳이 계산되는지 정해져요: ‘연료’는 주유소만, ‘전기’는 충전소만.',
  'help.guide.roadtrip-refuel.tip.2':
    '검색은 연료가 떨어지는 지점 앞 도로를 보고, 여유분을 남기고, 우회 거리를 왕복으로 계산해서, 제안하는 곳은 모두 실제로 갈 수 있어요.',
  'help.guide.roadtrip-refuel.tip.3':
    '결과가 없으면 다시 검색할 수 있어요: 장소 검색은 함께 쓰는 서비스라 가끔 시간 초과가 나서, 램프가 ‘다시 시도’로 바뀌어요.',
  // roadtrip-track
  'help.guide.roadtrip-track.title': '하루 경로를 가져온 트랙에 맞추기',
  'help.guide.roadtrip-track.goal': 'GPX나 KML 트랙으로 가져온 경치 좋은 길을 하루 드라이브 경로로 써요.',
  'help.guide.roadtrip-track.step.1': '일자 헤더의 “트랙” 배지를 클릭하세요. 그날 기준으로 대화 상자가 열려요.',
  'help.guide.roadtrip-track.step.2':
    '트랙을 고르세요. 트랙마다 길이와 함께 이날 경로를 따라가는지, 아니면 얼마나 떨어져 있는지 나와요. 가장 가까운 트랙이 먼저 나와요.',
  'help.guide.roadtrip-track.step.3':
    '‘이 트랙 따라가기’를 클릭하세요. TREK가 주행이 트랙에서 가장 먼 곳에 경유 지점을 넣고 경로를 다시 계산하는 일을 여러 번 반복해요.',
  'help.guide.roadtrip-track.step.4':
    '창에 경유 지점을 몇 개 놓았는지, 주행이 이제 트랙에 얼마나 가깝게 붙는지 나와요. 이미 트랙을 따르고 있었다면 그렇게 알려 줘요. 왼쪽 아래 ‘경유 지점 제거’를 누르면 경유 지점이 사라지고 라우터가 그날을 다시 계획해요. 창을 닫아도 트랙은 남아요.',
  'help.guide.roadtrip-track.result':
    '그날 주행이 라우터가 골랐을 도로 대신 트랙을 따라가요. ‘트랙’ 배지에 마우스를 올리면 트랙 이름이 보여요. 경유 지점으로 주행이 트랙에 붙어 있으면 배지도 강조돼요.',
  'help.guide.roadtrip-track.tip.1':
    '창에는 경로선이 있는 여행 장소가 나와요. ‘일’ 아래 장소 열에서 ‘파일 가져오기’로 가져온 GPX나 KML로, GPX는 ‘경로’ 또는 ‘트랙 (경로 형상 포함)’을, KML은 ‘경로 (LineStrings)’를 체크한 경우예요. ‘파일 가져오기’는 투어 애드온이 꺼져 있을 때만 있어요. 투어를 켜면 GPX는 투어가 되고, 이 창에는 나오지 않아요. 여행에 트랙이 없으면 어느 날에도 배지가 보이지 않아요.',
  'help.guide.roadtrip-track.tip.2':
    '트랙을 따르면 그날 구간에 있던 경유 지점이 바뀌어요. 그러니 구간을 손으로 다듬는 건 트랙을 따른 다음에 하세요.',
  'help.guide.dateless-trip.step.1': '‘새 여행’을 클릭하고 여행 이름을 입력하세요.',
  'help.guide.edit-trip.tip.2': '여기서 동행자를 추가하거나 빼면 ‘업데이트’를 누르지 않아도 바로 반영돼요.',
  'help.guide.trip-reminder.result': '여행 시작 며칠 전으로 정한 날에, 평소 알림을 받는 채널로 리마인더가 와요.',
  'help.guide.upcoming-reservations.step.1':
    '오른쪽 열에서 ‘예정된 예약’을 찾으세요. 모든 여행에서 다가오는 예약 여섯 건을 가까운 순서로 날짜, 시간, 유형과 함께 보여 줘요.',
  'help.guide.half-company-holiday.step.1': '도구 모음을 ‘회사 휴일’로 바꾸세요.',
  'help.guide.edit-holiday-calendar.result': '바꿀 때마다 달력과 범례가 바로 업데이트돼요.',
  'help.guide.person-color.result': '그 사람이 기록한 모든 날이 이제 새 색으로 보여요.',
  'help.guide.answer-fusion-request.step.1': '누군가 초대하면 Vacay를 여세요. ‘퓨전 요청’ 창이 자동으로 열려요.',
  'help.guide.log-for-partner.step.1': '‘인원’ 카드에서 그 사람의 이름을 클릭하세요. 체크 표시가 보이면 선택된 거예요.',
  'help.guide.dissolve-fusion.step.1': '‘설정’을 여세요.',
  'help.guide.country-places.step.2': '카드에서 핀이 그려진 ‘장소’ 배지를 클릭하세요.',
  'help.guide.search-place.tip.2': '이미 표시된 지역이면 팝업에서 대신 제거할지 물어봐요.',
  'help.guide.tour-activity-stats.step.4':
    '오른쪽 배지는 합계의 기준을 알려 줘요. ‘예정’은 여행 계획으로 집계한 투어, ‘기록’은 실제 트랙이 연결된 투어예요. ‘예정’, ‘날짜 미지정’, ‘날짜 없음’은 아직 합계에 들어가지 않은 투어 수예요. i를 누르면 규칙을 설명해 줘요.',
  'help.guide.move-to-list.step.2':
    '여기에도 남겨 두려면 ‘목록에 복제’를, 이 목록에서 빼려면 ‘목록으로 이동’을 클릭하세요.',
  'help.guide.accept-list-invite.title': '목록 초대 수락하기',
  'help.guide.tour-collection-add-to-trip.step.3':
    '‘웨이포인트’에서 출발, 경유지, 도착을 순서대로 넣으려면 웨이포인트가 있는 타일을, 저장된 선만 넣으려면 ‘선만’을 고르세요.',
  'help.guide.tour-collection-manage.step.1':
    '목록을 여세요. 저장된 투어마다 난이도, 유형, 저장해 온 여행, 거리와 오르막, 웨이포인트 수가 보여요. 여행 이름에 마우스를 올리면 누가 저장했는지 알 수 있어요.',
  'help.guide.entry-draft.step.1': '편집기의 오른쪽 열에서 ‘초안’을 켜세요.',
  'help.guide.journey-map-layers.step.3':
    '지도에서 속이 빈 핀이나 작은 점을 클릭하세요. 카드에 무엇인지 나와요. 계획한 장소와 그 날짜이거나, ‘항목 열기’가 있는 방문 기록이에요. ‘항목 열기’를 누르면 해당 하루 기록으로 이동해요.',
  'help.guide.journey-keep-route.step.3': '‘경로 저장’을 클릭하세요.',
  'help.guide.journey-day-stays.step.3':
    '원하지 않는 방문 기록에서 ‘방문한 장소가 아님’을 클릭하세요. 목록에서 사라져요.',
  'help.guide.journey-take-over-day.step.3':
    '하루를 항목 하나로 쓰고 싶다면 ‘항목’을 ‘하루 기록’으로 바꾸세요. 항목 하나에 선택한 방문 기록이 모두 시간과 함께 나열돼요.',
  'help.guide.journey-auto-prepare.step.2': '‘기록된 날’에서 ‘기록된 날을 자동으로 준비’를 켜세요.',
  'help.guide.photo-location.step.2': '‘사진’에서 ‘사진으로 기록 위치 지정’을 켜세요.',
  'help.guide.link-trip.tip.3':
    '아직 연결하지 않은 여행의 날에 항목을 쓰면, 편집기가 항목 안에서 바로 ‘여행 연결’을 제안해요.',
  'help.ctx.settings-plugins.summary':
    '관리자가 설치한 플러그인에 대한 내 설정이에요. 플러그인마다 요청하는 키와 환경설정, 플러그인이 나 대신 한 작업의 기록이 있어요. 이 탭은 활성화된 플러그인이 있을 때만 보여요.',
  'help.ctx.settings-about.bullet.3':
    'Ko-fi, Buy Me a Coffee, Discord에서 TREK를 후원하거나 만드는 사람들과 이야기할 수 있어요.',
  'help.guide.language-region.step.3':
    '‘표시 통화’를 정하거나, 여행마다 그 여행의 통화로 보려면 ‘여행 통화’를 그대로 두세요. 그다음 ‘온도 단위’, ‘거리 단위’, ‘시간 형식’, ‘주 시작 요일’을 고르세요.',
  'help.guide.travel-map-prefs.step.3':
    '‘지도에서 장소 탐색’을 켜면 주변 장소를 찾는 카테고리 버튼이 보여요. ‘예약 코드 흐리게’는 마우스를 올리거나 탭하기 전까지 예약 번호를 가려요. ‘숙소 기준으로 경로 최적화’는 하루를 호텔에서 시작하고 호텔에서 끝내요.',
  'help.guide.web-push-device.step.2': '맨 위 ‘알림’ 카드의 ‘푸시’ 열에서 어떤 이벤트를 내 기기로 보낼지 정해요.',
  'help.guide.connect-airtrail.goal': 'TREK가 내 AirTrail의 항공편을 가져오고 동기화하게 해요.',
  'help.guide.connect-dawarich.goal': 'TREK가 내 Dawarich에서 실제로 다녀온 곳을 읽어 오게 해요.',
  'help.guide.tour-connect-wanderer.goal': 'TREK가 내 wanderer의 트레일을 읽어 와서 투어로 가져올 수 있게 해요.',
  'help.guide.tour-wanderer-watch.title': 'wanderer 트레일이 바뀌면 알림 받기',
  'help.guide.plugin-settings.tip.2': '‘알림’의 플러그인 채널에 있는 ‘설정하기’ 버튼을 누르면 이 페이지가 열려요.',
  'help.guide.default-user-settings.result':
    '새 계정과, 이 설정을 한 번도 바꾸지 않은 모든 사용자에게 내가 고른 값이 보여요.',
  'help.guide.own-routing-engine.goal':
    '공개 서버 대신 직접 운영하는 OSRM 또는 Valhalla 서버로 하루 일정과 로드 트립의 경로를 계산해요.',
  'help.guide.admin-passkeys.tip.1':
    'TREK가 아직 도메인을 알 수 없으면 경고가 뜨고, APP_URL이나 Relying Party ID를 설정할 때까지 패스키가 숨겨져요.',
  'help.guide.rotate-jwt-secret.step.1':
    '‘설정’ 탭 맨 아래 ‘위험 구역’에서 ‘JWT 시크릿 교체’ 옆의 ‘교체’를 클릭하세요.',
  'help.guide.storage-backends.tip.3':
    '사진 캐시는 TREK가 다시 내려받을 수 있어서, 미러링하면 대개 저장 공간만 낭비돼요.',
  'help.guide.admin-channels.step.3':
    '아래 ‘알림’ 카드에서 이벤트마다 보낼 채널을 고르세요: ‘새 버전 사용 가능’, ‘스토리지 복제본 오류’, ‘패들 지역 요청’. 스위치는 누르는 즉시 저장돼요.',
  'help.guide.notification-defaults.tip.1':
    '‘끔’은 사용자가 직접 다시 켤 수 있는 기본값이고, ‘차단’은 모두에게서 꺼요.',
  'help.ctx.notifications.bullet.4':
    '각 알림의 시간 옆에 있는 ‘읽음으로 표시’(이중 체크)와 ‘삭제’(휴지통)는 그 알림 하나에만 적용돼요. 맨 위의 ‘모두 읽음으로 표시’와 ‘모두 삭제’는 목록 전체에 적용돼요.',
  'help.guide.read-notifications.tip.2':
    '버튼이 없는 알림은 안내용이에요. 패널에서 읽고 그 자리에서 읽음으로 표시하세요.',
  'help.guide.filter-notifications.result': '목록에 아직 읽지 않은 알림만 최신순으로 보여요.',
  'help.guide.delete-notifications.title': '알림 삭제하기',
  'help.guide.notification-settings.goal':
    '어떤 이벤트를 벨 아이콘에 표시하고, 어떤 이벤트를 이메일, 웹훅, ntfy, 푸시로도 받을지 정해요.',
  'help.guide.public-link.step.4': '‘링크 만들기’를 클릭하고 ‘복사’한 뒤 보내세요.',
  'help.guide.link-journal.step.2': '‘저널 연결’을 클릭하고 ‘Journey 선택’에서 내 Journey 하나를 고르세요.',
  'help.guide.dawarich-stays.title': '기록된 방문을 장소로 만들기',
  'help.guide.dawarich-stays.tip.2': '방문 기록으로 만든 장소를 삭제하면 그 방문 기록이 대기 상태로 목록에 돌아와요.',
  'help.guide.leave-stop-off-route.goal':
    '걸어서 지나가거나 지도에만 표시하고 싶은 곳처럼, 들를 곳을 그날에 두되 경로는 그곳을 지나지 않게 해요.',
  'help.guide.day-route.tip.4': '그날에는 두되 경로에는 넣고 싶지 않은 곳이라면 메뉴에서 ‘경로에서 제외’를 고르세요.',
  'help.guide.move-booking-day.step.2':
    '줄을 다른 날 카드의 헤더로 끌어다 놓으세요. 하루짜리 예약은 그날로 통째로 옮겨져요. 여러 날에 걸친 예약은 ‘출발’ 줄을 옮기면 시작하는 날이, ‘도착’ 줄을 옮기면 끝나는 날이 바뀌어요.',
  'help.guide.place-image-from-file.title': '첨부한 사진을 장소 사진으로 쓰기',
  'help.guide.place-image-from-file.tip.2': '들를 곳에 고정한 사진이나 그 예약에 첨부한 사진도 후보로 나와요.',
  'help.guide.place-own-hours.step.5':
    '‘업데이트’를 클릭하세요. 이제 카드의 ‘영업 시간’에 내가 입력한 시간이 보이고, 위쪽의 영업 중/영업 종료 표시도 그 시간을 기준으로 해요.',
  'help.guide.confirm-stay-booking.step.3':
    '위쪽의 ‘대기 중’을 클릭하세요. 툴팁에 ‘확정됨으로 설정’이 보이고 점이 초록색으로 바뀌어요.',
  'help.guide.map-nearby-places.tip.4':
    '검색에 실패한 카테고리에는 빨간 점이 붙고, ‘이 지역 검색’이 경고 표시와 함께 빨간색으로 바뀌어요. 클릭하면 다시 시도해요.',
  'help.guide.tour-map-lines.tip.1': '날짜 열에서 날을 접으면 그날의 투어와 들를 곳이 지도에서 숨겨져요.',
  'help.guide.car-stops.step.3':
    '헤더에 제목을 입력하세요. ‘경로’에서 차를 받을 곳을 출발지에, 반납할 곳을 도착지에 고르세요. 입력하기 전에 여행 장소가 먼저 제안돼요. ‘픽업’과 ‘픽업 시간’은 차를 받는 때를, ‘반납’과 ‘반납 시간’은 돌려주는 때를 나타내요.',
  'help.guide.transport-details.step.1':
    '‘교통’ 탭에서 카드를 클릭하세요. 상세 정보가 탭 위에 열리고, 헤더는 카드와 같은 색이에요. 일정의 교통 줄을 눌러도 같은 상세 정보가 열려요.',
  'help.guide.export-transports-csv.tip.2':
    '‘예약’ 탭에도 같은 아이콘이 있는데, bookings.csv로 끝나는 별도 파일을 만들어요.',
  'help.guide.group-sort-bookings.step.2':
    '‘그룹 기준’에서 ‘상태’, 날, ‘유형’, ‘그룹 없음’ 중 하나를 고르세요. 탭이 바로 그 구역별로 정렬돼요.',
  'help.guide.export-bookings-csv.result':
    '브라우저가 여행과 탭 이름을 딴 파일(예: autumn-in-japan-bookings.csv)을 내려받아요. 탭에 보이던 예약마다 한 줄씩 들어 있어요.',
  'help.guide.arrange-packing-list.result':
    '목록은 끌어 놓은 순서대로 놓이고, 이 기능을 끌 때까지 항목은 가나다순으로 정렬돼요. 내가 정한 순서도 TREK가 그대로 저장해 둬요.',
  'help.guide.count-packed-pieces.step.2':
    '수량 앞에 0/5 같은 카운터가 빼기, 더하기 버튼과 함께 나타나요. 가방에 하나 넣을 때마다 더하기를 클릭하세요.',
  'help.guide.expense-receipts.step.4':
    '내역으로 돌아오면 그 줄의 이름 옆에 ‘영수증’ 칩이 있고, 여러 장이면 괄호 안에 개수가 보여요. 클릭하면 영수증이 열려요.',
  'help.guide.final-budget.tip.3':
    '여행에서 나간 사람도 받을 돈이나 줄 돈이 남아 있는 동안은 ‘잔액’과 ‘최종 부담액’에 줄이 남아요.',
  'help.guide.files-sync-settings.step.2':
    '흐름 바에는 TREK와 내 저장소가 각자 가진 문서와 함께 나오고, 그 사이에 ‘저장소로 내보내기’와 ‘저장소에서 가져오기’ 두 갈래가 있어요. ‘저장소로 내보내기’를 클릭하면 꺼져요. 그 갈래가 회색이 되고 아래 줄에 ‘들어오기만’이라고 보여요. 다시 클릭하면 켜져요.',
  'help.guide.files-sync-settings.tip.4':
    '이 설정은 여행 소유자나 관리자만 바꿀 수 있어요. 다른 멤버에게는 ‘문서가 양방향으로 이동’ 같은 문구가 있는 흐름 바만 보이고 ‘설정’은 없어요.',
  'help.guide.manage-notes.step.2':
    '‘펼치기’를 누르면 메모 전체가 열려요: 전체 텍스트, ‘웹사이트’, ‘파일’. 파일을 클릭하면 미리 볼 수 있어요. 아래쪽 ‘편집’은 바로 편집기로 넘어가고, 오른쪽 위 X로 메모를 다시 닫아요.',
  'help.guide.note-categories.goal':
    '그룹 메모에 이름과 색을 붙인 카테고리를 만들고, 한 번에 카테고리 하나씩 볼 수 있게 해요.',
  'help.guide.note-categories.tip.1':
    '휴지통은 쓰는 메모가 없는 카테고리만 삭제해요. 메모가 남아 있는 카테고리는 그 메모를 다른 카테고리로 옮기기 전까지 목록에 남아요.',
  'help.guide.roadtrip-reorder.title': '들를 곳 순서 바꾸기, 다른 날로 옮기기',
  'help.guide.roadtrip-reorder.tip.3':
    '고정한 시간이 있어도 TREK는 따로 묻지 않아요. 레일이 그날을 바로 다시 계산하고, 제시간에 갈 수 없게 된 곳을 표시해요.',
  'help.guide.roadtrip-overnight.step.3':
    '창 위쪽에서 ‘숙박’은 하룻밤 숙박을 추가하고, ‘휴식’은 잠시 머무는 곳으로 만들어요. 호텔은 ‘숙박’으로, 캠핑장은 ‘휴식’으로 열려요. 숙박은 ‘체크인’만 물어보고, 비워 둬도 돼요.',
  'help.guide.roadtrip-stop-fill.step.1':
    '레일의 주유소나 충전소에서 배터리 배지를 클릭하세요. 그곳에서 어디까지 채우는지 보여 줘요. ‘충전 목표’ 값을 따르는 동안은 흐리게, 따로 값을 정하면 진하게 보여요.',
  'help.guide.roadtrip-bookings.step.1':
    '그날에 ‘비행’, ‘기차’, ‘페리’, ‘크루즈’, ‘버스’ 예약으로 이동을 넣고, 출발지와 도착지 위치를 모두 지정하세요. 주행에 자동으로 반영돼요: 도로는 출발 터미널에서 끝나고, 도착한 곳에서 다시 시작해요.',
  'help.guide.roadtrip-google-import.result':
    '경로의 정차 지점이 그날 마지막 들를 곳 뒤에 추가되고, 레일과 지도의 경로가 그곳들을 지나가요.',
  'help.guide.roadtrip-hazards.step.3':
    '경고는 지도에 영역으로 표시돼요. 하나를 클릭하면 무엇에 관한 경고인지, 어느 서비스가 알렸는지, 언제 마지막으로 업데이트됐는지 볼 수 있어요.',
  'help.ctx.trip-tours.bullet.2':
    '위쪽의 ‘GPX 또는 KML 가져오기’로 파일을 투어로 가져와요. 그 아래 필터 버튼(처음에는 ‘전체’와 투어 수)으로 상태, 출처, 경로 난이도 한도, 유형별로 목록을 좁혀요.',
  'help.guide.tour-show-list.step.2':
    '한 줄이 투어 하나예요. 색 막대는 지도의 선 색이고, 둥근 타일에는 TREK에서 계획한 하이킹의 난이도 한도(T1~T6)나 유형 아이콘이 보여요. 이름 아래 배지에는 들어간 날, 시간, 거리, 오르막이 나와요. 여러 날 투어에는 숫자가 붙은 달 아이콘으로 구간 수가 보여요.',
  'help.guide.tour-add-to-day.title': '투어를 날에 넣기',
  'help.guide.tour-add-to-day.tip.2':
    '마지막 구간보다 여행이 먼저 끝나면, 옵션에 들어갈 수 있는 마지막 구간이 표시되고 그 뒤 구간은 날짜 없이 남아요.',
  'help.guide.tour-day-times.step.3':
    '‘업데이트’를 클릭하세요. 이제 줄에 시작 → 종료가 보여요. 계산된 종료 시간은 연하게 표시되고, 추정이면 ≈, 머무는 곳에 아직 시간이 없으면 ≥, 자정을 넘기면 +1이 붙어요. 마우스를 올리면 어떻게 계산했는지 볼 수 있어요.',
  'help.guide.tour-remove-from-day.goal': '투어를 삭제하지 않고 일정에서만 빼요.',
  'help.guide.tour-filter-list.goal':
    '긴 목록을 원하는 투어로 좁혀요: 아직 계획하지 않은 투어, 파일에서 가져온 투어, 특정 유형의 투어.',
  'help.guide.tour-filter-list.result': '필터에 맞는 투어만 목록에 남아요. 나머지도 여행에서 사라지지 않아요.',
  'help.guide.tour-hide-on-map.result': '원하는 투어만 지도에 보이고, 숨긴 투어는 목록에 흐리게 남아요.',
  'help.guide.tour-import-plan-tab.result':
    '트랙이 여행의 투어가 돼요: 목록에 GPX 배지가 붙은 줄이, 지도에 선이 생겨요.',
  'help.guide.tour-detail-read.title': '투어를 열고 카드 보기',
  'help.guide.tour-detail-read.step.7': '카드 위쪽의 X로 닫거나 Esc 키를 누르세요.',
  'help.guide.tour-rename-colour.goal': '투어에 알아보기 쉬운 이름과 지도에서 잘 보이는 선 색을 정해요.',
  'help.guide.tour-take-along.title': '투어를 휴대폰이나 GPS로 내려받기',
  'help.guide.tour-take-along.tip.4':
    '‘투어’ 탭에서는 같은 다운로드가 왼쪽 열 맨 위에 있어요. 저장하지 않은 변경이 있으면 먼저 저장하라고 안내해요.',
  'help.guide.tour-copy-keep.tip.1':
    '둘 다 사본이에요. 나중에 투어를 바꿔도 사본이나 컬렉션에 저장한 버전은 바뀌지 않아요.',
  'help.guide.tour-packing-link.step.2':
    '‘연결 대상’에서 ‘짐 목록 전체’나 그 안의 목록 하나를 고르세요. 줄마다 항목이 몇 개인지 보여요.',
  'help.guide.tour-files.title': '투어에 파일 첨부하기',
  'help.guide.tour-activity-link.title': '실제로 다녀온 트랙 연결하기',
  'help.guide.tour-activity-link.tip.2':
    '투어를 계획하는 데 쓰지 않은 가져온 트랙만 연결할 수 있고, 트랙 하나는 투어 하나에만 연결돼요.',
  'help.guide.tour-activity-compare.step.4':
    '트랙 아래의 ‘변경’으로 다른 기록을 골라요. ‘연결 해제’는 투어에서 트랙을 떼어 내고, 트랙은 가져온 항목으로 여행에 남아요.',
  'help.guide.tour-origin-check.step.3': '‘투어’ 탭에서 직접 그린 투어에는 ‘TREK에서 계획됨’과 ‘생성일’이 보여요.',
  'help.ctx.trip-tour-planner.bullet.2':
    '왼쪽 레일이 편집기예요. 열린 투어가 없으면 ‘새 투어 계획’이 보여요. 투어를 열면 이름, 유형, 웨이포인트, 유형별 카드, 상세 정보가 나오고 아래쪽에 ‘취소’와 ‘저장’이 있어요.',
  'help.guide.tour-open-workspace.step.2':
    '왼쪽 레일이 편집기예요. 열린 투어가 없으면 ‘새 투어 계획’이 보이고, 누르면 지도에서 새 투어를 시작해요.',
  'help.guide.tour-open-workspace.tip.3':
    '편집기에 저장하지 않은 변경이 있는데 다른 투어를 열면 먼저 물어봐요: ‘변경 사항 버리기’ 또는 계속 편집하기.',
  'help.guide.tour-draw-route.step.5':
    '걸어갈 순서대로 다음 지점을 클릭하세요. 클릭할 때마다 그 지점이 새 끝점이 되고, 지점이 두 개가 되면 TREK가 길을 따라 경로를 계획해요.',
  'help.guide.tour-type-profile.goal':
    '투어 유형을 고르고, 자전거 투어라면 프로필도 골라서 경로가 알맞은 길을 따르게 해요.',
  'help.guide.tour-edit-points.title': '지점 옮기기, 순서 바꾸기, 삭제하기',
  'help.guide.tour-edit-points.tip.1':
    '첫 지점에는 ‘시작’, 마지막 지점에는 ‘종료’ 배지가 붙어요. 지점을 맨 위나 맨 아래로 옮기면 시작점이나 끝점이 돼요.',
  'help.guide.tour-shaping-points.step.4':
    '정차 지점을 형태 지점으로 바꾸거나 되돌리려면 그 줄에서 ‘작업 더 보기’를 열고 ‘형태 지점으로 바꾸기’나 ‘정류 지점으로 바꾸기’를 고르세요.',
  'help.guide.tour-loop-reverse.step.2':
    '이제 마지막 줄에 ‘출발점으로 복귀’가 보이고, 지도의 경로가 출발한 곳에서 끝나요.',
  'help.guide.tour-leg-by-hand.step.1':
    '그 구간이 시작하는 지점에서 ‘작업 더 보기’를 열고 ‘다음 구간을 손으로 그리기’를 고르세요.',
  'help.guide.tour-trip-places.goal': '여행에 이미 넣어 둔 장소를 투어의 정차 지점으로 추가해요.',
  'help.guide.tour-trip-places.result': '투어에 여행 장소와 같은 이름의 새 정차 지점이 생겨요.',
  'help.guide.tour-details-times.tip.2':
    '하이킹이라면 상세 정보에 ‘탐방로 최대 난이도’와 ‘경로 선택’도 있어요. 자세한 내용은 하이킹 가이드에 있어요. 도심 산책에는 ‘휴식’이 없고, 대신 각 정차 지점에서 머무는 시간이 쓰여요.',
  'help.guide.tour-save.step.4': '이제 투어가 ‘이 여행의 투어’ 아래에 날짜 없이 보여요.',
  'help.guide.tour-edit-saved.step.2':
    '새 투어와 똑같이 필요한 부분을 바꾸세요: 지점을 옮기거나 추가하고, 유형을 바꾸거나, 여기처럼 ‘설명’ 같은 상세 정보를 편집해요.',
  'help.guide.tour-summary-profile.goal': '투어가 얼마나 길고 가파른지, 경로의 어느 지점이 몇 미터 높이인지 확인해요.',
  'help.guide.tour-summary-profile.result': '투어 길이, 오르막, 소요 시간, 가파른 구간의 위치를 알 수 있어요.',
  'help.guide.tour-list-manage.tip.1':
    '투어는 여러 날에 들어가 있어도 합계에 한 번만 계산돼요. 앞에 ≥가 붙은 합계에는 일부 투어가 빠져 있어요. 마우스를 올리면 몇 개인지 볼 수 있어요.',
  'help.guide.tour-delete.tip.1': '되돌릴 수 없어요. ‘실행 취소’로도 투어가 돌아오지 않아요.',
  'help.guide.tour-saved-elsewhere.step.3':
    '그래도 ‘저장’을 클릭하면 대신 ‘그사이 변경됨’이 열리고, 아무것도 덮어쓰지 않아요.',
  'help.ctx.trip-tour-import.bullet.2':
    '‘가져오기 미리보기’에서는 저장하기 전에 파일의 모든 트랙을 거리, 오르막, 내리막, 지점 수와 함께 지도에 보여 줘요. ‘가져올 유형’에서 트랙이 무엇인지 정해요.',
  'help.guide.tour-import-gpx.step.3':
    '‘가져오기 미리보기’가 열려요. 아직 아무것도 저장되지 않았어요. 지도에 전체 코스가 보이고, 파일의 트랙마다 거리, 오르막, 내리막, 지점 수가 담긴 번호 줄이 생겨요. 기록된 트랙에는 언제 기록했는지와 걸린 시간도 나와요.',
  'help.guide.tour-import-gpx.result':
    '투어가 ‘이 여행의 투어’에 날짜 없이 들어가요. 하나만 가져왔다면 바로 지도에 ‘GPX 투어’로 열려요.',
  'help.guide.tour-view-import.tip.3': 'wanderer 트레일도 같은 방식으로 ‘wanderer 투어’로 열려요.',
  'help.guide.tour-plan-from-import.tip.1': '‘취소’는 제안을 버려요. 저장하기 전에는 아무것도 저장되지 않아요.',
  'help.guide.tour-restore-recorded.step.2': '‘기록된 트랙 복원’을 클릭하세요.',
  'help.guide.tour-take-over.step.2': '‘다른 여행에서 투어 가져오기’를 고르세요.',
  'help.guide.tour-take-over.result': '가져왔다는 메시지가 뜨고 투어가 편집기에서 열려요. 이제 날에 넣으면 돼요.',
  'help.guide.tour-import-wanderer.tip.2':
    '가져온 투어는 사본이라서 나중에 wanderer에서 바뀌어도 투어는 그대로예요. 투어 ‘출처’의 ‘소스 확인’에서 트레일이 바뀌었는지 알 수 있어요.',
  'help.ctx.trip-tour-map.bullet.3':
    '지도 위쪽의 ‘장소 또는 주소 검색’은 투어에 아무것도 추가하지 않고 지도를 마을, 산장, 정상으로 옮겨 줘요.',
  'help.guide.tour-map-layers.result': '투어가 잘 맞는 지도 위에 그려지고, 버튼에 어떤 지도가 켜져 있는지 보여요.',
  'help.guide.tour-along-search.step.3':
    '‘경로에서 이 거리 이내’에서 선으로부터 얼마나 멀리까지 찾을지 고르세요: 250m, 500m, 1km, 2km.',
  'help.guide.tour-along-add-stop.goal': '경로 근처에서 찾은 전망대, 산장, 샘물을 투어가 지나가게 해요.',
  'help.guide.tour-along-add-stop.tip.3':
    '정차 지점을 넣을 수 없는 구간(고정선으로 추가한 비아 페라타나 육상 운반 구간, 손으로 그린 구간)은 목록에 흐리게 남고, 옆에 이유가 표시돼요.',
  'help.guide.tour-3d-terrain.result':
    '가파른 구간이 색으로 표시된 3D 지형 위에서 투어를 살펴봤고, 계획을 위해 평면 지도로 돌아왔어요.',
  'help.guide.tour-3d-flyover.step.3':
    '‘휴식’은 비행을 그 자리에서 멈추고, ‘비행 재생’은 거기서부터 이어 가요. ‘처음부터’는 처음으로 돌아가 다시 비행해요.',
  'help.guide.tour-map-overlays.step.1':
    '‘투어’ 탭에서 스키 투어를 여세요. 슬로프는 처음부터 켜져 있어요. 스위치는 왼쪽 아래 버튼 ‘슬로프, 크로스컨트리 코스, 리프트’에 있는 눈 덮인 산 아이콘이에요. 클릭하면 지도에서 숨기고, 다시 클릭하면 보여 줘요.',
  'help.ctx.trip-tour-stages.title': '여러 날 투어',
  'help.guide.tour-multi-day.goal': '경로 하나를 이동하는 날마다 한 구간씩 나눠요.',
  'help.guide.tour-multi-day.tip.2':
    '두 구간을 다시 합치려면 달 아이콘이 있는 정차 지점의 메뉴에서 ‘구간 끝 제거’를 고르세요. 그 정차 지점을 삭제해도 합쳐지고, 알림에 ‘실행 취소’가 나와요.',
  'help.guide.tour-stages-on-days.step.3':
    '‘이날부터 구간별로’를 고르세요. 1구간이 그날에, 다음 구간이 그다음 날에 차례로 들어가요. ‘이날 전체 투어’를 고르면 대신 경로 전체가 그 하루에 들어가요.',
  'help.guide.tour-stages-on-days.result': '모든 구간이 여행의 각 날에 들어가고, 연 구간은 편집기에 있어요.',
  'help.ctx.trip-tour-hike.bullet.6':
    '오른쪽 ‘투어 요약’에는 거리, 오르막, 예상 걷기 또는 달리기 시간, 휴식, 계획된 총시간이 나오고 그 아래에 고도 프로필이 있어요. 편집기 아래쪽 ‘저장’으로 투어를 저장해요.',
  'help.guide.tour-hike-plan.step.6': '왼쪽 열 아래쪽의 ‘저장’을 클릭하세요.',
  'help.guide.tour-hike-trail-details.step.1':
    '‘이 여행의 투어’에서 하이킹을 열고 ‘웨이포인트’ 카드 아래의 ‘길 정보’를 찾으세요. ‘경로를 따라 표시’를 켜세요.',
  'help.guide.tour-hike-trail-details.tip.3':
    '이 카드는 투어를 바꾸지 않고, 인터넷 연결이 필요해요. 가져온 하이킹에도 같은 카드가 보이지만 난이도 한도는 없어요.',
  'help.guide.tour-hike-round.result':
    '하이킹이 고른 순환 코스를 따라 출발점으로 돌아와요. 지도 아래쪽 ‘순환 코스 선택됨’에 ‘실행 취소’가 있고, ‘저장’하면 그대로 남아요.',
  'help.guide.tour-hike-compare-ways.step.3':
    '줄의 배지는 지금 길보다 얼마나 더 길고, 높고, 느린지 알려 줘요. 원하는 길을 클릭하세요.',
  'help.guide.tour-ferrata-add.step.1':
    '하이킹을 연 상태에서 왼쪽 아래 지도 버튼 줄의 ‘비아 페라타’를 클릭하세요. 배지는 화면 안의 비아 페라타 수예요. 확대하라고 나오면 확대하세요.',
  'help.guide.tour-ferrata-add.tip.3':
    '비아 페라타 구간은 고도 프로필에 강조돼서, 하루 중 언제쯤 도착하는지 알 수 있어요.',
  'help.guide.tour-run-plan.step.5': '‘투어 이름’에 달리기 이름을 입력하고 ‘저장’을 클릭하세요.',
  'help.guide.tour-run-ways.step.1':
    '‘이 여행의 투어’에서 달리기를 열고, ‘웨이포인트’ 카드 아래 ‘길 정보’에서 ‘경로를 따라 표시’를 켜세요.',
  'help.ctx.trip-tour-walk.bullet.1':
    '‘투어 유형’에서 ‘도심 산책 / 관광’을 고르면 투어가 산책이 돼요. 지점은 ‘레이블’, 머무는 시간, 중요도가 있는 정차 지점이에요. 산책에는 하이킹 한도와 ‘휴식’ 칸이 없고, 대신 머무는 시간이 쓰여요.',
  'help.guide.tour-walk-plan.step.2':
    '정차 지점을 추가하세요. ‘지점 추가’가 켜져 있는지 확인하고 지도에서 지점마다 클릭하거나, ‘여행 장소’를 클릭해 여행에 이미 있는 장소를 가져오세요.',
  'help.guide.tour-walk-plan.result':
    '산책에 정차 지점과 머무는 시간이 나열되고, ‘투어 요약’이 합계를 내요. 날에 넣으면 각 정차 지점에 언제 도착하는지 볼 수 있어요.',
  'help.guide.tour-walk-sights.tip.1': '산책의 정차 지점이 될 뿐, 여행 장소가 되지는 않아요.',
  'help.guide.tour-walk-day-times.step.3':
    '‘투어’ 탭에서 산책을 다시 여세요. ‘웨이포인트’ 위쪽 ‘시간 기준’에 날과 시작 시간이 보여요. 여러 날에 넣은 산책이라면 클릭해서 다른 날을 고르세요.',
  'help.guide.tour-walk-google-import.goal':
    'Google Maps에서 공유한 도보 경로를 붙여 넣어 정차 지점을 산책으로 불러와요.',
  'help.guide.tour-walk-google-import.result':
    'Google Maps의 정차 지점이 담긴 새 도심 산책이 편집기에 열려요. 저장만 하면 돼요.',
  'help.guide.tour-walk-check-off.tip.2': '일정의 산책 줄에도 3/7처럼 개수가 보여요.',
  'help.ctx.trip-tour-bike.bullet.4':
    'MTB 프로필에서는 같은 카드에 매퍼가 입력한 트레일 등급(mtb:scale)이 보여요. 등급이 없는 길은 쉬운 길이 아니라 알 수 없는 길이에요.',
  'help.guide.tour-bike-profile.step.6': '‘투어 이름’에 이름을 입력하고 왼쪽 레일 아래쪽의 ‘저장’을 클릭하세요.',
  'help.guide.tour-bike-surfaces.goal':
    '경로 중 아스팔트, 자갈, 알 수 없는 노면이 얼마나 되는지, 어떤 종류의 길을 지나는지 알아봐요.',
  'help.guide.tour-bike-surfaces.tip.3':
    '이 카드는 라우터가 계획한 경로를 그대로 쓰고 투어는 바꾸지 않아요. 인터넷 연결이 필요하고, 오프라인이면 그렇게 알려 줘요. 경로에는 영향이 없어요.',
  'help.guide.tour-bike-mtb-grades.tip.1':
    '‘데이터에 난이도 없음’은 쉽다는 뜻이 아니라 알 수 없다는 뜻이에요. 난이도만으로는 그 트레일이 나에게 맞는지 알 수 없어요.',
  'help.ctx.trip-tour-ski.bullet.3':
    '지도에서 클릭한 지점은 슬로프, 리프트, 코스를 따라 앞 지점과 이어져요. 지점마다 아래에 구간이 칩으로 나열되는데, 슬로프는 난이도 색과 소요 시간(분)으로 보여요. 계획할 수 없는 구간은 빨간색이 되고, 이유와 함께 해결 방법이나 ‘직선으로 그리기’를 제안해요.',
  'help.guide.tour-ski-plan.step.4':
    '‘지점 추가’가 켜져 있는지 확인하고, 지도에서 출발 지점과 가려는 곳을 순서대로 클릭하세요. 슬로프 라우터가 각 지점을 슬로프, 리프트, 코스를 따라 앞 지점과 이어 줘요.',
  'help.guide.tour-ski-options.title': '슬로프 라우터에 내 스키 스타일 알려 주기',
  'help.guide.tour-ski-options.tip.2':
    '‘리프트 이용’은 ‘알파인’과 ‘스노보드’에서는 기본으로 켜져 있고, 다른 종목에서는 꺼져 있어요. ‘제외’와 ‘필요하면 리프트로 하산’은 리프트를 이용할 때만 보여요.',
  'help.guide.tour-ski-fix-leg.tip.1':
    '지도에서 지점을 슬로프, 코스, 리프트 가까이로 끌어도 돼요. 놓으면 구간을 다시 계획해요.',
  'help.guide.tour-ski-summary.step.2':
    '‘스키’, ‘리프트 탑승’, ‘대기’, ‘도보’에는 각각의 시간이 나와요. ‘슬로프’, ‘슬로프 하강’, ‘리프트 탑승’에는 슬로프 길이, 슬로프로 내려온 높이, 탄 리프트 수가 나와요.',
  'help.guide.tour-ski-pistes-layer.goal':
    '스키 투어 주변의 슬로프, 크로스컨트리 코스, 리프트와 그 색의 의미를 확인해요.',
  'help.guide.tour-ski-import.title': '스키 트랙을 가져와 종류 정하기',
  'help.guide.tour-ski-import.tip.1':
    '가져온 트랙은 기록된 그대로 남아요. TREK는 슬로프에 맞추지 않고, 카드의 ‘스키 시간’은 ‘계산 안 함’으로 보여요.',
  'help.ctx.trip-tour-paddle.bullet.3':
    '지점의 ‘작업 더 보기’에 패들 도구가 있어요: 다음 구간을 물길로 계획하거나 손으로 그리기, ‘여기부터 육상 운반’, ‘이 지점에 갑문 추가’.',
  'help.guide.tour-paddle-setup.step.3':
    '‘배’에서 ‘카약’, ‘카누’, SUP, ‘기타’ 중 하나를 고르세요. 배에 따라 TREK가 제안하는 속도가 달라져요.',
  'help.guide.tour-paddle-setup.tip.4':
    '열 맨 아래 줄 ‘패들링에는 위험이 따릅니다’를 누르면 ‘수상 안전’이 열려요. 첫 투어 전에 한 번 읽어 보세요.',
  'help.guide.tour-paddle-water-route.step.5':
    '손으로 그린 구간을 한 번에 모두 계획하려면 ‘웨이포인트’ 헤더의 물결 아이콘 ‘손으로 그린 구간을 물 위로 계획’을 클릭하세요.',
  'help.guide.tour-paddle-portage.step.1': '물에서 내릴 정차 지점을 가리키고 점 세 개 ‘작업 더 보기’를 클릭하세요.',
  'help.guide.tour-paddle-portage.result':
    '그 구간이 지도와 웨이포인트에서 육상 운반 구간이 되고, ‘시간 추정’에서도 운반으로 계산돼요.',
  'help.guide.tour-paddle-lock.tip.2':
    '육상 운반 구간이 갑문을 돌아가면 갑문이 흐려지고 ‘보트를 들고 우회’로 표시돼요. 대신 육상 운반 시간이 계산되고 갑문 통과 시간은 빠져요.',
  'help.guide.tour-paddle-time.step.4':
    '투어에 육상 운반이 있으면 ‘운반’ 줄에서 운반 시간을 계산해요. 속도를 클릭하고 보트를 들고 가는 속도를 입력하세요. ‘출수와 재입수’는 육상 운반 구간마다 그 시간(분)을 더해요.',
  'help.guide.tour-paddle-wind.step.1':
    '패들 투어를 여행의 한 날에 넣으세요. 그러면 왼쪽 열 ‘바람’ 카드에 그날 투어 출발 지점의 예보가 보여요.',
  'help.guide.tour-paddle-wind.result': '출발 지점의 그날 바람을 시간대별로 알 수 있어요.',
  'help.guide.tour-paddle-checklist.tip.1':
    '장애물마다 어떻게 할지 고르세요: ‘패들링으로 통과’, ‘육상 운반’, ‘우회’, ‘영향 없음’. ‘다음’을 누르면 아직 정하지 않은 다음 항목으로 넘어가요.',
  'help.guide.tour-paddle-track-marks.step.1':
    '‘투어’ 탭 오른쪽 열에서 ‘투어 추가’를 클릭하고 ‘GPX 또는 KML 가져오기’를 고른 뒤 파일을 선택하세요.',
  'help.guide.tour-paddle-track-marks.tip.2':
    '‘취소’는 저장하지 않은 표시를 버려요. 기록된 트랙 자체는 다시 그려지지 않아요.',
  'help.ctx.trip-tour-horse.bullet.4':
    'TREK는 승마 시간을 계산하지 않아요. 그날 일정에 시간을 넣고 싶다면 ‘상세 정보’의 ‘예정’에 입력하세요.',
  'help.guide.tour-horse-plan.step.5':
    '‘구간’에서 구간 하나를 고르세요. 그 구간을 달리는 ‘방향’과, 구간을 따라 ‘말 통행’이 어떻게 표시되는지 확인하세요.',
  'help.guide.tour-horse-plan.tip.5':
    '승마는 경로를 자동으로 계산하지 않아요. 그려진 선을 클릭해도 형태 지점이 추가되지 않고, 구간 양 끝 지점은 경로에 있는 자리 그대로예요.',
  'help.guide.tour-horse-gap.tip.1':
    '직접 그린 구간은 라우터도, 승마 경로도 확인하지 않았어요. 실제로 어디를 지나는지 지도에서 확인하세요.',
  'help.guide.tour-horse-recorded.step.4':
    '왼쪽 열에 승마가 열려요. ‘기록된 승마’ 카드에 ‘기록된 그대로’, ‘승마 시간 없음’, ‘통행 여부 미확인’이 보여요. 배지를 가리키면 이유를 볼 수 있어요.',
  'help.guide.dateless-trip.step.2':
    '‘시작일’과 ‘종료일’은 비워 두세요. 그 아래에 ‘일수’ 칸이 나타나면 계획할 날 수를 입력하세요.',
  'help.guide.trip-reminder.tip.1':
    '‘리마인더’ 블록은 여행 소유자(또는 관리자)에게만 보여요. 회색으로 비활성화돼 있다면 관리자가 먼저 ‘관리자’, ‘알림’에서 여행 리마인더를 켜야 해요.',
  'help.guide.upcoming-reservations.step.2': '예약을 클릭하면 그 예약이 속한 여행이 열려요.',
  'help.guide.timezones-widget.tip.1':
    '목록은 Europe/Lisbon, America/New_York 같은 공식 시간대 이름을 쓰니까, 이름에 들어 있는 도시로 검색하세요.',
  'help.guide.half-company-holiday.step.2': '같은 도구 모음에서 ‘반차’를 켜세요.',
  'help.guide.edit-holiday-calendar.tip.1': '바꾸는 즉시 저장돼요. ‘저장’ 버튼은 따로 없어요.',
  'help.guide.person-color.tip.1': '도구 모음과 ‘휴가 일수’ 카드에서도 같은 색으로 그 사람을 표시해요.',
  'help.guide.answer-fusion-request.step.2':
    '퓨전이 무엇인지 읽어 보세요: 캘린더 하나를 함께 쓰고, 서로의 항목을 편집할 수 있으며, 휴일 설정도 공유해요.',
  'help.guide.log-for-partner.step.2': '도구 모음을 확인하세요. 첫 번째 버튼에 이제 그 사람의 이름과 색이 보여요.',
  'help.guide.dissolve-fusion.step.2': '맨 아래 ‘퓨전 해제’에서 ‘해제’를 클릭하세요.',
  'help.guide.country-places.step.3':
    '창에 그 국가로 집계된 모든 장소가 여행별로 나와요. 여섯 개가 넘으면 위쪽 ‘장소 검색’으로 목록을 좁힐 수 있어요. 장소나 여행 제목을 클릭하면 그 여행이 계획 화면에서 열려요.',
  'help.guide.tour-activity-stats.step.5':
    '‘투어 보기’를 클릭하세요. ‘나의 투어 기록’이 열리고 합계, ‘종류별’ 분류, 기간 내 모든 투어가 날짜, 여행, 거리, 오르막과 함께 나와요. 헤더의 버튼으로 여기서도 기간과 유형을 바꿀 수 있어요.',
  'help.guide.move-to-list.step.3': '옮길 목록을 고르세요. 목록이 세 개가 넘으면 위쪽 검색창으로 좁힐 수 있어요.',
  'help.guide.accept-list-invite.goal': '누군가 공유한 목록에 참여하거나 초대를 거절해요.',
  'help.guide.tour-collection-add-to-trip.step.4': '원하면 ‘여행에서의 이름’을 바꾸고 ‘여행에 추가’를 클릭하세요.',
  'help.guide.tour-collection-manage.step.2': '‘장소 검색’에 입력하세요. 장소와 함께 투어도 이름으로 걸러져요.',
  'help.guide.create-journey.tip.3':
    '여행이 막 끝났다면 맨 위 ‘여행이 방금 종료됨’ 배너의 ‘Journey 만들기’를 누르세요. 그 여행이 이미 선택된 상태로 Journey가 시작돼요.',
  'help.guide.entry-draft.step.2': '‘저장’을 클릭하세요. 이제 카드에 ‘초안’ 배지가 붙어요.',
  'help.guide.gallery-map.step.3':
    '‘타임라인’으로 돌아오면 오른쪽 지도가 스크롤을 따라 움직여요. 화면에 보이는 항목은 그날 색의 테두리로 표시돼요. 핀을 클릭하면 타임라인이 그 항목으로 스크롤돼요.',
  'help.guide.journey-map-layers.tip.1': '색 점선은 계획에 속한 여행의 GPX 경로이고, 실선은 그날 기록된 경로예요.',
  'help.guide.journey-keep-route.tip.1': '기록이 끊긴 곳에서 선도 끊겨요. TREK는 기록된 부분만 그려요.',
  'help.guide.journey-day-stays.tip.1':
    '이 줄은 Journey를 편집할 수 있고 자기 Dawarich를 연결한 사람에게만, 그리고 아직 정할 것이 남은 날에만 보여요.',
  'help.guide.journey-take-over-day.step.4':
    '경로도 남기려면 ‘이 날의 경로도 저장’을 켜 둔 채 ‘가져오기’ 버튼을 클릭하세요. 버튼에 만들어질 초안 수가 보여요.',
  'help.guide.journey-auto-prepare.step.3':
    '아래 줄에 방문 기록을 마지막으로 가져온 시각이나 실패한 이유가 나와요. ‘지금 가져오기’를 클릭하면 Dawarich에 바로 요청해요.',
  'help.guide.photo-location.tip.1': '직접 지정한 장소는 절대 옮겨지지 않아요.',
  'help.ctx.settings-plugins.bullet.1':
    '‘플러그인 설정’: 그 아래에 입력이 필요한 플러그인마다 카드가 하나씩 있고, 입력 칸과 ‘저장’이 있어요. 비밀 값은 저장하고 나면 다시 보이지 않아요.',
  'help.guide.dashboard-widgets.step.3': '카드 아래의 ‘기본값으로 초기화’는 ‘모양’ 탭 전체를 처음 설정으로 되돌려요.',
  'help.guide.web-push-device.result':
    '카드에 ‘이 기기에서 켜짐’이 보이고, ‘푸시’에서 켠 이벤트는 TREK를 닫아 둬도 알림이 와요.',
  'help.guide.connect-airtrail.step.1':
    '‘통합’에서 AirTrail을 찾아 ‘인스턴스 URL’과 API 키를 입력하세요. 키는 AirTrail의 ‘Settings’, ‘Security’에서 만들어요.',
  'help.guide.connect-dawarich.step.1':
    '‘통합’에서 Dawarich를 찾아 ‘인스턴스 주소’와 API 키를 입력하세요. API 키는 Dawarich의 ‘Account’, ‘API key’에 있어요.',
  'help.guide.tour-connect-wanderer.step.1':
    '‘통합’에서 wanderer를 찾아 ‘인스턴스 URL’과 API 토큰을 입력하세요. 토큰은 wanderer의 ‘Settings’, ‘Account’, ‘API tokens’에서 만들고, wanderer_key_로 시작해요.',
  'help.guide.tour-wanderer-watch.goal': '가져온 트레일이 바뀌었는지 TREK가 백그라운드에서 확인하게 해요.',
  'help.guide.mcp-oauth.tip.3':
    'API 토큰은 아직 동작하지만 ‘지원 중단 예정’으로 표시돼요. OAuth 클라이언트로 옮기세요.',
  'help.guide.offline-conflicts.tip.2': '이 선택은 이 기기에만 적용돼요.',
  'help.guide.default-user-settings.tip.1':
    '사용자가 ‘설정’에서 직접 고른 값이 항상 우선이에요. 여기 값은 그 설정을 바꾸지 않은 모든 사람에게 적용돼요.',
  'help.guide.own-routing-engine.step.1': '‘기본값’의 ‘지도’에서 ‘자체 경로 서버’에 OSRM 서버 주소를 입력하세요.',
  'help.guide.admin-passkeys.tip.2': '나중에 도메인을 바꾸면 이미 등록된 패스키가 모두 동작하지 않아요.',
  'help.guide.instance-keys.tip.4': 'Amap 키는 JS API 키가 아니라 Web 服务(웹 서비스) 키여야 해요.',
  'help.guide.rotate-jwt-secret.step.2': '경고를 읽고 ‘교체 후 로그아웃’을 클릭하세요.',
  'help.guide.notification-defaults.tip.2': '기본값은 그 칸을 직접 바꾸지 않은 사람에게만 적용돼요.',
  'help.ctx.notifications.bullet.5':
    '여기서 어떤 이벤트를 받고, 이메일, 웹훅, ntfy, 푸시로는 어떤 이벤트를 받을지 ‘설정’의 ‘알림’에서 정해요.',
  'help.guide.read-notifications.result': '알림이 가리키던 화면으로 이동하고, 벨의 숫자가 하나 줄어요.',
  'help.guide.mark-notifications-read.title': '알림을 읽음으로 표시하기',
  'help.guide.delete-notifications.goal': '필요 없는 알림을 지워서 목록을 짧게 유지해요.',
  'help.guide.notification-settings.step.1': '오른쪽 위의 내 이름을 클릭하세요.',
  'help.guide.public-link.step.5': '링크가 있는 동안에는 선택을 바꿀 수 있어요. ‘링크 삭제’를 누르면 링크가 꺼져요.',
  'help.guide.link-journal.step.3':
    '여행의 사람마다 ‘접근 불가’, ‘읽기’, ‘편집’ 중 하나를 고르세요. ‘모두 읽기’와 ‘없음’으로 한 번에 정할 수도 있어요.',
  'help.guide.collapse-columns.tip.3': '구분선에 포커스가 있으면 화살표 키로도 움직일 수 있어요.',
  'help.guide.edit-place.tip.3':
    '창 바깥을 클릭해도 변경 사항은 사라지지 않아요. TREK가 먼저 ‘변경 사항을 버릴까요?’라고 묻고, ‘계속 편집’을 누르면 양식으로 돌아가요.',
  'help.guide.dawarich-stays.goal': '여행 중 Dawarich가 기록한 머문 곳을 하나씩 확인한 뒤 장소로 추가해요.',
  'help.guide.leave-stop-off-route.step.1':
    '들를 곳을 오른쪽 클릭하거나 점 세 개를 클릭하고 ‘경로에서 제외’를 고르세요.',
  'help.guide.move-booking-day.step.3':
    '이제 그 줄이 새 날의 원래 시간 자리에 보여요. 시간도 바꿔야 한다면 예약을 여세요.',
  'help.guide.place-image-from-file.goal': '장소 파일에 이미 있는 사진을 다시 올리지 않고 장소 사진으로 써요.',
  'help.guide.place-image-from-file.tip.3': '장소를 수정할 수 있는 여행자만 사진을 바꿀 수 있어요.',
  'help.guide.place-own-hours.result':
    '카드에 내가 입력한 전화번호, 이메일, 영업시간이 보이고, 사진 둘레 테두리도 내 영업시간을 기준으로 초록색이나 빨간색이 돼요.',
  'help.guide.confirm-stay-booking.step.4':
    '오른쪽 위 X로 예약을 닫으세요. ‘예약’ 아래 숙박 카드에 이제 ‘확정됨’이 보여요.',
  'help.guide.tour-map-lines.title': '지도에서 투어 찾기',
  'help.guide.tour-map-lines.tip.2':
    '투어 숨기기는 나에게만 적용되고, 이 여행에 대해 이 브라우저에 저장돼요. 투어와 그 날짜, 색은 모두에게 그대로예요. ‘투어’ 목록 위의 ‘모두 표시’를 누르면 숨긴 투어가 다시 모두 보이고, 휴대폰 지도에는 항상 모든 투어가 보여요.',
  'help.guide.car-stops.step.4':
    '‘가는 길의 경유지’에서 지나가는 곳마다 ‘경유지 추가’를 클릭해 장소를 고르고, 원하면 옆에 시간도 넣으세요. 장소를 고르지 않은 경유지는 저장할 때 삭제돼요.',
  'help.guide.transport-details.step.2':
    '헤더의 버튼에 상태, 유형, 날짜, ‘예약 코드’가 보여요. 상태 버튼을 클릭하면 ‘대기 중’과 ‘확정됨’이 바뀌어요. 코드 옆 작은 복사 아이콘 ‘예약 코드 복사’로 코드를 클립보드에 복사해요.',
  'help.guide.group-sort-bookings.step.3':
    '‘정렬’에서 ‘날짜’, ‘제목’, ‘유형’, ‘상태’ 중 하나를 고르세요. 그 아래 줄로 순서를 뒤집어요: 날짜는 ‘이른 순’이나 ‘늦은 순’, 나머지는 ‘가나다순’이나 ‘Z→A’.',
  'help.guide.booking-on-map.title': '지도에서 예약 찾기',
  'help.guide.export-bookings-csv.tip.1':
    '열은 ‘유형’, ‘제목’, ‘상태’, ‘시작’, ‘종료’, 출발지, 도착지, ‘위치’, ‘확인’, ‘메모’예요.',
  'help.guide.arrange-packing-list.tip.1': '‘가나다순’이 켜져 있으면 항목은 끌 수 없지만, 목록은 통째로 끌 수 있어요.',
  'help.guide.count-packed-pieces.step.3':
    '일부만 챙겼을 때는 카운터가 강조 색으로 보이고, 체크박스에도 그 색 테두리가 생겨요. 빼기를 클릭하면 개수에서 하나가 빠져요.',
  'help.guide.expense-receipts.step.5':
    '미리보기에 영수증이 보이고, 위쪽에 ‘새 탭에서 열기’와 ‘다운로드’가 있어요. 영수증이 여러 장이면 화살표 키로 넘기고, Esc로 미리보기를 닫아요.',
  'help.guide.files-sync-settings.step.3': '흐름 바 아래의 ‘설정’을 클릭하면 나머지 옵션이 보여요.',
  'help.guide.manage-notes.step.3':
    '같은 메뉴의 ‘고정’을 누르면 메모가 패널 맨 위에 고정되고, 카테고리 색 테두리와 제목 옆 핀이 붙어요. 같은 메뉴의 ‘고정 해제’로 원래 자리로 돌려요.',
  'help.guide.note-categories.step.1':
    '‘메모’ 카드 헤더의 ‘새 메모’ 옆 톱니바퀴를 클릭하세요. ‘카테고리 관리’가 열리고 카테고리마다 색, 이름, 색 점 여섯 개, 휴지통이 있는 줄이 보여요.',
  'help.guide.note-categories.tip.2':
    '메모가 없는 카테고리는 내 브라우저에만 저장돼요. 다른 멤버는 그 카테고리에 메모가 들어가야 볼 수 있어요.',
  'help.guide.roadtrip-reorder.goal': '레일에서 바로 주행 순서를 바꾸거나 들를 곳을 다른 날로 옮겨요.',
  'help.guide.roadtrip-overnight.step.4':
    '옆의 ‘숙소 찾기’에는 복사할 이름과 예약 사이트 링크가 있어요: 호텔은 trivago나 CHECK24, 캠핑장은 PiNCAMP나 Pitchup. 장소, 날짜, 인원은 사이트에서 확인하세요.',
  'help.guide.roadtrip-stop-fill.step.2':
    '‘충전 목표’에서 50~100 사이를 고르세요. 버튼 아래 줄에 그만큼 채우면 여기서 얼마나 갈 수 있는지 나와요.',
  'help.guide.roadtrip-bookings.step.2':
    '레일에서 이동은 유형 색의 카드로 보이고, 도착 열에 시간표가, 제목 아래에 출발지와 도착지가 나와요.',
  'help.guide.roadtrip-google-import.tip.1':
    'TREK는 들를 곳 사이 경로를 직접 계산해요. Google의 도로를 그대로 복사하지 않아요.',
  'help.guide.roadtrip-hazards.result': '지도에 여행 주변의 현재 경고가 보이고, 경로는 바뀌지 않아요.',
  'help.ctx.trip-tours.bullet.3':
    '한 줄에서 색 막대는 지도의 투어 선이고, 둥근 타일에는 난이도 한도(T1~T6)나 유형이 보여요. 작은 GPX나 wanderer 배지는 가져온 투어라는 뜻이고, 배지에 날짜, 시간, 거리, 오르막이 나와요. 숫자가 붙은 달 아이콘은 여러 날 투어의 구간 수예요.',
  'help.guide.tour-show-list.step.3': '줄을 클릭하세요. 지도 위에 투어 카드가 열려요.',
  'help.guide.tour-add-to-day.goal': '투어를 언제 할지 정해서 그날 일정에 넣고 지도에 선으로 표시해요.',
  'help.guide.tour-add-to-day.tip.3':
    '투어는 한 날에 한 번만 넣을 수 있어요. 이미 들어 있는 날에 놓으면 ‘이 투어는 이미 해당 날짜에 있습니다.’라는 안내만 나와요.',
  'help.guide.tour-day-times.step.4':
    '그날 다음 항목이 시작된 뒤에 투어가 끝나면 줄 아래에 안내가 나와요. 예: ‘13:30에 끝남, 12:30에 시작하는 Gostner Schwaige 점심 이후’. 아무것도 옮겨지지 않아요.',
  'help.guide.tour-remove-from-day.step.1':
    '날 열에서 투어 줄을 가리키고 ‘추가 옵션’을 클릭한 뒤 ‘날에서 제거’를 고르세요.',
  'help.guide.tour-filter-list.step.1':
    '‘GPX 또는 KML 가져오기’ 아래의 필터 버튼을 클릭하세요. 버튼에 현재 필터 상태(처음에는 ‘전체’)와 옆에 투어 수가 보여요.',
  'help.guide.tour-hide-on-map.title': '지도에서 투어 선 숨기기',
  'help.guide.tour-import-plan-tab.title': '‘계획’ 탭에서 트랙 가져오기',
  'help.ctx.trip-tour-detail.title': '투어 상세',
  'help.guide.tour-detail-read.goal': '투어에 대한 여행의 모든 정보를 확인해요: 날짜, 거리와 고도, 프로필, 출처.',
  'help.guide.tour-detail-read.tip.1':
    '주황색 ‘주의해서 사용’ 표시는 가져온 데이터의 고도나 측정값이 불완전하다는 뜻이에요. 오르막과 프로필을 볼 때 참고하세요.',
  'help.guide.tour-rename-colour.step.1': '투어 카드를 열고 이름 옆의 연필을 클릭하세요. 이름이 입력 칸으로 바뀌어요.',
  'help.guide.tour-take-along.goal':
    '투어 출발점까지 길 안내를 받거나, 웹에서 투어 페이지를 열거나, 경로를 GPX 파일로 내려받아요.',
  'help.guide.tour-take-along.result': '지도 앱에 출발점까지 가는 길이, GPX 파일에 전체 경로가 준비됐어요.',
  'help.guide.tour-copy-keep.tip.2': '일정에서 투어 메뉴의 ‘컬렉션에 저장’도 같은 창을 열어서, 경로도 함께 저장돼요.',
  'help.guide.tour-packing-link.step.3': '‘링크’를 클릭하세요.',
  'help.guide.tour-files.goal': '투어에 예약, 지도, 경로 설명을 첨부하고 투어 카드에서 다시 열어요.',
  'help.guide.tour-activity-link.goal': '계획은 그대로 두고, 기록된 GPX 트랙을 계획한 투어에 연결해요.',
  'help.guide.tour-activity-link.tip.3':
    '‘소요 시간’은 트랙의 첫 타임스탬프부터 마지막 타임스탬프까지이고, 휴식 시간도 포함돼요.',
  'help.guide.tour-activity-compare.tip.1':
    '‘지도에서 비교’는 카드가 지도 옆에 보일 때만 쓸 수 있고, 휴대폰에서는 안 돼요.',
  'help.guide.tour-origin-check.tip.1': '다른 여행에서 가져온 투어는 ‘가져온 곳’에 그 여행과 투어 이름이 보여요.',
  'help.ctx.trip-tour-planner.bullet.3':
    '오른쪽 레일 ‘이 여행의 투어’에는 모든 투어가 나오고, 목록 위에 필터와 ‘여행 합계’가 있어요. 투어를 열면 위쪽 ‘투어 요약’에 거리, 오르막, 시간, 고도 프로필이 나와요. 위쪽 + 버튼 ‘투어 추가’로 투어를 계획하거나, 가져오거나, 다른 여행에서 가져와요.',
  'help.guide.tour-open-workspace.step.3':
    '오른쪽 레일 ‘이 여행의 투어’에 여행의 모든 투어가 나오고, 목록 위에 필터와 ‘여행 합계’가 있어요.',
  'help.guide.tour-open-workspace.result': '‘투어’ 탭: 왼쪽에 편집기, 오른쪽에 여행의 투어, 그 사이에 지도가 있어요.',
  'help.guide.tour-draw-route.step.6':
    '‘웨이포인트’에 지점마다 번호가 붙은 줄이 생기고, 이름을 불러오면 장소 이름이 붙어요. TREK가 작업하는 동안 ‘새 투어’ 옆 작은 점으로 진행 상태를 보여 줘요.',
  'help.guide.tour-type-profile.step.1':
    '‘투어 이름’ 아래의 ‘투어 유형’을 클릭하세요. 현재 유형과 어떻게 계획되는지 한 줄 설명이 보여요.',
  'help.guide.tour-edit-points.goal': '지도나 목록에서 지점을 옮겨 투어가 지나는 곳을 바꿔요.',
  'help.guide.tour-edit-points.tip.2':
    '장소 이름을 불러오기 전까지 줄에는 좌표가 보여요. 실행 취소와 다시 실행에는 키보드 단축키가 없어요.',
  'help.guide.tour-shaping-points.tip.1': '시작점과 끝점은 항상 정차 지점이에요.',
  'help.guide.tour-loop-reverse.step.3': '투어 전체를 반대 방향으로 걸으려면 옆의 ‘방향 뒤집기’를 클릭하세요.',
  'help.guide.tour-leg-by-hand.step.2':
    '그 구간이 점선 직선으로 바뀌고, 줄 아래 목록에 ‘손으로 그림, 경로 계산 안 됨’과 길이가 보여요.',
  'help.guide.tour-trip-places.step.1':
    '‘웨이포인트’에서 ‘지점 추가’ 옆의 ‘여행 장소’를 클릭하세요. 그 아래에 여행 장소가 나타나요.',
  'help.guide.tour-details-times.title': '투어 이름 짓고 시간 계획하기',
  'help.guide.tour-details-times.tip.3':
    '‘상세 정보’ 옆 화살표를 클릭하면 접혀요. ‘저장’할 수 없는 값이 들어 있으면 자동으로 펼쳐져요.',
  'help.guide.tour-save.tip.1':
    '‘저장’ 옆의 ‘취소’는 확인 후 저장하지 않은 변경을 버려요. 저장된 투어는 바뀌지 않아요.',
  'help.guide.tour-edit-saved.step.3':
    '‘저장’을 클릭하세요. ‘투어를 저장했습니다’가 나타나고, 투어의 날짜, 파일, 메모는 그대로 유지돼요.',
  'help.guide.tour-summary-profile.step.1':
    '‘이 여행의 투어’ 맨 위 ‘투어 요약’에 편집 중인 투어의 ‘거리’, ‘누적 상승 고도’, ‘누적 하강 고도’, 예상 시간, 휴식, 계획된 총시간이 나와요.',
  'help.guide.tour-list-manage.title': '여행의 투어 관리하기',
  'help.guide.tour-list-manage.tip.2':
    '이미 투어가 들어 있는 날은 날 메뉴에서 회색으로 보여요. 여러 날 투어라면 그날부터 구간별로 넣을지, 투어 전체를 그날에 넣을지 물어봐요.',
  'help.guide.tour-delete.tip.2': '날에서만 빼려면 대신 날 메뉴의 ‘날에서 제거’를 쓰세요.',
  'help.guide.tour-saved-elsewhere.step.4':
    '둘 다 남기려면 ‘새 투어로 저장’, 다른 버전을 불러오려면 ‘새 버전 불러오기’, 다른 버전을 내 것으로 바꾸려면 ‘덮어쓰기’를 고르세요.',
  'help.ctx.trip-tour-import.bullet.3':
    '가져온 투어는 ‘GPX 투어’나 ‘wanderer 투어’로 열려요: 선, ‘투어 요약’, 고도 프로필이 가져온 그대로 보여요. 목록의 줄에는 ‘GPX 가져오기’ 배지가 붙어요.',
  'help.guide.tour-import-gpx.step.4':
    '‘가져올 유형’에서 트랙이 무엇인지 확인하세요. 기본값은 ‘하이킹’이에요. ‘자전거 투어’나 ‘달리기’는 프로필을, ‘패들 투어’는 배와 수역을, ‘스키와 겨울’은 종목을 물어봐요.',
  'help.guide.tour-view-import.title': '가져온 트랙 살펴보기',
  'help.guide.tour-view-import.result': '기록된 트랙이 다시 계산되지 않고 가져온 그대로 보여요.',
  'help.guide.tour-plan-from-import.tip.2':
    '카드에 제안 경로가 긴 구간에서 트랙과 멀리 떨어진다고 나오면, 그 경로로 계획하기 전에 지도에서 그 부분을 확인하세요.',
  'help.guide.tour-restore-recorded.step.3':
    '‘기록된 트랙 복원’으로 확인하세요. 웨이포인트와 계산된 경로선은 삭제되고, 날짜와 메모는 남아요.',
  'help.guide.tour-take-over.step.3':
    '투어를 찾으세요: ‘이름으로 검색’에 입력하거나, 여행과 유형 필터로 목록을 좁혀요.',
  'help.guide.tour-import-wanderer.title': 'wanderer에서 트레일 가져오기',
  'help.guide.tour-import-wanderer.tip.3':
    '이미 여행에 있는 트레일에는 ‘이 여행에 있음’이 표시되고 ‘투어 열기’가 나와요. 가져온 뒤 바뀐 트레일에는 기존 것 옆에 ‘새 버전으로 가져오기’가 나와요.',
  'help.ctx.trip-tour-map.bullet.4':
    '왼쪽 패널의 ‘투어 경로 주변’ 카드는 경로 가까이의 전망대, 물, 산장, 식당 등을 찾아 결과를 나열해요. 목록의 장소를 투어에 정차 지점으로 추가할 수 있어요.',
  'help.guide.tour-map-layers.tip.1':
    '고른 지도는 페이지를 새로 고치기 전까지 여는 모든 투어에 유지돼요. 그 지도를 지원하지 않는 유형의 투어는 ‘지도’로 열리고, ‘계획’ 탭의 지도와 ‘설정’의 값은 바뀌지 않아요.',
  'help.guide.tour-along-search.step.4': '‘투어 경로 주변 검색’을 클릭하세요. TREK는 찾기만 하고 투어는 바꾸지 않아요.',
  'help.guide.tour-along-add-stop.step.1':
    '‘투어 경로 주변’ 목록에서 장소를 클릭하거나 지도의 핀을 클릭하세요. 지도 위에 카드가 열리고 무엇인지, 경로에서 얼마나 떨어져 있는지, 투어의 어디쯤인지 보여요.',
  'help.guide.tour-3d-terrain.title': '투어를 3D로 보기',
  'help.guide.tour-3d-terrain.tip.1': '화면을 움직인 뒤 같은 줄의 ‘개요’를 누르면 전체 경로가 다시 보여요.',
  'help.guide.tour-3d-flyover.step.4': '‘개요’를 클릭하면 투어 전체가 다시 보여요.',
  'help.guide.tour-map-overlays.step.2': '스위치 옆에 색 점이 있는 작은 사각형 ‘슬로프 범례’를 클릭하세요.',
  'help.ctx.trip-tour-stages.summary':
    '여러 날 투어는 경로 하나를 이동하는 날마다 한 구간씩 나눈 거예요. 여기서 하루가 끝나는 곳을 정하고, 구간마다 측정값을 보고, 구간을 여행의 날에 넣어요.',
  'help.guide.tour-multi-day.step.1': '‘이 여행의 투어’에서 투어를 클릭해 편집기에서 여세요.',
  'help.guide.tour-multi-day.tip.3':
    '구간 시간에는 휴식이 포함되지 않아요. 경고 색으로 보이는 ‘이동만 하루 이상’ 시간은 하루보다 길다는 뜻이에요.',
  'help.guide.tour-stages-on-days.step.4': '달 아이콘과 구간 수가 있는 버튼 ‘구간 보기’를 클릭해 구간을 펼치세요.',
  'help.ctx.trip-tour-hike.title': '하이킹과 달리기',
  'help.guide.tour-hike-plan.title': '정한 난이도 안에서 하이킹 계획하기',
  'help.guide.tour-hike-plan.result':
    '하이킹이 ‘이 여행의 투어’에 거리, 오르막, 걷는 시간과 함께 나와요. 이제 날에 넣으면 돼요.',
  'help.guide.tour-hike-trail-details.step.2':
    '표시할 항목을 고르세요: 하이킹 등급 SAC, ‘노면’, ‘길 유형’. 지도의 경로도 목록과 같은 색으로 보여요.',
  'help.guide.tour-hike-round.title': '원하는 길이쯤의 순환 하이킹 찾기',
  'help.guide.tour-hike-round.tip.1':
    '순환 코스는 하이킹의 ‘탐방로 최대 난이도’를 넘지 않아요. 카드의 T 버튼에 그 난이도가 보여요.',
  'help.guide.tour-hike-compare-ways.step.4':
    '‘이 길로 하기’를 클릭하세요. TREK가 라우터로 경로가 실제로 그 길을 따르는지 확인해요.',
  'help.guide.tour-ferrata-add.step.2':
    '지도에서 비아 페라타의 점선이나 표지를 클릭하세요. 카드에 이름, 등급, 길이가 보여요.',
  'help.guide.tour-ferrata-add.tip.4':
    '카드의 ‘OpenStreetMap에서 보기’로 비아 페라타의 원본 데이터를 열어요. 아무것도 불러올 수 없으면 배지가 주황색이 되고, 툴팁에 이유가 나와요.',
  'help.guide.tour-run-plan.result':
    '달리기가 ‘이 여행의 투어’에 ‘달리기 시간 (계획)’과 함께 나오고, 프로필과 페이스도 함께 저장돼요.',
  'help.guide.tour-run-ways.step.2': '이제 카드 위쪽에 달리기 코스 중 비포장 비율과 가장 어려운 등급의 길이 보여요.',
  'help.ctx.trip-tour-walk.bullet.2':
    '‘웨이포인트’에 정차 지점이 순서대로 나와요. 번호를 둘러싼 테두리는 ‘꼭 방문’(실선)이나 ‘선택 사항’(점선)을, 작은 방패는 ‘보호됨’을 나타내고, 이름 아래 버튼에 머무는 시간이 보여요.',
  'help.guide.tour-walk-plan.step.3':
    '‘웨이포인트’에서 정차 지점을 가리키고 옆의 ‘작업 더 보기’를 클릭한 뒤 ‘정류지 편집’을 고르세요.',
  'help.guide.tour-walk-sights.title': '도심 산책에 명소 추가하기',
  'help.guide.tour-walk-sights.tip.2':
    '경로를 바꾸면 찾은 장소가 이전 경로 기준이라서 버튼이 ‘다시 검색’으로 바뀌어요.',
  'help.guide.tour-walk-day-times.step.4':
    '정차 지점마다 아래에 도착 시간과 머무는 시간이 보여요. 그 시간에 문을 닫았거나 머무는 동안 문을 닫는 곳에는 경고가 나타나요.',
  'help.guide.tour-walk-google-import.step.1':
    '‘이 여행의 투어’에서 ‘투어 추가’(맨 위의 +)를 클릭하고 ‘Google Maps에서 산책 가져오기’를 고르세요.',
  'help.guide.tour-walk-check-off.title': '당일에 산책 정차 지점 체크하기',
  'help.guide.tour-walk-check-off.tip.3': '오프라인에서 산책을 날에 넣었다면 동기화된 뒤에 체크할 수 있어요.',
  'help.guide.tour-bike-profile.title': '내 라이딩에 맞는 자전거 투어 계획하기',
  'help.guide.tour-bike-profile.result':
    '자전거 투어가 저장되어 ‘이 여행의 투어’에 나와요. 프로필에 맞게 경로가 계산되고, ‘투어 요약’에 주행 시간이 보여요.',
  'help.guide.tour-bike-surfaces.step.1':
    '오른쪽 ‘이 여행의 투어’에서 자전거 투어를 클릭해 여세요. 경로가 계산되면 ‘웨이포인트’ 아래에 ‘노면과 길’ 카드가 나타나요.',
  'help.guide.tour-bike-surfaces.tip.4':
    '카드 제목을 클릭하면 접혀요. 새로 고침 후에도 이 브라우저에서는 접힌 상태로 남아요.',
  'help.guide.tour-bike-mtb-grades.tip.2':
    '매퍼가 오르막 등급을 입력한 곳에서는 아래에 ‘오르막 난이도 (mtb:scale:uphill)’가 별도 줄로 이어져요.',
  'help.ctx.trip-tour-ski.bullet.4':
    '웨이포인트 아래 ‘슬로프 경로’ 카드는 하루를 ‘스키’, ‘리프트 탑승’, ‘대기’, ‘도보’로 나누고, 슬로프 길이, 슬로프로 내려온 높이, 리프트 탑승 횟수를 보여 줘요. 모든 구간을 계획하면 오른쪽 ‘투어 요약’의 ‘스키 시간’에 합계가 나와요.',
  'help.guide.tour-ski-plan.step.5':
    '지점마다 아래에 구간이 칩으로 나와요: 슬로프, 리프트, 도보 구간이 이름이나 종류로 보이고, 슬로프에는 난이도 색 점이 붙으며, 각각 소요 시간(분)이 나와요.',
  'help.guide.tour-ski-options.goal':
    '가장 어려운 슬로프, 우선할 것, 내 속도, 탈 리프트를 정해서 구간을 나에게 맞춰요.',
  'help.guide.tour-ski-options.tip.3':
    '‘추정 연결 피하기’는 지도 데이터가 짐작만 하는 연결(예: 두 슬로프 사이의 지도에 없는 구간)을 경로에서 빼요.',
  'help.guide.tour-ski-fix-leg.tip.2':
    '그 지역의 슬로프 데이터를 아직 내려받는 중이면, 플래너가 기다렸다가 자동으로 다시 시도해요.',
  'help.guide.tour-ski-summary.step.3':
    '오른쪽 ‘투어 요약’의 ‘스키 시간’에 모두 합산돼요. 정보 점을 누르면 계산 방법이 나와요.',
  'help.guide.tour-ski-pistes-layer.step.1':
    '‘스키와 겨울’ 투어를 열면 지도에 슬로프가 자동으로 보여요. 지도 왼쪽 아래 줄의 눈 덮인 산 스위치로 끄고 켜요. 툴팁에는 ‘슬로프, 크로스컨트리 코스, 리프트’라고 나와요.',
  'help.guide.tour-ski-import.goal': '기록한 스키, 크로스컨트리, 스노슈 트랙을 가져와 알맞은 종목을 지정해요.',
  'help.guide.tour-ski-import.tip.2':
    '계획한 투어처럼 편집하려면 ‘편집 가능한 버전’ 카드의 ‘편집 가능한 버전 계획’을 쓰세요. 지점은 직선으로 이어져요.',
  'help.ctx.trip-tour-paddle.bullet.4':
    '‘시간 추정’은 물 위 시간, 보트 운반, 출수와 재입수, 갑문, 휴식을 더해요. 속도와 시간(분)은 바꿀 수 있어요.',
  'help.guide.tour-paddle-setup.step.4':
    '‘수역’에서 ‘강’이나 ‘호수’를 고르세요. 배와 수역을 둘 다 골라야 투어를 저장할 수 있어요.',
  'help.guide.tour-paddle-setup.result':
    '배, 수역, 속도가 정해진 새 패들 투어가 생겼어요. 이제 지도에 첫 지점을 찍으면 돼요.',
  'help.guide.tour-paddle-water-route.tip.1':
    '수역 데이터가 없는 곳은 인스턴스 설정에 따라 TREK가 그 지역 데이터를 자동으로 내려받거나 관리자에게 요청해요. 그동안 구간에 ‘수역 데이터를 불러오는 중’이 보이고, 데이터가 들어오면 자동으로 계획돼요. 보통 1~3분 걸려요.',
  'help.guide.tour-paddle-portage.step.2':
    '‘여기부터 육상 운반’을 고르세요. 다음 지점까지의 구간이 육지 위에 그려지는 육상 운반 구간이 돼요.',
  'help.guide.tour-paddle-lock.title': '갑문과 대기 시간 추가하기',
  'help.guide.tour-paddle-lock.tip.3': '‘갑문 삭제’는 열린 카드 아래쪽과 ‘작업 더 보기’에 있어요.',
  'help.guide.tour-paddle-time.step.5':
    '모든 갑문에 시간을 넣기 전까지 추정치에 ‘불완전’이 보이고, 줄 아래 메모에 빠진 항목이 나와요.',
  'help.guide.tour-paddle-wind.step.2':
    '풍향과 ‘평균’, ‘돌풍’을 확인하세요. ‘평균’은 그날 시간별 평균 풍속 중 가장 센 값이고, ‘돌풍’은 가장 센 돌풍이에요.',
  'help.guide.tour-paddle-checklist.title': '장애물 체크리스트 확인하기',
  'help.guide.tour-paddle-checklist.tip.2':
    '‘육상 운반’을 골라도 육상 운반 구간이 자동으로 계획되지는 않아요. ‘육상 운반 계획’을 클릭해 지도에서 설정하세요.',
  'help.guide.tour-paddle-track-marks.step.2':
    '‘가져오기 미리보기’에서 ‘가져올 유형’을 ‘패들 투어’로 정하고 ‘배’와 ‘수역’을 고르세요. 둘 다 골라야 가져오기를 계속할 수 있어요.',
  'help.guide.tour-paddle-track-marks.tip.3':
    '기록된 트랙에서는 ‘시간 추정’의 ‘수역’ 줄에 따로 속도가 있어요. 클릭하고 실제로 패들링한 속도를 입력하세요.',
  'help.ctx.trip-tour-horse.bullet.5':
    'GPX 파일에서 가져온 승마는 기록된 그대로 남고, ‘기록된 승마’ 카드에 가져오면서 계산하지 못한 항목이 나와요.',
  'help.guide.tour-horse-plan.step.6':
    '‘구간 가져오기’를 클릭하세요. 구간이 ‘웨이포인트’ 카드에 경로 이름이 적힌 배지로 승마에 추가돼요. 같은 방법으로 구간을 더 추가하세요.',
  'help.guide.tour-horse-gap.title': '승마 경로 사이 빈 구간 잇기',
  'help.guide.tour-horse-gap.tip.2':
    '지도에서 클릭한 지점도 같은 방식으로, 확인되지 않은 직선 구간으로 승마에 추가돼요.',
  'help.guide.tour-horse-recorded.result': '승마가 실제로 달린 그대로 여행에 들어가고, 거리와 고도는 파일 값을 써요.',
  'help.guide.dateless-trip.step.3': '‘새 여행 만들기’를 클릭하세요.',
  'help.guide.trip-reminder.tip.2':
    '새 여행에는 출발 3일 전 리마인더가 기본으로 설정돼요. 받을 채널은 ‘설정’, ‘알림’에서 골라요.',
  'help.guide.upcoming-reservations.result':
    '여행이 열려요. 대시보드로 돌아오면 위젯은 계속 다가오는 예약을 보여 줘요.',
  'help.guide.entitlement.tip.2': '퓨전한 계획에서는 사람마다 자기 줄이 있고, 다른 사람의 휴가 일수도 정할 수 있어요.',
  'help.guide.half-company-holiday.step.3': '날을 클릭하세요. 칸의 절반이 주황색으로 바뀌어요.',
  'help.guide.school-holidays.tip.2': '방학 기간의 날에 마우스를 올리면 ‘학교 방학’ 아래에 방학 이름이 보여요.',
  'help.guide.answer-fusion-request.step.3':
    '계획을 합치려면 ‘수락 및 퓨전’을, 내 계획을 따로 두려면 ‘거절’을 클릭하세요.',
  'help.guide.log-for-partner.step.3': '기록할 날을 클릭한 다음 ‘인원’에서 내 이름을 다시 클릭하세요.',
  'help.guide.dissolve-fusion.result': '모두 자기 계획과 자기 항목으로 돌아가고, ‘인원’에는 나만 남아요.',
  'help.guide.country-places.result': '그 장소가 속한 여행이 계획 화면에서 열려요.',
  'help.guide.tour-activity-stats.step.6':
    '하지 못한 투어는 줄 끝의 둥근 버튼 ‘제외’를 클릭하세요. 투어는 목록에 흐리게 남고 ‘제외됨’으로 표시돼요. 같은 버튼이 ‘다시 집계’로 바뀌어서, 누르면 다시 집계돼요.',
  'help.guide.move-to-list.tip.1': '레이블은 목록마다 따로라서, 옮기거나 복제한 장소는 새 목록에서 레이블이 없어요.',
  'help.guide.accept-list-invite.step.1':
    '목록 레일의 ‘초대’에서 초대를 찾으세요. 초대 알림을 눌러서 왔다면 카드가 페이지 맨 위에 있어요. 카드에 목록 이름과 보낸 사람이 나와요.',
  'help.guide.tour-collection-add-to-trip.tip.1':
    '새 투어는 아직 날짜가 없고 장소도 추가하지 않아요. 목록과 원래 투어는 바뀌지 않아요.',
  'help.guide.tour-collection-manage.step.3': '투어 줄 끝의 휴지통을 클릭하고 ‘컬렉션에서 제거’로 확인하세요.',
  'help.ctx.journey-detail.bullet.7':
    'Dawarich를 연결하면 날 헤더에 ‘기록 가져오기’(또는 그날 저장한 경로의 거리)와 ‘하루 가져오기’도 보여요. 대기 중인 방문 기록이 있는 날은 그날 끝에 한 줄로 모아서 보여 줘요.',
  'help.guide.entry-draft.tip.1': '기여자에게는 초안도 보여요. ‘초안’을 끌 때까지 공개 링크에서만 숨겨져요.',
  'help.guide.journey-map-layers.tip.2':
    '흐린 스위치는 아직 보여 줄 것이 없다는 뜻이고, 툴팁에 이유가 나와요. 선택은 이 브라우저에서 Journey마다 저장돼요.',
  'help.guide.journey-keep-route.tip.2':
    '나중에 날 헤더의 거리를 클릭하면 Dawarich와 다시 비교할 수 있어요: ‘바꾸기’는 새 버전을 적용하고, ‘경로 삭제’는 그날 경로를 Journey에서 지워요.',
  'help.guide.journey-day-stays.tip.2': '방문 기록이 많은 날은 줄 끝의 ‘하루 가져오기’로 한 번에 처리할 수 있어요.',
  'help.guide.journey-take-over-day.tip.1':
    '그 버튼을 누르기 전에는 아무것도 저장되지 않고, 같은 내용이 두 번 저장되지도 않아요. 이미 Journey에 있는 방문 기록은 표시되고 다시 고를 수 없어요.',
  'help.guide.journey-auto-prepare.tip.1':
    '날짜가 있는 연결된 여행의 날만 준비되고, Journey에 자동으로 추가되는 것은 없어요.',
  'help.guide.photo-location.result':
    '장소가 없는 항목은 GPS 정보가 있는 첫 사진의 촬영 위치를 받아서 지도에 나타나요.',
  'help.guide.contributors.tip.2':
    '‘여행을 통해’에는 연결된 여행을 통해 접근하는 사람들이 나와요. 이 사람들의 접근 권한은 여기가 아니라 그 여행 설정에서 바꾸세요.',
  'help.ctx.settings-plugins.bullet.2':
    '플러그인은 카드에 ‘작업’을 추가할 수 있고, 확인하면 실행돼요. 나 대신 다른 서비스에 로그인하는 플러그인에는 ‘연결’이나 ‘연결 해제’가 있어요.',
  'help.guide.web-push-device.tip.1':
    '푸시는 브라우저마다 따로 동작해요. 알림을 받을 휴대폰과 컴퓨터마다 따로 켜세요. ‘이 기기에서 끄기’는 그 기기에서만 꺼요.',
  'help.guide.connect-airtrail.step.2':
    '‘자체 서명 인증서 허용’은 내 네트워크에 있는 믿을 수 있는 인스턴스에만 쓰세요. ‘변경 사항을 AirTrail에 다시 기록’은 기본으로 꺼져 있어서 TREK는 읽기만 해요. 켜면 내가 편집한 내용을 AirTrail로 보내요.',
  'help.guide.connect-dawarich.step.2':
    '‘새 방문 기록을 자동으로 확인’을 켜면 TREK가 알아서 확인해요. 끄면 내가 요청할 때만 Dawarich를 읽어요. ‘자체 서명 인증서 허용’은 서버가 신뢰하지 않는 인스턴스에만 쓰세요.',
  'help.guide.tour-connect-wanderer.step.2': '‘자체 서명 인증서 허용’은 내 네트워크에 있는 인스턴스일 때만 켜세요.',
  'help.guide.tour-wanderer-watch.step.1':
    'wanderer 카드에서 ‘내 트레일 변경 확인’을 켜세요. 먼저 연결이 저장돼 있어야 해요.',
  'help.guide.plugin-settings.title': '나에게 맞게 플러그인 설정하기',
  'help.guide.default-user-settings.tip.2':
    '‘표시 통화’는 금액을 표시용으로만 환산해요. ‘비용’에 입력한 금액은 그대로예요.',
  'help.guide.own-routing-engine.step.2':
    '유료 도로, 고속도로, 페리를 피하는 경로가 필요하면 ‘자체 Valhalla 인스턴스’에 Valhalla 주소를 입력하세요. 각 칸은 다른 곳을 누르면 저장돼요. 그다음 TREK 서버를 다시 시작하고 페이지를 새로 고치세요.',
  'help.guide.admin-passkeys.tip.3':
    '사용자가 패스키가 든 기기를 잃어버렸다면 ‘사용자 편집’의 ‘패스키 초기화’로 패스키를 삭제하세요.',
  'help.guide.rotate-jwt-secret.result': '새 서명 시크릿이 적용되고, 나를 포함한 모든 사용자가 다시 로그인해야 해요.',
  'help.guide.read-notifications.title': '알림 읽기',
  'help.guide.filter-notifications.title': '모든 알림이나 읽지 않은 알림만 보기',
  'help.guide.mark-notifications-read.goal': '새 소식을 확인한 뒤 강조 표시와 벨의 숫자를 없애요.',
  'help.guide.delete-notifications.step.1': '알림 시간 옆의 휴지통 ‘삭제’를 클릭하면 그 알림만 삭제돼요.',
  'help.guide.notification-settings.step.2': '메뉴에서 ‘설정’을 클릭하세요.',
  'help.guide.public-link.tip.3': '옵션에 마우스를 올리면 무엇을 숨기는지 볼 수 있어요.',
  'help.guide.link-journal.step.4':
    '노란 안내를 읽으세요. 처음으로 Journey에 접근하게 되는 사람이 나와요. 그다음 ‘저널 연결’을 클릭하세요.',
  'help.guide.dawarich-stays.step.1':
    '‘설정’, ‘통합’에서 Dawarich를 연결하면 장소 목록 위에 ‘Dawarich에서’가 보여요. 헤더에 TREK가 마지막으로 확인한 시각과 대기 중인 방문 기록 수가 나와요. 클릭하면 목록이 열려요.',
  'help.guide.leave-stop-off-route.step.2':
    '이름 옆에 ‘경로 외’ 배지가 생겨요. 들를 곳은 그날 일정과 지도에 남지만, 그날 경로와 구간 시간에서는 빠져요.',
  'help.guide.move-booking-day.result': '예약이 계획에서 새 날에 속하고, 시간은 그대로예요.',
  'help.guide.clear-day.tip.2': '이 메뉴 항목은 장소가 있는 날에만 보여요.',
  'help.guide.place-image-from-file.step.1':
    '‘파일’에 사진이 있는 장소를 여세요. 카드 아래쪽 ‘파일’ 블록에 파일 수가 보여요.',
  'help.guide.place-own-hours.title': '장소의 영업시간, 전화번호, 이메일 고치기',
  'help.guide.place-own-hours.tip.1':
    '직접 입력한 시간이 TREK가 찾은 시간 대신 쓰여서, 계절마다 시간이 다른 카페도 내가 아는 시간으로 보여요.',
  'help.guide.day-panel.tip.3':
    '달력 기준으로 계획하나요? ‘설정’의 ‘화면’에서 ‘날 제목에 날짜를 먼저 표시’를 켜면 헤더에 날짜가 먼저 나오고, 그 아래에 ‘Day 1’이나 날 이름이 보여요.',
  'help.guide.confirm-stay-booking.result': '호텔 예약이 확정되고, 숙박 카드와 ‘예약’ 탭 양쪽에 반영돼요.',
  'help.guide.tour-map-lines.goal':
    '지도에서 여행의 투어를 구분하고, 선을 눌러 투어를 열고, 지금 필요 없는 투어는 숨겨요.',
  'help.guide.tour-map-lines.tip.3':
    '일정의 투어 줄 메뉴에 있는 ‘경로에서 제외’를 고르면 그날 경로가 투어의 시작점과 끝점으로 가지 않아요. ‘경로에 다시 추가’로 다시 이어요.',
  'help.guide.car-stops.step.5':
    '경유지 순서가 곧 경로예요. 경유지 왼쪽의 ‘위로 이동’, ‘아래로 이동’으로 순서를 바꾸고, 오른쪽 X ‘경유지 삭제’로 빼요.',
  'help.guide.transport-details.step.3':
    '아래 타일에 출발과 도착이 역이나 공항과 함께 나오고, 정해져 있으면 승강장과 좌석도 보여요. 중간에 서는 이동은 ‘경로’ 아래에 경유지가, 구간별로 예약한 이동은 ‘구간별 코드’ 아래에 구간마다 코드가 나와요. 이어서 ‘동행자’, ‘메모’, ‘비용’, ‘파일’이 있고, ‘파일에서 보기’를 누르면 ‘파일’ 탭에서 티켓이 열려요.',
  'help.guide.export-transports-csv.title': '교통을 스프레드시트로 내보내기',
  'help.guide.group-sort-bookings.step.4':
    '구역 제목을 클릭하면 접혀요. 옆의 숫자는 그 안의 예약 수이고, 다시 클릭하면 펼쳐져요.',
  'help.guide.booking-on-map.goal': '예약에서 계획과 지도의 해당 위치로 바로 이동해요.',
  'help.guide.export-bookings-csv.tip.2': '열은 세미콜론으로 구분되고, Excel에서 열어도 악센트 문자가 깨지지 않아요.',
  'help.guide.arrange-packing-list.tip.2':
    'TREK는 이 브라우저에서 ‘가나다순’ 설정을 기억해서, 다음에도 정렬된 상태로 열려요. 내 화면만 바뀌고, 다른 사람이 보는 순서는 바뀌지 않아요.',
  'help.guide.count-packed-pieces.step.4': '카운터가 수량에 도달하면 항목이 자동으로 체크되고 챙긴 것으로 집계돼요.',
  'help.guide.expense-receipts.result':
    '영수증이 지출과 함께 저장돼요. 그 줄의 칩으로 열 수 있고, 파일은 여행의 ‘파일’에도 있어요.',
  'help.guide.files-sync-settings.step.4':
    '‘문서가 삭제될 때’에서 반대쪽 사본을 어떻게 할지 고르세요. ‘양쪽 사본 유지’는 저장소의 사본을 그대로 둬요. ‘휴지통으로 이동’은 TREK에서 문서를 삭제하면 저장소의 휴지통으로 보내요.',
  'help.ctx.trip-collab.bullet.7':
    '여기 있는 기능은 모두 인터넷 연결이 필요해요. 오프라인에서는 메시지, 메모, 링크, 투표, 투표 참여가 저장되지 않고, TREK가 ‘연결이 필요합니다. TREK가 다시 온라인이 되면 다시 시도하세요.’라고 알려 줘요. 협업을 편집할 수 없는 멤버도 모두 읽을 수는 있지만 ‘새 메모’, ‘링크 추가’, ‘새 투표’가 없고 메시지 입력창은 회색으로 비활성화돼요.',
  'help.guide.manage-notes.step.4':
    '‘편집’을 누르면 내용이 모두 채워진 메모 창이 열려요. 필요한 부분을 바꾸고(여기서는 ‘내용’ 아래에 한 줄 추가) ‘저장’을 클릭하세요.',
  'help.guide.note-categories.step.2':
    '아래쪽 ‘새 카테고리...’에 이름을 입력하고 Enter를 누르거나 옆의 +를 클릭하세요. 새 카테고리에는 다음 색이 지정되고 줄이 하나 생겨요.',
  'help.guide.note-categories.tip.3':
    '카드에서는 헤더의 색 점으로만 카테고리를 표시해요. 점에 마우스를 올리면 이름이 보여요.',
  'help.guide.roadtrip-reorder.step.1':
    '들를 곳을 줄째로 끌어서 같은 날 다른 들를 곳 위에 놓으세요. 그 자리로 들어가고, 새 순서로 그날 경로를 다시 계산해요.',
  'help.guide.roadtrip-overnight.step.5':
    '‘추가’를 클릭하세요. 이날부터 다음 날까지 숙박이 잡히고, 그 장소가 그날 밤 숙소로 주행에 추가돼요.',
  'help.guide.roadtrip-stop-fill.step.3':
    '그곳을 다시 내 기본 설정으로 되돌리려면 배지를 다시 열고 ‘내 기본값 사용’을 클릭하세요.',
  'help.guide.roadtrip-bookings.step.3':
    '‘체크인’이나 ‘탑승’ 버튼은 언제까지 터미널에 도착해야 하는지 알려 줘요. 그만큼 시간표보다 일찍 출발하도록 잡혀요.',
  'help.guide.roadtrip-google-import.title': 'Google Maps에서 경로 가져오기',
  'help.guide.roadtrip-google-import.tip.2':
    '링크에는 TREK가 위치를 찾을 수 있는 정차 지점이 최소 2개, 최대 30개 있어야 해요.',
  'help.guide.roadtrip-hazards.tip.1':
    '경고는 도로 통제가 아니에요. 경고 때문에 경로가 바뀌지 않고, 내 여행 날짜의 예보가 아니라 현재 공지예요.',
  'help.ctx.trip-tours.bullet.4':
    '줄에 마우스를 올리면 눈 아이콘(‘지도에서 숨기기’)과 둥근 +(‘날에 추가’)가 보여요. 줄을 왼쪽 열의 날로 끌어다 놓으면 그날에 들어가고, 클릭하면 지도 위에 투어 카드가 열려요.',
  'help.guide.tour-show-list.step.4':
    '카드에 투어의 측정값과 ‘여행 날짜’ 아래 투어가 들어간 날이 보여요. 경로 자체를 바꾸려면 ‘투어’ 탭을 열고 ‘이 여행의 투어’에서 투어를 클릭하세요.',
  'help.guide.tour-add-to-day.step.1': '목록에서 투어에 마우스를 올리고 줄 오른쪽의 둥근 +(‘날에 추가’)를 클릭하세요.',
  'help.guide.tour-add-to-day.tip.4':
    '날을 열어 두면(헤더 클릭) 투어 카드에서도 그날로 ‘날에 추가’를 할 수 있어요. 날 목록 위의 실행 취소 화살표로 배정을 되돌려요.',
  'help.guide.tour-day-times.tip.1': '직접 입력한 종료 시간이 계산된 시간 대신 쓰여요.',
  'help.guide.tour-remove-from-day.step.2':
    '투어는 오른쪽 목록에 남아요. 날 배지가 사라지고, 필터에서 다시 ‘미계획’으로 집계돼요.',
  'help.guide.tour-filter-list.step.2':
    '‘상태’에서 아직 날짜가 없는 투어는 ‘미계획’을, 이미 날에 들어간 투어는 ‘예정’을 고르세요. 줄마다 해당하는 투어 수가 보여요.',
  'help.guide.tour-hide-on-map.goal': '지금 필요 없는 투어를 지도에서 숨겨요. 다른 사람에게는 아무것도 바뀌지 않아요.',
  'help.guide.tour-import-plan-tab.goal': '날을 계획하면서 GPX나 KML 트랙을 투어로 가져와요.',
  'help.ctx.trip-tour-detail.summary':
    '‘계획’ 탭에서 투어를 고르면 지도 위에 열리는 카드예요: 들어간 날, 측정값과 프로필, 출처, 그리고 휴대폰으로 보내기, 복사, 컬렉션에 저장, 짐 목록에 연결하는 버튼이 있어요.',
  'help.guide.tour-detail-read.step.1':
    '오른쪽 열 맨 위에서 ‘장소’를 ‘투어’로 바꾸고 투어를 클릭하세요. 지도 위에 카드가 열려요. 날 안의 투어 줄이나 지도의 선을 눌러도 같은 카드가 열려요.',
  'help.guide.tour-detail-read.tip.2':
    '패들 투어에는 고도와 프로필이 없어요. 지점이 강가에 있어서 고도가 정확하지 않기 때문이에요.',
  'help.guide.tour-rename-colour.step.2':
    '새 이름을 입력하고 둥근 체크 버튼을 클릭하거나 Enter를 누르세요. Esc를 누르면 이전 이름이 유지돼요.',
  'help.guide.tour-take-along.step.1':
    '투어 카드를 여세요. 카드 아래쪽 ‘내비게이션’은 지도 앱에서 투어 출발점을 열고, 앱이 여러 개면 먼저 목록을 보여 줘요. 경로를 따라가는 게 아니라 출발점까지 안내해요.',
  'help.guide.tour-copy-keep.title': '투어 복사하거나 컬렉션에 저장하기',
  'help.guide.tour-copy-keep.tip.3':
    '‘투어’ 탭에서는 왼쪽 열 맨 위의 북마크가 열린 투어에 같은 기능을 해요. 저장하지 않은 변경이 있으면 먼저 저장하라고 안내해요.',
  'help.guide.tour-packing-link.step.4':
    '이제 카드에 목록, 챙긴 항목 수, 막대, 처음 몇 개 항목이 보여요. 챙긴 항목에는 취소선이 그어져요.',
  'help.guide.tour-files.step.1':
    '투어 카드를 열고 맨 끝 ‘파일’까지 스크롤하세요. 섹션 헤더의 ‘업로드’를 클릭하고 파일을 하나 이상 고르세요.',
  'help.guide.tour-activity-link.step.1':
    '계획한 투어의 카드를 열고 ‘실제 트랙’까지 스크롤하세요. ‘실제 트랙 추가’를 클릭하세요.',
  'help.guide.tour-activity-link.result': '트랙이 투어에 연결되고, 카드에 계획과 실제 기록이 나란히 보여요.',
  'help.guide.tour-activity-compare.tip.2': 'Atlas의 투어 기록은 계획 값 대신 연결된 트랙으로 집계해요.',
  'help.guide.tour-origin-check.tip.2':
    'wanderer에서 온 투어는 출처 옆에 화살표 ‘wanderer에서 열기’가 있고, 섹션 헤더에 ‘소스 확인’이 있어요. 확인을 누르면 가져온 뒤 트레일이 바뀌었는지 wanderer에 물어봐요. 그다음 ‘새 스냅샷으로 가져오기’로 새 버전을 별도 투어로 가져와요. 이 투어의 날짜와 메모는 그대로 남아요.',
  'help.ctx.trip-tour-planner.bullet.4':
    '‘지점 추가’가 켜져 있으면(지도 버튼의 ‘지점 찍기’) 지도를 클릭할 때 지점이 놓여요. 핀을 끌어 옮기고, 그려진 경로를 클릭하면 거기에 형태 지점이 추가되며, ‘여행 장소’로 여행 장소를 골라요.',
  'help.guide.tour-open-workspace.step.4':
    '오른쪽 레일 맨 위의 + ‘투어 추가’에는 ‘GPX 또는 KML 가져오기’, ‘Google Maps에서 산책 가져오기’, ‘다른 여행에서 투어 가져오기’가 있어요. 투어를 열어 둔 동안에는 ‘새 투어 계획’도 있어요.',
  'help.guide.tour-draw-route.title': '새 투어 그리기',
  'help.guide.tour-draw-route.tip.1':
    '‘지점 찍기’가 켜져 있으면 포인터가 십자선이 돼요. 지점을 추가하지 않고 지도를 끌어 움직이려면 끄세요. 3D에서는 지도를 끌어 둘러보기 때문에 꺼진 상태로 시작해요.',
  'help.guide.tour-type-profile.step.2':
    '목록에서 유형을 고르세요: ‘하이킹’, ‘도심 산책 / 관광’, ‘달리기’, ‘자전거 투어’, ‘패들 투어’, ‘승마 투어’, ‘스키와 겨울’. 유형마다 무엇을 계획하는지 설명이 있고, 유형을 바꾸면 경로를 다시 계획해요.',
  'help.guide.tour-edit-points.step.1':
    '지도에서 번호 핀을 원하는 위치로 끌어다 놓으세요. 새 위치를 지나도록 경로를 다시 계획해요.',
  'help.guide.tour-edit-points.result': '지점이 원하는 위치와 순서에 놓이고, 경로도 다시 계획됐어요.',
  'help.guide.tour-shaping-points.tip.2': '형태 지점은 여러 날 투어의 구간 끝이 될 수 없어요.',
  'help.guide.tour-loop-reverse.tip.1':
    '투어가 순환 코스가 되면 ‘출발점으로 돌아가기’에 ‘투어가 이미 출발점으로 돌아갑니다’라고 나와요.',
  'help.guide.tour-leg-by-hand.step.3':
    '다시 라우터가 계획하게 하려면 같은 메뉴를 열고 ‘다음 구간을 다시 경로 계산’을 고르세요.',
  'help.guide.tour-trip-places.step.2':
    '여행 장소를 검색하거나 ‘투어 근처’를 보세요. 경로에서 2km 이내 장소가 가까운 순으로 거리와 함께 나와요.',
  'help.guide.tour-details-times.goal': '투어에 이름, 설명, 링크를 붙이고 시간에 휴식을 더해요.',
  'help.guide.tour-details-times.result': '이제 투어에 이름, 메모, 계획한 시간이 있어요.',
  'help.guide.tour-save.tip.2':
    '레일 위쪽 ‘투어 목록으로’를 누르면 편집기가 닫히고, 저장하지 않은 변경이 있으면 먼저 물어봐요.',
  'help.guide.tour-edit-saved.step.4':
    '‘투어 목록으로’를 클릭해 닫으세요. 저장하지 않은 변경이 있으면 먼저 ‘저장하지 않은 투어 변경 사항을 버릴까요?’라고 물어봐요.',
  'help.guide.tour-summary-profile.step.2': '예상 시간 옆 정보 점을 누르면 계산 방법이 나와요.',
  'help.guide.tour-list-manage.goal': '여행 투어의 합계를 보고, 투어를 날에 넣고, 필요한 투어만 남게 목록을 좁혀요.',
  'help.guide.tour-list-manage.tip.3':
    '줄의 휴지통을 누르면 투어가 삭제돼요. ‘계획’ 탭도 오른쪽 열을 ‘투어’로 바꾸면 같은 투어 목록을 보여 줘요.',
  'help.guide.tour-delete.tip.3':
    '투어는 여기 ‘투어’ 탭에서 삭제해요. 휴지통은 여행 장소를 편집할 수 있는 여행자에게만 보여요.',
  'help.guide.tour-saved-elsewhere.tip.1':
    '‘새 투어로 저장’은 내 사본 이름을 투어 이름 뒤에 (my version)을 붙여 지어요.',
  'help.ctx.trip-tour-import.bullet.4':
    '‘편집 가능한 버전’은 가져온 투어를 옮길 수 있는 웨이포인트가 있는 투어로 바꿔요. ‘가져온 항목 바꾸기’를 써도 기록된 트랙은 남고, 편집기의 ‘기록된 트랙’ 카드로 다시 돌아갈 수 있어요.',
  'help.guide.tour-import-gpx.step.5': '‘투어 1개 가져오기’를 클릭하세요(트랙이 세 개인 파일이면 ‘투어 3개 가져오기’).',
  'help.guide.tour-view-import.goal': '가져온 투어의 코스, 측정값, 고도를 가져온 그대로 확인해요.',
  'help.guide.tour-plan-from-import.title': '가져온 투어로 편집 가능한 투어 계획하기',
  'help.guide.tour-plan-from-import.tip.3':
    '패들이나 스키 투어를 가져오면 경로를 계산하지 않고 지점 사이를 직선으로 이어요.',
  'help.guide.tour-restore-recorded.tip.1': '이 카드는 ‘가져온 항목 바꾸기’로 바꾼 뒤 저장한 투어에만 보여요.',
  'help.guide.tour-take-over.step.4': '투어를 클릭하세요. 오른쪽에 선, 측정값, 원래 여행이 보여요.',
  'help.guide.tour-import-wanderer.goal': '내 wanderer의 트레일 하나를 여행에 투어로 가져와요.',
  'help.guide.tour-import-wanderer.tip.4': '‘wanderer에서 열기’는 내 인스턴스에서 트레일을 열어요.',
  'help.ctx.trip-tour-map.bullet.5':
    '3D에서는 경로가 지형 위에 경사도별 색으로 표시되고, 경사 등급을 요약한 범례와 처음부터 끝까지 따라가는 비행이 있어요.',
  'help.guide.tour-map-layers.tip.2':
    '‘하이킹’과 ‘자전거’ 지도는 자원봉사자 서버에서 오고, 관리자가 허용할 때만 쓸 수 있어요. 서버가 응답하지 않으면 그 항목에 !가 표시되고 다른 지도로 바꿀 수 있어요. 투어는 그대로예요.',
  'help.guide.tour-along-search.step.5':
    '찾은 장소가 경로에서의 거리와 함께 나열되고, 지도에 각자의 색으로 표시돼요. 별은 가장 잘 알려진 곳을, ‘투어에 있음’은 이미 정차 지점인 곳을 나타내요. 버튼은 이제 ‘다시 검색’이에요.',
  'help.guide.tour-along-add-stop.step.2':
    '‘추가할 위치’에 그 장소가 가장 잘 맞는 구간이 제안돼요. 클릭하면 어느 두 정차 지점 사이에 넣을지, 또는 ‘새 도착지로’를 고를 수 있어요. 바뀌기 전에 지도에 새 경로가 점선으로 보여요.',
  'help.guide.tour-3d-terrain.goal': '실제 지형 위에서 경사도별 색으로 투어를 봐요.',
  'help.guide.tour-3d-terrain.tip.2':
    '고른 지도는 3D에서도 쓰이고, 비아 페라타, 슬로프, 해상 표지도 함께 보여요. 투어를 편집하는 중이라면 지형 위에서 지점을 끌 수 있고, ‘지점 찍기’가 켜져 있으면 클릭으로 지점을 추가해요.',
  'help.guide.tour-3d-flyover.result': '고른 속도로 처음부터 끝까지 투어를 하늘에서 봤어요.',
  'help.guide.tour-map-overlays.step.3':
    '범례에서 색의 뜻을 알려 줘요: ‘입문’부터 ‘프리라이드’까지의 활강 슬로프, ‘크로스컨트리 코스’, ‘겨울 및 설피 산책로’, ‘썰매 코스’, ‘리프트와 케이블카’. ‘OpenSnowMap의 전체 범례’로 모든 기호를 볼 수 있어요. Esc를 누르면 닫혀요.',
  'help.ctx.trip-tour-stages.bullet.1':
    '편집기의 ‘일’에서 열린 투어를 ‘당일’ 또는 ‘여러 날’로 정해요. 다시 당일 투어로 바꾸면 확인 후 모든 구간 끝이 삭제되고, 경로는 그대로예요.',
  'help.guide.tour-multi-day.step.2': '‘일’에서 ‘여러 날’을 클릭하세요. 첫 구간 끝이 어디에 놓였는지 안내가 나와요.',
  'help.guide.tour-multi-day.tip.4':
    '구간은 ‘저장’을 클릭할 때 저장돼요. 변경 때문에 여행의 날에 들어간 구간이 사라지면, 저장하면 그날에서도 빠진다고 알려 줘요.',
  'help.guide.tour-stages-on-days.step.5':
    '구간마다 들어간 날이 보여요. 날을 클릭해 구간을 다른 날로 옮기거나, ‘날짜 없음’을 골라 날에서 빼세요.',
  'help.ctx.trip-tour-hike.summary':
    '‘투어’ 탭에서 연 하이킹이나 달리기예요: 왼쪽에 편집기, 가운데에 지도, 오른쪽에 투어 요약과 여행의 다른 투어가 있어요. 하이킹은 허용한 탐방로 난이도를 넘지 않고, 달리기는 내 페이스로 시간을 계산하며, 둘 다 OpenStreetMap에 기록된 길 정보를 보여 줘요.',
  'help.guide.tour-hike-plan.goal':
    '하이킹을 시작하고, 정차 지점을 정하고, 경로가 쓸 수 있는 가장 어려운 탐방로 등급을 고른 뒤 저장해요.',
  'help.guide.tour-hike-plan.tip.1':
    '새 하이킹은 T2(‘산악 하이킹’)로 시작해요. T3를 고르면 노출된 길일 수 있어 안정된 발걸음과 고소공포가 없어야 한다는 경고가 붙어요.',
  'help.guide.tour-hike-trail-details.step.3':
    '배지가 요약해 줘요: 경로 중 얼마나 ‘알려짐’인지, ‘알려진 최고’ 등급, 그리고 따로 하이킹을 계획할 때 쓴 ‘경로 한도’.',
  'help.guide.tour-hike-round.goal':
    '하이킹의 정차 지점 하나에서 출발하는 원하는 길이의 순환 코스를 TREK가 제안하게 해요.',
  'help.guide.tour-hike-round.tip.2': '1~60km 거리를 입력할 수 있고, 입력한 거리의 ±20% 이내 순환 코스를 제안해요.',
  'help.guide.tour-hike-compare-ways.result':
    '그 구간만 고른 길을 따르고 나머지 하이킹은 그대로예요. 지도 아래쪽 ‘길을 적용했습니다’에 ‘실행 취소’가 있어요.',
  'help.guide.tour-ferrata-add.step.3':
    '‘투어에 추가’를 클릭하세요. 비아 페라타가 경로 끝에 별도 구간으로 추가되고, 양 끝에 지점이 생겨요.',
  'help.guide.tour-run-plan.title': '내 페이스로 달리기 계획하기',
  'help.guide.tour-run-plan.tip.1': '페이스를 정하지 않으면 달리기를 저장할 수 없어요.',
  'help.guide.tour-run-ways.step.3': '‘노면’을 클릭한 다음 목록에서 노면 하나를 클릭하면 지도에 그 구간만 표시돼요.',
  'help.ctx.trip-tour-walk.bullet.3':
    '산책을 시작 시간이 있는 날에 넣으면 ‘웨이포인트’ 위쪽 ‘시간 기준’에 그날이 표시되고, 정차 지점마다 도착 시간, 머무는 시간, 영업시간 정보가 보여요.',
  'help.guide.tour-walk-plan.step.4':
    '정차 지점에 ‘레이블’과 ‘머무는 시간(분)’을 입력하세요. 아직 모르면 머무는 시간은 비워 두고, 지나가기만 하는 지점은 0을 입력하세요.',
  'help.guide.tour-walk-sights.goal': '테마를 골라 산책 경로 주변을 검색하고, 장소를 정차 지점으로 추가해요.',
  'help.guide.tour-walk-sights.tip.3':
    '영업시간과 웹사이트는 출처(주로 OpenStreetMap)에서 가져와요. 가기 전에 확인하세요.',
  'help.guide.tour-walk-day-times.tip.1':
    '시작 시간이 없으면 ‘도착 시간과 영업시간을 보려면 이날 산책 시간을 정하세요’라고 나와요.',
  'help.guide.tour-walk-google-import.step.2': '‘도보 경로 링크’에 링크를 붙여 넣고 ‘링크 읽기’를 클릭하세요.',
  'help.guide.tour-walk-check-off.goal':
    '당일에 정차 지점을 방문함이나 건너뜀으로 표시하고, 얼마나 더 걸어야 하는지 확인해요.',
  'help.guide.tour-walk-check-off.result':
    '방문한 정차 지점은 체크되고, 건너뛴 곳에는 취소선이 그어지며, 남은 시간은 아직 남은 곳만 계산해요.',
  'help.guide.tour-bike-profile.goal':
    '자전거 투어를 시작하고 TREK가 투어링, 로드, 그래블, MTB에 맞게 경로를 계산하게 해요.',
  'help.guide.tour-bike-profile.tip.1': '나중에 프로필을 바꾸면 경로 전체를 새 프로필로 다시 계획해요.',
  'help.guide.tour-bike-surfaces.step.2': '카드 헤더의 배지에 비포장으로 확인된 구간의 비율이 나와요.',
  'help.guide.tour-bike-mtb-grades.title': '산악자전거 투어의 트레일 등급 확인하기',
  'help.guide.tour-bike-mtb-grades.tip.3': '등급을 읽어 오지 못하면 카드에 그렇게 나와요. ‘다시 시도’를 클릭하세요.',
  'help.ctx.trip-tour-ski.bullet.5':
    '‘스키와 겨울’ 투어를 열면 지도에 OpenSnowMap 슬로프가 보이고, 스위치 옆에 ‘슬로프 범례’가 있어요. 모두 지도 데이터일 뿐이에요. 슬로프나 리프트 운영 여부, 눈 상태, 눈사태 정보는 여기에 없어요.',
  'help.guide.tour-ski-plan.step.6': '‘투어 이름’에 이름을 입력하고 ‘저장’을 클릭하세요.',
  'help.guide.tour-ski-options.step.1':
    '‘스키와 겨울’ 투어에서 라우터 옵션은 ‘종목’ 아래에 있어요. 내 종목에 해당하는 옵션만 보여요. 예를 들어 ‘크로스컨트리’에는 ‘가장 어려운 슬로프’가 없어요.',
  'help.guide.tour-ski-options.result':
    '내 제한 안에서 투어가 다시 계획되고, ‘슬로프 경로’ 카드에 피한 어려운 슬로프가 나와요.',
  'help.guide.tour-ski-fix-leg.tip.3':
    '오프라인에서는 일단 구간을 직선으로 그려요. 여름 길에 관한 회색 줄은 오류가 아니라 안내예요.',
  'help.guide.tour-ski-summary.tip.1':
    '‘피한 슬로프’에는 ‘가장 어려운 슬로프’ 제한 때문에 라우터가 피한 더 어려운 슬로프가 나와요.',
  'help.guide.tour-ski-pistes-layer.step.2': '스위치 옆에 색 점 네 개가 있는 버튼 ‘슬로프 범례’를 클릭하세요.',
  'help.guide.tour-ski-import.step.1':
    '‘투어’ 탭에서 ‘투어 추가’(‘이 여행의 투어’ 위의 +)를 클릭하고 ‘GPX 또는 KML 가져오기’를 고른 뒤 파일을 선택하세요.',
  'help.guide.tour-ski-import.tip.3':
    'GPX, KML, KMZ 파일을 ‘투어’ 탭 아무 곳에나 끌어다 놓아도 같은 미리보기가 열려요.',
  'help.ctx.trip-tour-paddle.bullet.5':
    '‘바람’에는 투어를 계획한 날의 출발 지점 예보가 보여요. ‘체크리스트’에는 저장된 경로의 장애물과 각각 어떻게 하기로 했는지가 나와요.',
  'help.guide.tour-paddle-setup.step.5':
    '호수에서는 ‘호수 건너기’로 경로를 정해요: ‘곧장’은 가장 짧고, ‘물가 가까이’는 바람 부는 날을 위해 물가를 따라가요.',
  'help.guide.tour-paddle-water-route.title': '물길 구간 계획하기',
  'help.guide.tour-paddle-water-route.tip.2':
    '경로가 보를 돌아 보트를 옮기거나 갑문을 지나는 곳에는 TREK가 직접 지점을 두고 ‘감지됨’으로 표시해요. 그 지점을 옮기거나 바꾸면 내 지점이 돼요.',
  'help.guide.tour-paddle-portage.step.3':
    '지점 아래에 길이와 추가 시간(분)이 담긴 ‘육상 운반’ 카드가 나타나요. 클릭하면 열려요.',
  'help.guide.tour-paddle-lock.goal': '투어에 갑문을 넣고 대기와 통과 시간을 투어 시간에 포함해요.',
  'help.guide.tour-paddle-lock.result': '갑문이 소요 시간과 함께 투어에 들어가고, ‘시간 추정’에 더해져요.',
  'help.guide.tour-paddle-time.tip.1':
    'TREK는 물 위 4km/h, 운반 2km/h, 육상 운반마다 10분으로 시작해요. 조정할 시작 값일 뿐 측정값이 아니에요.',
  'help.guide.tour-paddle-wind.step.3':
    '막대는 하루의 시간대를 나타내고, 평균 바람 뒤에 돌풍이 보여요. 막대에 마우스를 올리면 그 시간의 수치와 방향이 나와요.',
  'help.guide.tour-paddle-checklist.goal':
    '저장된 경로의 보, 갑문, 통행 규칙에 대해 알려진 내용을 보고 각각 어떻게 할지 정해요.',
  'help.guide.tour-paddle-checklist.tip.3':
    '‘다시 확인’이 붙은 항목은 경로나 데이터가 바뀌기 전에 정한 거예요. 다시 정하거나 ‘결정 유지’ 또는 ‘결정 삭제’를 고르세요. 더 이상 해당하지 않는 결정은 ‘이전 결정’ 아래에 나와요.',
  'help.guide.tour-paddle-track-marks.step.3': '‘투어 1개 가져오기’를 클릭하세요.',
  'help.guide.tour-paddle-track-marks.result': '기록된 트랙에 육상 운반 구간과 갑문이 담기고, ‘시간 추정’에 계산돼요.',
  'help.guide.tour-horse-plan.title': '승마 경로를 따라 승마 계획하기',
  'help.guide.tour-horse-plan.step.7': '‘투어 이름’에 승마 이름을 입력하고 왼쪽 열 아래쪽 ‘저장’을 클릭하세요.',
  'help.guide.tour-horse-gap.goal': '승마 끝점에서 떨어진 곳에서 시작하는 구간으로 이어 가요.',
  'help.guide.tour-horse-gap.tip.3':
    '승마 끝점에서 25m 이내에서 시작하는 구간은 바로 이어지고, ‘투어와의 연결’에 ‘투어의 끝에 이어짐’이 보여요.',
  'help.guide.tour-horse-recorded.tip.1':
    '선은 파일에 기록된 그대로예요. 경로를 다시 계산하지 않고, 기록된 승마에는 편집 가능한 버전이 없어요.',
  'help.guide.dateless-trip.result':
    '카드에 ‘아이디어’와 ‘날짜 미설정’이 보이고, 여행에는 입력한 수만큼 빈 날이 생겨요.',
  'help.guide.trip-reminder.title': '여행 전에 리마인더 받기',
  'help.guide.upcoming-reservations.tip.1': '호텔 숙박은 체크인 한 번, 체크아웃 한 번, 이렇게 두 번 보여요.',
  'help.guide.half-company-holiday.result': '회사가 반나절 쉬는 날이 되고, 그날 기록한 휴가는 반일로만 계산돼요.',
  'help.guide.edit-holiday-calendar.title': '휴일 캘린더 바꾸거나 삭제하기',
  'help.guide.answer-fusion-request.result':
    '‘수락 및 퓨전’ 후에는 두 계획이 한 달력에 보이고, 사람마다 자기 색으로 표시돼요.',
  'help.guide.log-for-partner.result': '그날들이 상대방 색으로 보이고, 내가 아니라 상대방의 휴가 일수에서 차감돼요.',
  'help.guide.dissolve-fusion.tip.1': '그 창에서 ‘취소’를 누르면 계획은 그대로예요. 어느 쪽이든 내 항목은 남아요.',
  'help.guide.country-places.tip.1':
    '엉뚱한 국가에 들어간 장소는 대개 주소나 좌표가 잘못된 거예요. 여기서 그 여행을 열고 장소를 고치세요.',
  'help.guide.tour-activity-stats.title': '투어에서 한 활동 확인하기',
  'help.guide.tour-activity-stats.result':
    '창과 ‘투어’ 탭의 합계에서 제외한 투어가 빠져요. 그 투어의 경로, 날짜, 여행은 그대로예요.',
  'help.guide.move-to-list.tip.2':
    '이동은 목록에서 장소를 빼는 거라서 소유자나 관리자에게만 ‘목록으로 이동’이 보여요. ‘목록에 복제’는 열 수 있는 목록이라면 어디서든 돼요.',
  'help.guide.accept-list-invite.step.2': '참여하려면 ‘수락’을, 초대를 거절하려면 ‘거절’을 클릭하세요.',
  'help.guide.tour-collection-add-to-trip.tip.2':
    '선 없이 저장된 투어는 웨이포인트를 함께 넣어야 해요. 창에서 안내하고 그 옵션을 자동으로 선택해 줘요.',
  'help.guide.tour-collection-manage.tip.1':
    '목록에서 투어를 삭제해도, 그 투어로 이미 여행에 만든 투어는 바뀌지 않아요.',
  'help.guide.entry-draft.tip.2':
    'Dawarich에서 날을 가져오면 항목이 초안으로 만들어져요. 공유하기 전에 배지를 확인하세요.',
  'help.guide.journey-map-layers.result': '원하는 레이어만 지도에 보이고, 핀, 점, 선의 뜻은 범례에서 확인할 수 있어요.',
  'help.guide.journey-keep-route.result':
    '날 헤더에 거리가 보이고, Journey의 모든 사람에게 지도 ‘기록’ 레이어에 경로가 실선으로 보여요. 공유 링크에서는 ‘기록된 경로’가 켜져 있을 때만 보여요.',
  'help.guide.journey-day-stays.result':
    '정한 방문 기록은 줄에서 사라져요. 작성한 항목은 다른 항목처럼 그날에 나타나고, 평소처럼 사진과 글을 추가할 수 있어요.',
  'help.guide.journey-take-over-day.tip.2':
    '초안은 공유 링크에 보이지 않아요. 사진과 글을 추가한 다음 항목마다 ‘초안’을 끄세요.',
  'help.guide.journey-auto-prepare.tip.2':
    '날 목록 버튼에 점이 있으면 아직 확정되지 않은 날이에요. 툴팁에 이유가 나와요.',
  'help.ctx.settings-plugins.bullet.3':
    '맨 아래 ‘플러그인 활동’에는 플러그인이 나 대신 한 모든 작업이 최신순으로 나오고, ‘새로 고침’이 있어요.',
  'help.guide.language-region.tip.3':
    '‘주 시작 요일’은 모든 날짜 선택기의 첫 열을 정해요. Vacay에는 따로 설정이 있어요.',
  'help.guide.web-push-device.tip.2': 'iPhone과 iPad에서는 먼저 TREK를 홈 화면에 추가하고 거기서 여세요.',
  'help.guide.connect-airtrail.step.3':
    '‘저장’을 클릭한 다음 ‘연결 테스트’를 클릭하세요. 찾은 항공편 수가 나오고 배지가 ‘연결됨’으로 바뀌어요.',
  'help.guide.connect-dawarich.step.3':
    '‘저장’을 클릭한 다음 ‘연결 테스트’를 클릭하세요. 최근 30일의 방문 기록 수를 세어 줘요. 연결되면 ‘지금 확인’으로 바로 확인하고, 오른쪽 ‘연결 해제’로 연결을 끊어요.',
  'help.guide.tour-connect-wanderer.step.3':
    '‘저장’을 클릭한 다음 ‘연결 테스트’를 클릭하세요. 가져올 수 있는 트레일 수가 나오고 배지가 ‘연결됨’으로 바뀌어요.',
  'help.guide.tour-wanderer-watch.step.2':
    'TREK는 하루에 한 번까지 가져온 트레일마다 짧은 기록을 읽고, 줄에 마지막 확인 시각을 보여 줘요. 트레일이 바뀌었을 수 있으면 알림이 오고 ‘알림’에 개수가 더해져요. ‘알림’을 클릭하면 투어마다 ‘바뀌었을 수 있음’, ‘변경됨’, ‘확인 불가’로 보이고, 거기서 바로 열 수 있어요.',
  'help.guide.plugin-settings.goal': '플러그인에 내 키와 환경설정을 입력하고, 플러그인이 나 대신 한 작업을 확인해요.',
  'help.guide.own-routing-engine.result': '모든 여행의 경로를 내 서버에서 계산해요.',
  'help.guide.admin-passkeys.title': '패스키 로그인 제공하기',
  'help.guide.rotate-jwt-secret.tip.1': '나도 로그아웃되니까 바로 다시 로그인하세요.',
  'help.guide.notification-defaults.title': '사용자 알림 기본값 정하기',
  'help.ctx.notifications.title': '알림',
  'help.guide.read-notifications.goal': '자리를 비운 동안 여행에서 일어난 일을 확인하고 바로 열어요.',
  'help.guide.filter-notifications.goal': '모든 알림을 보거나, 아직 읽지 않은 알림만 확인해요.',
  'help.guide.mark-notifications-read.step.1':
    '알림 시간 옆의 이중 체크 ‘읽음으로 표시’를 클릭하면 그 알림만 읽음으로 표시돼요.',
  'help.guide.delete-notifications.step.2': '맨 위 ‘모두 삭제’는 확인 창을 거친 뒤 목록 전체를 한 번에 삭제해요.',
  'help.guide.notification-settings.step.3':
    '설정 사이드바에서 ‘알림’을 클릭하세요. 첫 카드에 이벤트마다 줄이 있고, ‘앱 내’ 열에서 벨에 무엇을 보여 줄지 정해요.',
  'help.guide.link-journal.result':
    '여행 탭 바에 Journey 탭이 생겨요. ‘읽기’나 ‘편집’ 권한을 준 모든 사람이 이 탭에서 Journey를 열 수 있고, 실시간으로 업데이트돼요.',
  'help.guide.create-place.tip.4':
    'Google Maps에서 복사한 링크도 검색에 쓸 수 있어요. 붙여 넣고 Enter를 누르면 TREK가 링크에서 장소를 읽어요. 양식에 위치가 생기면 검색 옆 십자선 ‘이 핀 근처의 장소’로 주변 장소를 볼 수 있어요.',
  'help.guide.dawarich-stays.step.2':
    '방문 기록이 날짜별로 묶여 도착 시각과 떠난 시각이 보여요. 게이지 아이콘은 Dawarich가 확실하지 않은 기록이에요. 방문 기록 옆의 핀 ‘장소로 추가’를 클릭하세요.',
  'help.guide.leave-stop-off-route.step.3': '다시 경로에 넣으려면 같은 메뉴를 열고 ‘경로에 다시 추가’를 고르세요.',
  'help.guide.move-booking-day.tip.1':
    '여러 날 예약의 중간 날에 흐리게 보이는 줄은 끌 수 없고, 경유 항공편의 구간 하나만 끌 수도 없어요.',
  'help.guide.place-image-from-file.step.2':
    '헤더의 둥근 사진을 클릭하세요. 장소에 사진이 있어서 작은 창이 사진을 어디서 가져올지 물어봐요.',
  'help.guide.place-own-hours.goal': '찾아온 영업시간이 틀리거나 없을 때, 직접 확인한 시간을 카드에 넣어요.',
  'help.guide.place-own-hours.tip.2':
    '전화번호와 이메일은 카드 헤더에 버튼으로 보여요. 클릭하면 전화나 메일 앱이 열려요.',
  'help.guide.edit-accommodation.tip.3':
    '‘설정’의 ‘화면’에서 ‘예약 코드 흐리게’를 켜 두면 예약 번호가 흐리게 보여요. 마우스를 올리거나 클릭하면 볼 수 있어요.',
  'help.guide.confirm-stay-booking.tip.1': '버튼을 다시 클릭하면 예약이 ‘대기 중’으로 돌아가요.',
  'help.guide.map-markers.tip.4':
    '‘설정’ > ‘화면’의 ‘여행 및 지도’에서 ‘계획되지 않은 장소를 작은 마커로 표시’를 켜면 아직 날에 없는 장소가 사진과 평점 없이 작은 점으로 보여요. 고른 장소는 항상 온전히 표시돼요.',
  'help.guide.tour-map-lines.step.1':
    '여행의 모든 투어가 지도에 각자의 색 선으로 그려지고, 시작 지점에 핀이 있어요. 투어에 색을 정했다면 그 색을, 아니면 카테고리 색을 써요.',
  'help.guide.car-stops.step.6': '‘추가’를 클릭하세요.',
  'help.guide.transport-details.step.4':
    '제목을 클릭하면 양식을 열지 않고 이름을 바꿀 수 있어요. ‘이름 바꾸기’가 현재 이름이 채워진 채 열려요. 새 이름을 입력하고 ‘저장’을 클릭하세요.',
  'help.guide.export-transports-csv.goal': '여행의 이동 목록을 스프레드시트, 여행사, 인쇄용으로 CSV 파일로 내보내요.',
  'help.guide.group-sort-bookings.result':
    '예약이 고른 구역과 순서로 보이고, 이 브라우저가 다음에도 그 설정을 기억해요.',
  'help.guide.booking-on-map.step.1':
    '장소가 연결된 예약의 카드를 클릭하세요. ‘장소 / 활동’에, 숙박이면 ‘숙박’에 연결된 장소예요. 상세 정보가 열려요.',
  'help.guide.export-bookings-csv.title': '예약을 스프레드시트로 내보내기',
  'help.guide.export-bookings-csv.tip.3':
    '탭에 예약이 하나라도 있으면 버튼이 보여요. ‘교통’ 탭도 같은 방식으로 자기 항목을 내보내요.',
  'help.guide.arrange-packing-list.title': '짐 목록을 내 순서대로 정리하기',
  'help.guide.count-packed-pieces.result': '줄에 몇 개를 챙겼는지 보이고, 마지막 하나까지 넣으면 항목이 체크돼요.',
  'help.guide.expense-receipts.title': '지출에 영수증 첨부하기',
  'help.guide.expense-receipts.tip.1':
    '편집기에서 목록의 파일 이름을 클릭해도 같은 미리보기가 열려요. 이때 Esc는 지출이 아니라 미리보기만 닫아요.',
  'help.guide.files-sync-settings.step.5':
    '‘양쪽이 모두 바뀌었을 때’는 두 곳에서 문서를 편집했을 때 어느 사본을 남길지 정해요: ‘물어보기’, ‘TREK 사본 유지’, ‘저장소 사본 유지’. ‘자동으로 동기화’를 켜면 TREK가 백그라운드에서 변경을 확인해요. 끄면 카드에 ‘일시 중지됨’이 보이고 ‘지금 동기화’로만 동기화해요. 여기서 바꾼 내용은 바로 저장돼요.',
  'help.guide.manage-notes.step.5':
    '‘삭제’는 먼저 ‘메모를 삭제할까요?’라고 물어요. 메모가 모든 멤버에게서 파일과 함께 삭제되기 때문이에요. ‘삭제’를 클릭해 확인하세요.',
  'help.guide.note-categories.step.3':
    '카테고리 이름을 클릭하면 이름을 바꿀 수 있어요. 새 이름을 입력하고 Enter를 누르세요. Esc를 누르면 이전 이름이 유지돼요.',
  'help.guide.roadtrip-reorder.step.2':
    '들를 곳을 다른 날로 옮기려면 그날 카드의 들를 곳 위에 놓으세요. 끄는 동안 들를 곳이 두 개 미만인 날은 레일 끝에 점선 카드로 나타나고, 거기에도 놓을 수 있어요.',
  'help.guide.roadtrip-corridor.tip.4':
    '필터 아래에서 그날 들를 곳 하나나 두 곳의 중간을 고르면 그 지점에서 25, 50, 100km 이내 결과만 남아요. 목록에 충전소가 있으면 ‘모든 플러그’와 ‘모든 출력’으로 소켓과 출력별로 걸러요.',
  'help.guide.roadtrip-overnight.result':
    '장소가 그날 밤 숙소로 주행에 들어가고, 숙박은 다른 숙박처럼 여행에 예약돼요.',
  'help.guide.roadtrip-stop-fill.result':
    '이곳에서 고른 만큼 연료나 배터리를 채워요. 그 뒤 주행 가능 거리와 ‘여기서 연료 소진’ 구간도 이 값을 기준으로 계산해요.',
  'help.guide.roadtrip-bookings.step.4': '카드를 클릭하면 예약이 열려요.',
  'help.guide.roadtrip-google-import.goal': 'Google Maps에서 짠 경로를 내 여행 중 하루의 들를 곳으로 가져와요.',
  'help.guide.roadtrip-google-import.tip.3': '가져오려면 인터넷 연결과 장소, 날을 모두 편집할 권한이 필요해요.',
  'help.guide.roadtrip-hazards.tip.2':
    'DWD는 독일을, GDACS는 전 세계 재난을 다뤄요. 지점으로만 주어진 경고에는 영향 지역을 알 수 없다고 표시돼요.',
  'help.ctx.trip-tours.bullet.5':
    '날 열에서 투어는 들를 곳처럼 한 줄이에요. ‘시작’이 있으면 시작 → 종료로 보이고, 종료는 투어 시간으로 계산돼요. ‘추가 옵션’에는 ‘편집’, ‘날에서 제거’, ‘경로에서 제외’, ‘컬렉션에 저장’이 있어요.',
  'help.guide.tour-show-list.step.5': '같은 전환 버튼에서 ‘장소’를 클릭하면 장소 목록으로 돌아와요.',
  'help.guide.tour-add-to-day.step.2':
    '날을 고르세요. 메뉴에 여행의 모든 날이 날짜, 제목과 함께 나오고, 이미 그 투어가 있는 날은 회색으로 보여요.',
  'help.guide.tour-add-to-day.result': '투어가 그날 아래에 나오고, 지도에서도 그날의 선으로 보여요.',
  'help.guide.tour-day-times.tip.2':
    '여러 날 투어의 한 구간만 있는 날에는 종료 시간을 계산하지 않아요. 투어 시간이 경로 전체 기준이기 때문이에요.',
  'help.guide.tour-remove-from-day.step.3':
    '또는 날 헤더를 클릭해 날을 열고, 목록에서 투어를 클릭한 뒤 카드 아래쪽 ‘날에서 제거’를 클릭하세요.',
  'help.guide.tour-filter-list.step.3':
    '목록에 여러 종류가 섞여 있으면 ‘출처’(TREK, ‘GPX 가져오기’, wanderer), ‘경로 한도’(T1~T6), ‘유형’(‘하이킹’, ‘자전거 투어’ 등)으로 더 좁힐 수 있어요. 체크한 값을 다시 클릭하면 해제돼요.',
  'help.guide.tour-hide-on-map.step.1':
    '목록에서 투어를 가리키고 줄 오른쪽에 나타나는 눈 아이콘(‘지도에서 숨기기’)을 클릭하세요.',
  'help.guide.tour-import-plan-tab.step.1': '‘계획’ 탭 오른쪽 열 맨 위 전환 버튼에서 ‘투어’를 클릭하세요.',
  'help.ctx.trip-tour-detail.bullet.1':
    '‘투어’ 목록(먼저 오른쪽 열을 ‘장소’에서 ‘투어’로 바꾸세요)의 투어, 날 안의 투어 줄, 지도의 선을 클릭하면 지도 위에 카드가 열려요. 카드가 열려 있어도 지도는 계속 쓸 수 있어요.',
  'help.guide.tour-detail-read.step.2':
    '헤더에 투어 이름과 요약 버튼이 보여요: 투어 종류, 가져온 투어라면 출처, 계획 소요 시간, 거리, 누적 상승 고도, 누적 하강 고도.',
  'help.guide.tour-detail-read.tip.3':
    '투어에 따라 더 보이는 것도 있어요: 도심 산책은 정류지, 패들 투어는 확인 항목과 바람, 이미 다녀온 투어는 ‘실제 트랙’, 목록과 연결한 투어는 ‘짐 목록’.',
  'help.guide.tour-rename-colour.step.3':
    '투어 둥근 타일 모서리의 색 점 ‘트랙 색상’을 클릭하세요. 헤더 아래에 ‘트랙 색상’ 섹션이 열려요.',
  'help.guide.tour-take-along.step.2':
    '투어에 웹 페이지가 있으면 옆 버튼에 사이트 이름(Komoot, AllTrails, Outdooractive, Wanderer)이, 그 밖의 사이트면 ‘웹사이트’가 보여요. 누르면 새 탭에서 페이지가 열려요.',
  'help.guide.tour-copy-keep.goal': '이 여행 안에서 투어를 변형해 만들거나, 다음 여행을 위해 내 컬렉션에 저장해요.',
  'help.guide.tour-copy-keep.tip.4':
    '‘컬렉션’은 컬렉션 애드온이 켜져 있을 때만 있어요. 읽기만 가능한 목록은 고를 수 없고, 목록이 아직 없으면 창에서 ‘컬렉션 열기’를 제안해요.',
  'help.guide.tour-packing-link.step.5': '‘짐 목록 열기’를 클릭해 체크하세요. TREK가 ‘목록’ 탭의 짐 목록으로 이동해요.',
  'help.guide.tour-files.step.2': '그 아래 줄에 파일 수가 보이고 목록이 펼쳐져요.',
  'help.guide.tour-activity-link.step.2':
    '‘진행일’에서 실제로 다녀온 날을 확인하세요. 어느 날에도 속하지 않으면 ‘날짜 없음’을 고르세요.',
  'help.guide.tour-activity-compare.title': '계획과 실제 기록 비교하기',
  'help.guide.tour-activity-compare.result': '카드와 지도에서 그날을 계획과 빠르게 비교할 수 있어요.',
  'help.guide.tour-origin-check.tip.3':
    '‘wanderer 연결 없음’은 계정이 아직 연결되지 않았다는 뜻이에요. ‘설정’의 ‘통합’에서 연결하세요.',
  'help.ctx.trip-tour-planner.bullet.5':
    '지도 위쪽 ‘장소 또는 주소 검색’으로 지도를 옮겨요. 왼쪽 아래 버튼으로 투어 유형이 지원하는 ‘지형도’, ‘위성 사진’ 같은 지도를 바꾸고, 열린 투어의 ‘지점 찍기’, 3D 같은 스위치도 거기 있어요.',
  'help.guide.tour-open-workspace.step.5':
    '지도 위쪽 ‘장소 또는 주소 검색’으로 지도를 원하는 곳으로 옮겨서 투어 지역에서 시작할 수 있어요.',
  'help.guide.tour-draw-route.goal': '지도에 새 투어의 지점을 찍고, TREK가 그 사이 경로를 계산하게 해요.',
  'help.guide.tour-draw-route.tip.2':
    '지도 버튼의 ‘지형도’나 ‘하이킹’을 쓰면 길이 보여서 클릭하기 쉬워요. 투어 유형이 쓸 수 있는 길에서 너무 먼 지점은 경로 대신 안내가 나와요.',
  'help.guide.tour-type-profile.step.3':
    '자전거 투어는 유형 아래에서 ‘프로필’을 물어봐요: ‘투어링’, ‘로드’, ‘그래블’, MTB. 그 아래 줄에 프로필이 선호하는 길이 나와요.',
  'help.guide.tour-edit-points.step.2': '‘웨이포인트’에서 줄을 클릭하면 그 지점이 선택되고, 지도에서 핀이 강조돼요.',
  'help.guide.tour-shaping-points.title': '형태 지점으로 경로 바꾸기',
  'help.guide.tour-shaping-points.tip.3':
    '승마는 라우터가 경로를 만들지 않아서 선을 클릭해도 아무것도 추가되지 않아요.',
  'help.guide.tour-loop-reverse.tip.2':
    '‘출발점으로 복귀’ 줄을 삭제하면 다시 편도 투어가 돼요. 손으로 그린 구간은 투어 방향을 뒤집어도 손으로 그린 그대로예요.',
  'help.guide.tour-leg-by-hand.step.4':
    '‘다음 구간 다시 계산’은 다른 구간은 그대로 두고 그 구간만 라우터에 다시 요청해요.',
  'help.guide.tour-trip-places.step.3':
    '장소를 클릭하세요. 투어의 새 끝점으로 추가되고, 다음 장소를 고를 수 있게 목록은 열린 채로 있어요.',
  'help.guide.tour-details-times.step.1':
    '왼쪽 레일 맨 위 ‘투어 이름’에 이름이 들어가요. 새 투어에서 ‘이름 없는 하이킹’ 같은 회색 글자는 예시일 뿐이니 직접 입력하세요.',
  'help.guide.tour-save.title': '투어 저장하기',
  'help.guide.tour-save.tip.3':
    '주소가 아닌 웹사이트처럼 칸에 잘못된 값이 있어도 ‘저장’이 안 돼요. ‘상세 정보’가 자동으로 열려 그 칸을 보여 줘요.',
  'help.guide.tour-edit-saved.tip.1': '바꾸지 않은 투어에서는 ‘저장’이 회색으로 비활성화돼 있어요.',
  'help.guide.tour-summary-profile.step.3':
    '‘고도 그래프’ 위로 포인터를 움직이세요. 그 지점의 거리와 고도가 보이고, 지도의 같은 위치에 점이 표시돼요.',
  'help.guide.tour-list-manage.step.1':
    '‘여행 합계’는 목록 위에 있어요. 접혀 있을 때는 투어 수와 그중 ‘예정’과 ‘미계획’ 수가 보여요. 오른쪽 화살표를 누르면 유형별 거리, 오르막, 내리막, 시간 합계가 줄마다 나와요.',
  'help.guide.tour-list-manage.result': '필터에 보이는 투어의 합계를 확인했고, 투어마다 원하는 날에 들어갔어요.',
  'help.guide.tour-delete.result': '투어가 목록, 지도, 모든 날에서 사라져요.',
  'help.guide.tour-saved-elsewhere.tip.2':
    '다른 기기에서 투어를 바꿨을 때도 마찬가지예요. 바꾸지 않은 투어는 그냥 다시 불러오고, 안내로 알려 줘요.',
  'help.ctx.trip-tour-import.bullet.5':
    '‘설정’, ‘통합’에서 wanderer를 연결하면, 열린 투어가 없을 때 ‘새 투어 계획’ 옆에 wanderer 버튼이 생겨요. 가져올 수 있는 내 트레일이 나와요.',
  'help.guide.tour-import-gpx.tip.1': '컴퓨터에서 파일을 ‘투어’ 탭으로 끌어다 놓아도 돼요. 같은 미리보기가 열려요.',
  'help.guide.tour-view-import.step.1':
    '‘투어’ 탭의 ‘이 여행의 투어’에서 ‘GPX 가져오기’ 배지가 붙은 투어를 클릭하세요.',
  'help.guide.tour-plan-from-import.goal':
    '기록된 트랙에서 옮길 수 있는 웨이포인트를 만들고, 새 경로가 트랙과 얼마나 가까운지 확인해요.',
  'help.guide.tour-plan-from-import.tip.4': '‘승마 투어’에는 편집 가능한 버전이 없어요. 실제로 달린 그대로 남아요.',
  'help.guide.tour-restore-recorded.tip.2':
    '‘새 투어로 계획’으로 만든 투어에는 자체 기록 트랙이 없어요. 원본으로 쓴 가져온 투어는 목록에 그대로 있어요.',
  'help.guide.tour-take-over.step.5': '원하면 ‘이 여행에서의 이름’에서 이름을 바꾸세요.',
  'help.guide.tour-import-wanderer.step.1':
    '‘투어’ 탭에서 열린 투어가 없는 상태로 ‘새 투어 계획’ 옆의 wanderer를 클릭하세요.',
  'help.guide.tour-import-wanderer.result': '트레일이 여행의 투어가 되고, 지도에 ‘wanderer 투어’로 열려요.',
  'help.guide.tour-map-layers.title': '투어에 맞는 지도 고르기',
  'help.guide.tour-map-layers.tip.3':
    '패들 투어와 도심 산책은 ‘지도’와 ‘위성 사진’만, 달리기, 스키 투어, 승마는 ‘지도’, ‘지형도’, ‘위성 사진’을 지원해요.',
  'help.guide.tour-along-search.result': '경로 주변 장소가 목록과 지도에 나타나서 살펴볼 수 있어요.',
  'help.guide.tour-along-add-stop.step.3':
    '‘경유지로 추가’를 클릭하세요. 옆의 배지는 직선 거리로 잰 대략적인 우회 거리예요.',
  'help.guide.tour-3d-terrain.step.1':
    '‘투어’ 탭에서 투어를 열고 왼쪽 아래 버튼 끝의 3D를 클릭하세요. 지도가 기울어지면서 지형이 3D로 보이고, 그 위에 경로가 그려져요.',
  'help.guide.tour-3d-terrain.tip.3':
    '지형을 보려면 인터넷 연결이 필요해요. 고도는 공개 Mapzen 지형 타일에서 가져와요. 물은 평평하니까 패들 투어는 경사 색 없이 자기 색으로 그려져요.',
  'help.guide.tour-3d-flyover.tip.1':
    '비행 중에 마우스 휠을 굴리면 확대하거나 축소할 수 있고, 카메라는 점을 따라가요. 일시 정지하기 전에는 지도를 끌 수 없어요.',
  'help.guide.tour-map-overlays.step.4':
    '패들 투어에서는 대신 ‘항로 표지’ 버튼이 있어요. 클릭하면 물 위에 부표, 등표, 항구 표지가 보여요.',
  'help.ctx.trip-tour-stages.bullet.2':
    '정차 지점의 ‘작업 더 보기’ 메뉴에서 ‘여기서 구간 종료’를 고르면 그곳에서 구간이 끝나요. 그러면 ‘웨이포인트’에 구간마다 ‘구간 N’ 제목과 거리, 시간이 보이고, 구간을 끝내는 정차 지점에는 달 아이콘이 붙어요.',
  'help.guide.tour-multi-day.step.3':
    '첫날이 끝나는 정차 지점을 가리키고 ‘작업 더 보기’를 클릭한 뒤 ‘여기서 구간 종료’를 고르세요.',
  'help.guide.tour-multi-day.result':
    '경로 하나가 구간별로 나뉘고, 구간마다 따로 측정돼요. ‘저장’을 클릭해 저장하세요.',
  'help.guide.tour-stages-on-days.step.6':
    '옆의 화살표 ‘이 구간을 플래너에서 열기’를 누르면 그 구간에서 편집기가 열려요.',
  'help.ctx.trip-tour-hike.bullet.1':
    '편집기 맨 위 ‘투어 유형’이 경로 계획 방식을 정해요. ‘하이킹’은 ‘상세 정보’의 ‘탐방로 최대 난이도’까지의 길을 쓰고, ‘달리기’는 달릴 수 있는 길을 쓰며 ‘계획 페이스’를 물어봐요.',
  'help.guide.tour-hike-plan.step.1': '왼쪽 열 맨 위의 ‘새 투어 계획’을 클릭하세요. 편집기가 ‘새 투어’로 열려요.',
  'help.guide.tour-hike-plan.tip.2':
    'T4 이상은 먼저 ‘고산 경로 계산을 활성화할까요?’라고 물어요. 노출되거나 표시가 없는 지형을 지나도 될 때만 확인하세요. 이 질문은 편집할 때마다 한 번 나와요.',
  'help.guide.tour-hike-trail-details.step.4':
    '목록에서 등급을 클릭하면 지도에 그 구간만 보여요. 다시 클릭하면 전체 경로가 보여요.',
  'help.guide.tour-hike-round.step.1':
    '하이킹을 연 상태에서 ‘웨이포인트’ 카드 헤더의 ‘출발점에서 순환 코스’를 클릭하세요. 다른 정차 지점에서 시작하려면 그 지점의 ‘작업 더 보기’에서 ‘여기서 순환 코스’를 고르세요.',
  'help.guide.tour-hike-round.tip.3':
    '‘다시 검색’은 거리 입력으로 돌아가고, ‘취소’는 아무것도 바꾸지 않고 카드를 닫아요.',
  'help.guide.tour-hike-compare-ways.tip.1':
    '하이킹에서만, 그리고 손으로 그린 구간이 아니라 라우터가 계획한 구간에서만 쓸 수 있어요.',
  'help.guide.tour-ferrata-add.step.4': '‘웨이포인트’에서 두 지점 사이 구간에 비아 페라타의 이름, 등급, 길이가 보여요.',
  'help.guide.tour-run-plan.goal': '달릴 수 있는 길로 달리기를 계획하고, 내 페이스로 시간을 계산해요.',
  'help.guide.tour-run-plan.tip.2':
    '오르막, 내리막, 길의 기술적 난이도는 시간에 반영되지 않아요. 거리 곱하기 페이스, 그게 전부예요.',
  'help.guide.tour-run-ways.result': '출발 전에 달리기 코스 중 아스팔트가 아닌 구간을 알 수 있어요.',
  'help.ctx.trip-tour-walk.bullet.4':
    '‘투어 경로 주변’은 경로에서 일정 거리 안에서 ‘산책 테마’별로 명소를 찾고, ‘경유지로 추가’로 원하는 위치에 넣어 산책 계획에 포함해요.',
  'help.guide.tour-walk-plan.step.5':
    '‘중요도’를 ‘보통’, ‘선택 사항’, ‘꼭 방문’ 중에서 정하세요. 나중에 변경이 제안돼도 자리를 지켜야 하는 정차 지점은 ‘보호됨’을 켜고 ‘저장’을 클릭하세요.',
  'help.guide.tour-walk-sights.step.1':
    '도심 산책을 연 상태에서 왼쪽 열의 ‘투어 경로 주변’을 찾아 ‘산책 테마’를 고르세요: ‘문화와 역사’, ‘공원과 전망’, ‘음식과 현지 생활’, ‘골고루’.',
  'help.guide.tour-walk-sights.result': '명소가 산책의 정차 지점이 되고, 고른 두 정차 지점 사이 경로에 들어가요.',
  'help.guide.tour-walk-day-times.tip.2':
    '머무는 시간이 아직 없는 정차 지점이 있으면, 그 뒤 도착 시간은 가장 이른 시간으로 보여요.',
  'help.guide.tour-walk-google-import.step.3':
    '‘링크 속 정류지’를 확인하세요. 링크에 위치가 없는 정차 지점은 표시되고 빠져요.',
  'help.guide.tour-walk-check-off.step.1': '‘계획’ 탭에서 그날의 도심 산책을 클릭하세요. 지도 옆에 카드가 열려요.',
  'help.ctx.trip-tour-bike.title': '자전거 투어',
  'help.guide.tour-bike-profile.step.1': '‘투어’ 탭에서 왼쪽 레일 맨 위의 ‘새 투어 계획’을 클릭하세요.',
  'help.guide.tour-bike-profile.tip.2':
    '프로필은 라우터의 길 선택만 도와요. 그 길을 실제로 탈 수 있는지는 알려 주지 않아요. 경로의 노면은 ‘노면과 길’ 카드에서 확인하세요.',
  'help.guide.tour-bike-surfaces.step.3':
    '‘노면’에서 ‘그래블’이나 ‘자연 노면’ 같은 줄을 클릭하세요. 해당 구간이 지도에서 강조돼요. 다시 클릭하면 강조가 사라져요.',
  'help.guide.tour-bike-mtb-grades.goal': 'MTB 투어의 트레일이 얼마나 어려운지 타기 전에 확인해요.',
  'help.guide.tour-bike-mtb-grades.tip.4':
    '‘프로필’을 MTB에서 다른 것으로 바꾸면 등급 섹션이 사라지고, 새 프로필로 경로를 다시 계획해요.',
  'help.guide.tour-ski-plan.title': '스키와 겨울 투어 계획하기',
  'help.guide.tour-ski-plan.tip.1':
    '‘크로스컨트리’라면 ‘주법’도 고르세요: ‘클래식’, ‘스케이팅’, ‘알 수 없음’. 칸 아래 안내에 아직 빠진 항목이 나와요.',
  'help.guide.tour-ski-options.step.2':
    '‘가장 어려운 슬로프’를 열고 탈 수 있는 가장 높은 등급을 ‘입문’부터 ‘최상급’ 중에서 고르세요. 기본값은 ‘중급’이에요.',
  'help.guide.tour-ski-fix-leg.title': '계획하지 못한 스키 구간 고치기',
  'help.guide.tour-ski-fix-leg.tip.4':
    '모든 구간을 계획하기 전까지 ‘슬로프 경로’ 카드에 아직 스키 시간이 없다고 나와요.',
  'help.guide.tour-ski-summary.tip.2':
    '모든 구간을 계획하기 전까지 ‘스키 시간’은 ‘계산 안 함’이에요. 그래도 시간을 넣고 싶다면 상세 정보에 계획 총시간을 입력하세요.',
  'help.guide.tour-ski-pistes-layer.step.3':
    '범례에 난이도별 활강 슬로프, 크로스컨트리 코스, 겨울 및 설피 산책로, 썰매 코스, 리프트가 나와요. ‘OpenSnowMap의 전체 범례’로 전체 범례를 열어요.',
  'help.guide.tour-ski-import.step.2': '‘가져오기 미리보기’에서 ‘가져올 유형’을 열고 ‘스키와 겨울’을 고르세요.',
  'help.guide.tour-ski-import.result': '트랙이 ‘이 여행의 투어’에 들어가고, ‘스키 트랙’ 카드에 종목과 주법이 보여요.',
  'help.ctx.trip-tour-paddle.bullet.6':
    '왼쪽 열 맨 아래 줄 ‘패들링에는 위험이 따릅니다’를 누르면 ‘수상 안전’이 열려요. 지도는 ‘지도’와 ‘위성 사진’, 그리고 겹쳐 보는 ‘항로 표지’를 지원해요.',
  'help.guide.tour-paddle-setup.step.6':
    '‘패들 속도’에는 배에 맞는 제안 값이 회색으로 보여요. 직접 입력하면 ‘내 속도’로 표시되고, 아래 링크 ‘제안값 사용’으로 배의 속도로 되돌려요.',
  'help.guide.tour-paddle-water-route.goal':
    'TREK가 강이나 호수를 따라 구간을 계획하게 하고, 계획하지 못한 구간의 안내를 이해해요.',
  'help.guide.tour-paddle-water-route.tip.3':
    '계획된 구간 아래 안내에는 급류와 그 등급, ‘카누 수로’, 직선으로 이은 ‘지도 데이터 공백’이 표시돼요.',
  'help.guide.tour-paddle-portage.step.4':
    '‘경로’에서 ‘길 따라가기’는 지도에 있는 길을 따라가고, ‘직선’은 곧장 가로질러요. TREK가 알아서 길을 찾고, 크게 돌아가지 않고는 길이 없으면 알려 줘요.',
  'help.guide.tour-paddle-lock.step.1': '갑문이 있는 정차 지점을 가리키고 점 세 개 ‘작업 더 보기’를 클릭하세요.',
  'help.guide.tour-paddle-time.title': '패들 투어 시간 확인하고 조정하기',
  'help.guide.tour-paddle-time.tip.2': '물살과 바람은 추정에 포함되지 않아요.',
  'help.guide.tour-paddle-wind.step.4':
    '‘바람이 패들링에 미치는 영향’을 열면 맞바람, 옆바람, 탁 트인 수면 횡단, 돌풍이 배에 어떤 영향을 주는지 볼 수 있어요.',
  'help.guide.tour-paddle-checklist.step.1':
    '패들 투어를 저장한 뒤 왼쪽 열에서 ‘체크리스트’를 찾으세요. 헤더의 배지에 목록 진행 상황이 요약돼요.',
  'help.guide.tour-paddle-checklist.tip.4':
    '장애물 정보는 TREK에 있는 지역의 OpenStreetMap 데이터에서 와요. 데이터가 없는 곳은 카드에 그렇게 나오니, 보, 갑문, 육상 운반 구간을 직접 확인하세요.',
  'help.guide.tour-paddle-track-marks.step.4':
    '‘이 여행의 투어’에서 트랙을 클릭하세요. 왼쪽 열에 기록된 그대로 ‘육상 운반과 갑문’ 카드와 함께 보여요.',
  'help.ctx.trip-tour-horse.title': '승마 투어',
  'help.guide.tour-horse-plan.goal': '지도에서 표지판이 있는 승마 경로의 구간을 이어 승마를 만들어요.',
  'help.guide.tour-horse-plan.result':
    '승마가 고른 구간을 따라가고, 구간마다 경로 이름, 통행 점, 길이가 보여요. ‘이 여행의 투어’에도 나와요.',
  'help.guide.tour-horse-gap.step.1':
    '승마에 구간이 있는 상태에서 다른 경로를 열고, 승마 끝점에 닿지 않는 구간을 고르세요. ‘투어와의 연결’에 둘이 얼마나 떨어져 있는지 안내가 나와요.',
  'help.guide.tour-horse-recorded.title': 'GPX 파일의 승마 기록 남기기',
  'help.guide.tour-horse-recorded.tip.2': '고도가 없는 파일에는 오르막 0 대신 ‘파일에 고도가 없습니다’가 보여요.',
  'help.guide.dateless-trip.tip.1':
    '여행 시기가 정해지면 카드의 연필로 양식을 열고 날짜를 고르세요. 계획한 날은 순서를 그대로 유지한 채 차례로 날짜가 붙어요.',
  'help.guide.trip-reminder.goal': '떠나기 며칠 전에 리마인더를 받아요.',
  'help.guide.upcoming-reservations.tip.2':
    '‘대기 중’은 아직 확정되지 않은 예약이에요. 취소된 예약과 보관된 여행은 빠져요.',
  'help.guide.half-company-holiday.tip.1':
    '그날 이미 기록한 휴가는 반일로 줄어요. 나중에 그날을 기록하는 사람은 0.5일만 써요.',
  'help.guide.edit-holiday-calendar.goal': '추가한 공휴일이나 학교 방학 캘린더의 이름, 색, 순서를 바꾸거나 삭제해요.',
  'help.guide.person-color.title': '사람 색 바꾸기',
  'help.guide.answer-fusion-request.tip.1': '요청은 답할 때까지 남아 있어요. 요청이 여러 개면 하나씩 차례로 보여요.',
  'help.guide.log-for-partner.tip.1': '‘반차’와 ‘대체휴무’도 선택한 사람에게 쓸 수 있어요.',
  'help.guide.dissolve-fusion.tip.2': '내 휴가를 보여 주기만 하려면 대신 캘린더를 공유하세요.',
  'help.guide.country-details.tip.2': '‘장소’ 배지를 클릭하면 그 국가로 집계된 모든 장소를 여행별로 볼 수 있어요.',
  'help.guide.country-places.tip.2': '배지는 그 국가에 장소가 있을 때만 보여요. 직접 표시만 한 국가에는 없어요.',
  'help.guide.tour-activity-stats.goal':
    '모든 여행에서 다녀온 투어의 거리, 오르막, 개수를 기간과 유형별로 보고, 하지 못한 투어는 제외해요.',
  'help.guide.tour-activity-stats.tip.1':
    '투어는 마지막 날이 지나야 집계돼요. 날이 없거나 날짜 없는 날에만 있는 투어는 집계되지 않아요. 집계하려면 여행에서 날짜가 있는 날에 넣으세요.',
  'help.guide.move-to-list.result': '장소가 다른 목록으로 들어가고, 몇 개를 옮기거나 복제했는지 짧게 알려 줘요.',
  'help.guide.accept-list-invite.tip.1':
    '목록에서 할 수 있는 일은 소유자가 준 역할에 따라 달라요: ‘뷰어’, ‘편집자’, ‘관리자’.',
  'help.guide.tour-collection-add-to-trip.title': '목록의 투어를 여행에 추가하기',
  'help.guide.tour-collection-add-to-trip.tip.3':
    '투어를 목록에 저장하려면 여행에서 저장된 투어를 열고 아래쪽 ‘컬렉션’을 클릭하세요.',
  'help.guide.tour-collection-manage.tip.2': '휴지통은 목록 소유자와 관리자에게만 보여요.',
  'help.guide.entry-draft.result': '항목은 ‘초안’ 표시와 함께 타임라인에 남고, 공유 링크에는 보이지 않아요.',
  'help.guide.journey-map-layers.title': 'Journey 지도에 보일 내용 고르기',
  'help.guide.journey-keep-route.title': '하루 동안 기록한 경로 저장하기',
  'help.guide.journey-day-stays.title': 'Dawarich가 기록한 방문으로 항목 쓰기',
  'help.guide.journey-take-over-day.title': '기록된 하루 통째로 가져오기',
  'help.guide.journey-take-over-day.result':
    '그날에 방문 기록이나 묶음마다 초안이 하나씩, 또는 하루 기록 하나가 생기고, 그 방문 기록은 더 이상 미결로 나오지 않아요.',
  'help.guide.journey-auto-prepare.result':
    '연결된 여행이 진행되는 동안 날마다 방문 기록이 그날에 정리돼 ‘하루 가져오기’로 바로 쓸 수 있어요.',
  'help.ctx.settings-about.title': '정보',
  'help.guide.web-push-device.tip.3':
    '푸시는 TREK를 HTTPS로 열어야 동작해요. 알림이 차단돼 있으면 브라우저 설정에서 허용한 뒤 다시 시도하세요.',
  'help.guide.connect-airtrail.result':
    '배지에 ‘연결됨’이 보이고, 여행의 ‘교통’ 탭에서 ‘AirTrail에서 가져오기’를 쓸 수 있어요.',
  'help.guide.connect-dawarich.result':
    '배지에 ‘연결됨’이 보이고, 여행 계획, Journey, Atlas에서 Dawarich 기록을 제안받을 수 있어요.',
  'help.guide.tour-connect-wanderer.result':
    '배지에 ‘연결됨’이 보이고, 여행의 ‘투어’ 탭에서 내 wanderer를 검색해 트레일을 가져올 수 있어요.',
  'help.guide.tour-wanderer-watch.result':
    'TREK가 가져온 트레일을 확인하다가 바뀌었을 수 있으면 알려 줘요. 투어는 내가 변경을 수락할 때만 바뀌어요.',
  'help.guide.plugin-settings.step.1':
    '설정 사이드바에서 ‘플러그인’을 여세요. ‘플러그인 설정’ 아래에 설정이 필요한 플러그인마다 입력 칸이 있는 카드가 있어요. 채우고 ‘저장’을 클릭하세요. 카드의 ‘작업’은 확인하면 실행돼요.',
  'help.guide.profile.step.3': '카드 하단 오른쪽의 ‘프로필 저장’을 클릭하세요.',
  'help.guide.default-user-settings.title': '새 사용자의 기본 설정 정하기',
  'help.guide.own-routing-engine.tip.1':
    '공개 OSRM 서버는 초당 요청 1건 정도만 허용해요. 하루 일정에는 충분하지만 로드 트립에는 너무 느릴 수 있어요.',
  'help.guide.admin-passkeys.goal': '지문, 얼굴, 기기 PIN으로 로그인할 수 있게 해요.',
  'help.guide.rotate-jwt-secret.tip.2':
    '한 사람만 로그아웃시키려면 대신 ‘사용자 편집’에서 ‘새 비밀번호’를 지정하세요. 그 사람의 세션만 끝나요.',
  'help.guide.notification-defaults.goal': '모든 사용자의 알림 기본 상태를 정하고, 이벤트별로 채널을 완전히 차단해요.',
  'help.ctx.notifications.summary':
    'TREK가 앱 안에서 보여 준 모든 알림이 최신순으로 있어요: 누군가 바꾼 예약, 여행 채팅의 새 메시지, 나와 공유된 캘린더. 오른쪽 위 벨에는 최근 10개가, 이 페이지에는 전부가 보여요.',
  'help.guide.read-notifications.step.1': '오른쪽 위 벨을 클릭하세요. 빨간 숫자는 아직 읽지 않은 알림 수예요.',
  'help.guide.filter-notifications.step.1': '오른쪽 위 벨을 클릭하세요.',
  'help.guide.mark-notifications-read.step.2':
    '맨 위 ‘모두 읽음으로 표시’를 클릭하면 모든 알림이 한 번에 읽음으로 표시돼요.',
  'help.guide.delete-notifications.tip.1':
    '삭제하면 나에게서만 알림이 지워져요. 알림이 가리키던 예약, 메시지, 공유는 그대로예요.',
  'help.guide.notification-settings.tip.1': '칸에 자물쇠가 있으면 관리자가 그 이벤트를 모두에게 꺼 둔 거예요.',
  'help.guide.add-guest.tip.3':
    '게스트 추가, 이름 변경, 삭제는 여행 소유자만 할 수 있어요. 지출을 결제한 게스트는 결제자를 바꾸거나 결제를 삭제하기 전까지 삭제할 수 없어요.',
  'help.guide.link-journal.tip.1':
    '내가 소유한 Journey만 연결할 수 있어요. 글쓰기 권한만 있는 Journey는 연결할 수 없어요.',
  'help.ctx.trip-places.bullet.7':
    '검색 옆의 체크로 선택을 시작해요. 열 아래쪽 바에서 여러 줄에 한 번에 새 카테고리를 지정하거나, 컬렉션에 추가하거나, 방문함으로 표시하거나, 삭제할 수 있어요.',
  'help.guide.filter-places.step.5':
    '여행이 둘 이상의 국가나 지역에 걸치면 지구본으로 목록을 국가 하나 또는 그 안의 지역 하나로 좁혀요. 각각 개수가 함께 보여요. ‘필터 지우기’로 ‘모든 국가’로 되돌려요.',
  'help.guide.import-places-file.tip.3':
    '투어가 켜져 있으면(기본값) 파일은 열 위쪽 ‘투어’의 ‘GPX 또는 KML 가져오기’로 가져오고, 선은 투어가 돼요. 투어에는 선만 들어가서, 파일의 핀은 거기서 가져오지 않아요.',
  'help.guide.dawarich-stays.step.3':
    '‘이름’, ‘도착’, ‘출발’을 확인하고, 날을 고르거나 ‘아직 일자에 배정되지 않음’으로 두고, 원하면 ‘메모’를 넣은 뒤 ‘장소 추가’를 클릭하세요.',
  'help.guide.leave-stop-off-route.result':
    '들를 곳은 여전히 그날 일정과 PDF에 있어요. ‘경로 외’로 표시된 동안 경로는 앞 들를 곳에서 뒤 들를 곳으로 바로 이어져요.',
  'help.guide.move-booking-day.tip.2': '같은 날 안에서는 시간이 있는 예약이 항상 그 시간 자리로 돌아가요.',
  'help.guide.place-image-from-file.step.3':
    '‘첨부 파일에서’ 원하는 사진을 클릭하세요. 그 위 ‘기기에서 업로드’를 누르면 대신 컴퓨터에서 새 사진을 골라요.',
  'help.guide.place-own-hours.step.1': '장소를 열고 카드 오른쪽 아래 ‘편집’을 클릭하세요. 장소 양식이 열려요.',
  'help.guide.place-own-hours.tip.3':
    '‘영업시간 삭제’를 클릭하고 ‘업데이트’를 누르면 자동으로 찾은 영업시간이 다시 카드에 보여요.',
  'help.guide.confirm-stay-booking.title': '숙박 예약 확정하기',
  'help.guide.confirm-stay-booking.tip.2': '같은 버튼이 모든 예약에서 동작해요. 날의 ‘예약’ 아래 예약도 마찬가지예요.',
  'help.guide.map-lock.tip.2':
    '이 브라우저는 여행마다 잠금 상태를 기억해요. 여행을 열면 지도가 한 번은 여행 전체에 맞춰지기 때문에, 빈 곳이 열리는 일은 없어요.',
  'help.guide.tour-map-lines.step.2':
    '선이나 시작 지점의 핀을 클릭하세요. 지도 아래쪽에 투어 카드가 열리고, 선이 흰 테두리와 함께 굵게 그려져서 다른 선 사이에서도 잘 보여요. 카드 헤더의 X로 닫아요.',
  'help.guide.car-stops.title': '가는 길에 들르는 곳이 있는 운전 계획하기',
  'help.guide.car-stops.result':
    '운전이 ‘교통’ 탭의 카드이자 그날의 한 줄이 되고, 지도의 선은 픽업 장소에서 모든 경유지를 순서대로 지나 반납 장소까지 이어져요.',
  'help.guide.transport-details.step.5':
    '상세 정보 아래쪽 ‘지도에서’를 누르면 이동 선이 보이고 그날의 ‘계획’이 열려요. 맨 오른쪽 ‘편집’은 전체 양식을 열고, 옆의 휴지통은 확인 후 이동을 삭제해요.',
  'help.guide.export-transports-csv.step.1':
    '일부만 내보내려면 먼저 목록을 좁히세요. ‘검색’, ‘필터’, ‘보기 옵션’의 정렬이 모두 반영돼요. 파일에는 탭에 보이는 내용이 보이는 순서대로 담겨요.',
  'help.guide.group-sort-bookings.tip.1':
    '‘카드’와 ‘목록’은 그룹 설정이 따로예요: ‘카드’는 ‘상태’, ‘목록’은 날로 시작해요. ‘보기 옵션’에 점이 있으면 기본값과 다른 설정이 있다는 뜻이고, 패널 아래쪽 ‘보기 초기화’로 기본값으로 되돌려요.',
  'help.guide.booking-on-map.step.2': '상세 정보 아래쪽 ‘지도에서’를 클릭하세요.',
  'help.guide.export-bookings-csv.goal':
    '여행의 예약을 Excel, Numbers 등 스프레드시트에서 열 수 있는 CSV 파일로 내보내요.',
  'help.guide.arrange-packing-list.goal':
    '목록 전체와 항목 하나하나를 원하는 자리로 옮기거나, 목록마다 이름순으로 봐요.',
  'help.guide.check-off-packing.tip.4':
    '수량이 2 이상인 항목은 하나씩 챙긴 것으로 표시할 수도 있어요. ‘같은 물건 여러 개 챙기기’를 참고하세요.',
  'help.guide.count-packed-pieces.tip.1':
    '체크박스를 체크하면 전부 한 번에 챙긴 것으로, 해제하면 전부 다시 안 챙긴 것으로 바뀌어요.',
  'help.guide.expense-receipts.goal': '영수증이나 청구서를 해당 지출과 함께 보관하고, 내역에서 다시 열어요.',
  'help.guide.expense-receipts.tip.2':
    '영수증 옆 휴지통을 누르면 저장할 때 지출에서 빠져요. 파일 자체는 ‘파일’에 남으니, 완전히 지우려면 거기서 삭제하세요.',
  'help.guide.files-sync.tip.4':
    '카드에 ‘다시 연결’이 있는 노란 안내가 보이면 저장소가 저장된 로그인 정보를 더 이상 받지 않는 거예요. ‘다시 연결’을 클릭하고 새 앱 비밀번호나 토큰을 입력하면 동기화가 다시 시작돼요.',
  'help.guide.files-sync-settings.result':
    '다음 실행부터 여행이 고른 방향으로만 동기화되고, 삭제와 충돌하는 편집은 정한 규칙대로 처리돼요.',
  'help.guide.manage-notes.result':
    '메모가 ‘메모’ 카드에서 모든 멤버에게 한꺼번에 사라져요. 고정하거나 수정만 한 메모는 남고, 다른 사람에게도 바꾼 그대로 보여요.',
  'help.guide.note-categories.step.4':
    '줄의 색 점으로 카테고리 색을 정해요: 인디고, ‘빨강’, ‘호박색’, 에메랄드, ‘파랑’, 바이올렛. 여기서는 ‘숙박’이 호박색으로 바뀌어요.',
  'help.guide.roadtrip-reorder.step.3':
    '키보드로는 들를 곳에 포커스를 두고 Alt와 위쪽 또는 아래쪽 화살표를 눌러 그날 안에서 한 칸씩 옮겨요.',
  'help.guide.roadtrip-overnight.title': '경로 중간에서 하룻밤 묵기',
  'help.guide.roadtrip-overnight.tip.1':
    '숙박은 다음 날까지예요. 다른 날짜로 하려면 예약을 바꾸세요: ‘일’에서 나머지 숙박 정보와 함께 날짜를 바꿔요.',
  'help.guide.roadtrip-stop-fill.tip.1':
    '내 차가 충전하거나 주유할 수 있는 곳에만 배지가 붙어요: ‘연료’는 주유소, ‘전기’는 충전소, ‘둘 다’는 양쪽 모두.',
  'help.guide.roadtrip-bookings.result':
    '예약한 이동이 모두 실제 위치에 맞춰 주행에 들어가고, 그 앞뒤 경로는 터미널을 오가요.',
  'help.guide.roadtrip-google-import.step.1':
    '‘경로 중간’ 맨 위의 점 세 개를 클릭하고 ‘Google Maps 경로 가져오기’를 고르세요.',
  'help.guide.roadtrip-hazards.title': '현재 경고를 지도에 표시하기',
  'help.guide.roadtrip-hazards.tip.3':
    '피드는 10분마다 새로 고쳐지고 인터넷 연결이 필요해요. 다른 주행 설정처럼 이 스위치도 여행에 저장돼요.',
  'help.ctx.trip-tours.bullet.6': '경로 수정과 투어 삭제는 ‘투어’ 탭의 ‘이 여행의 투어’에서 해요.',
  'help.guide.tour-show-list.tip.1': '지도에서 투어 선을 클릭하면 목록에서 그 투어가 표시되고 그 위치로 스크롤돼요.',
  'help.guide.tour-add-to-day.step.3':
    '‘10일 차에 추가됨’ 같은 확인이 나오고, 줄에 날 배지가 붙으며, 왼쪽 열의 그날에 투어가 시간, 거리, 오르막과 함께 나와요.',
  'help.guide.tour-day-times.title': '그날 투어 시작 시간 정하기',
  'help.guide.tour-day-times.tip.3':
    '같은 메뉴의 ‘경로에서 제외’는 투어를 그날에 두되 지도의 그날 경로에서는 빼요. ‘경로에 다시 추가’로 되돌려요.',
  'help.guide.tour-remove-from-day.tip.1': '여러 날 투어는 날마다 따로 빼요. 날마다 구간이 따로 있기 때문이에요.',
  'help.guide.tour-filter-list.step.4':
    '메뉴를 닫으세요. 버튼에 상태, 남은 투어 수, 그리고 추가로 설정한 필터마다 +1이 보여요.',
  'help.guide.tour-hide-on-map.step.2':
    '투어 선이 지도에서 숨겨져요. 줄은 목록에 흐리게 남고, 사선이 그어진 눈 아이콘(‘지도에 표시’)이 보여요. 클릭하면 선이 다시 보여요.',
  'help.guide.tour-import-plan-tab.step.2':
    '목록 맨 위 ‘GPX 또는 KML 가져오기’를 클릭하고 파일(GPX, KML, KMZ)을 고르세요.',
  'help.ctx.trip-tour-detail.bullet.2':
    '헤더에 투어의 둥근 타일, 이름과 이름을 바꾸는 연필, 선 색을 나타내는 색 점, 그리고 유형, 출처, 계획 시간, 거리, 누적 상승 고도, 누적 하강 고도 버튼이 있어요. 오른쪽 X나 Esc로 카드를 닫아요.',
  'help.guide.tour-detail-read.step.3': '시간에 포인터를 올리면 구성을 볼 수 있어요: 이동 시간, 휴식, 계획된 총시간.',
  'help.guide.tour-detail-read.tip.4':
    '카드는 경로를 바꾸지 않아요. 지점을 옮기거나 구간을 다시 그리려면 ‘투어’ 탭을 열고 ‘이 여행의 투어’에서 투어를 클릭하세요.',
  'help.guide.tour-rename-colour.step.4':
    '색을 고르세요. 첫 칸 ‘자동 색상’은 선을 기본 색으로 되돌리고, 마지막 칸 ‘사용자 지정 색상 선택’으로 원하는 색을 골라요. 지도의 선과 ‘투어’ 목록의 색 띠가 바로 바뀌어요.',
  'help.guide.tour-take-along.step.3':
    'GPX를 클릭하면 저장된 투어를 GPX 파일로 내려받아요: 고도 정보를 포함한 전체 경로라서 내비게이션 앱이나 GPS 기기에서 바로 쓸 수 있어요.',
  'help.guide.tour-copy-keep.step.1':
    '투어 카드를 열고 아래쪽 ‘복사’를 클릭하세요. TREK가 날짜 없이 독립된 새 투어를 만들고, 원본은 그대로 남아요.',
  'help.guide.tour-copy-keep.result':
    '여행에 마음대로 바꿀 수 있는 두 번째 투어가 생기고, 컬렉션에는 다른 여행에 추가할 수 있는 사본이 따로 저장돼요.',
  'help.guide.tour-packing-link.tip.1':
    '연결일 뿐이에요. 아무것도 복사되거나 옮겨지지 않고, 항목은 ‘목록’에 그대로 있어요. 거기서 체크하면 투어에도 바로 반영돼요.',
  'help.guide.tour-files.step.3': '파일을 클릭하면 열려요.',
  'help.guide.tour-activity-link.step.3': '‘트랙’에서 기록을 고르거나, ‘GPX 가져오기’를 클릭해 새 파일을 가져오세요.',
  'help.guide.tour-activity-compare.goal': '실제 트랙이 계획과 어디서 다른지 보고, 트랙을 바꾸거나 연결을 해제해요.',
  'help.guide.tour-origin-check.title': '투어 출처 확인하기',
  'help.guide.tour-origin-check.result': '투어가 어디서, 언제 왔는지, 그 뒤 바뀌었는지 알 수 있어요.',
  'help.ctx.trip-tour-planner.bullet.6':
    '저장하지 않은 초안은 남아 있어요. ‘투어’ 탭을 다시 열면 ‘저장하지 않은 초안을 복원했습니다’라는 표시와 함께 복원돼요. ‘투어 목록으로’와 ‘취소’는 변경을 버리기 전에 물어봐요.',
  'help.guide.tour-open-workspace.step.6':
    '왼쪽 아래 버튼으로 지도를 바꿔요. 처음에는 ‘지도’나 ‘위성 사진’이에요. 투어를 열면 그 유형의 지도(‘지형도’, ‘하이킹’ 등)와 ‘지점 찍기’, 3D 같은 스위치가 생겨요.',
  'help.guide.tour-draw-route.step.1':
    '왼쪽 레일 맨 위 ‘새 투어 계획’을 클릭하세요. 레일이 ‘새 투어’로 바뀌어요. 다른 유형을 고르지 않으면 하이킹이에요.',
  'help.guide.tour-draw-route.tip.3':
    '초안에 저장하지 않은 변경이 있으면 ‘투어 추가’ 메뉴의 ‘새 투어 계획’이 먼저 ‘새 투어를 시작할까요?’라고 묻고, ‘버리고 시작’ 버튼이 있어요.',
  'help.guide.tour-type-profile.step.4':
    '프로필에 맞게 경로를 다시 계획하고, 오른쪽 ‘투어 요약’에 거리와 시간이 보여요.',
  'help.guide.tour-edit-points.step.3': '순서를 바꾸려면 줄을 가리키고 왼쪽 끝에 나타나는 손잡이로 끌어 옮기세요.',
  'help.guide.tour-shaping-points.goal': '정차 지점을 추가하지 않고 경로를 다른 길로 옮겨요.',
  'help.guide.tour-shaping-points.result': '경로가 끌어 놓은 곳을 지나가고, 정차 지점 번호는 그대로예요.',
  'help.guide.tour-loop-reverse.tip.3':
    '하이킹에서는 옆의 ‘출발점에서 순환 코스’로 원하는 길이의 순환 하이킹을 찾아요.',
  'help.guide.tour-leg-by-hand.tip.1':
    '손으로 그린 구간은 라우터가 확인하지 않았어요. 물, 사유지, 절벽을 지날 수도 있어요.',
  'help.guide.tour-trip-places.step.4':
    '그 줄의 이름 아래에 ‘여행 장소’가 보여요. ‘작업 더 보기’의 ‘장소와 연결 해제’는 지점은 남기고 연결만 끊어요.',
  'help.guide.tour-details-times.step.2': '‘상세 정보’에서 ‘설명’을 쓰고, 웹사이트가 있으면 ‘웹사이트’도 넣으세요.',
  'help.guide.tour-save.goal': '그린 투어를 여행에 저장해요.',
  'help.guide.tour-save.result': '투어가 여행에 저장됐어요. 이제 날에 넣으면 돼요.',
  'help.guide.tour-edit-saved.tip.2':
    '가져온 GPX나 KML 트랙은 보기용 ‘GPX 투어’로 열려요. 거기서 ‘편집 가능한 버전 계획’을 누르면 수정할 수 있는 투어가 만들어져요.',
  'help.guide.tour-summary-profile.step.4':
    '제목 옆 화살표 ‘고도 그래프 접기’로 그래프를 숨기고, 다시 클릭하면 보여요.',
  'help.guide.tour-list-manage.step.2': '투어를 가리키고 줄의 둥근 + ‘날에 추가’를 클릭하면 여행의 날 목록이 열려요.',
  'help.guide.tour-delete.title': '투어 삭제하기',
  'help.guide.tour-saved-elsewhere.title': '투어가 다른 곳에서 저장됐을 때',
  'help.guide.tour-saved-elsewhere.result': '누군가 버리기로 선택하지 않는 한 변경 사항은 사라지지 않아요.',
  'help.guide.tour-import-gpx.title': 'GPX, KML, KMZ 파일을 투어로 가져오기',
  'help.guide.tour-import-gpx.tip.2': '파일 안의 트랙이나 경로는 각각 별도 투어가 돼요. 트랙끼리 합쳐지지 않아요.',
  'help.guide.tour-view-import.step.2':
    '왼쪽 열에 ‘GPX 투어’로 보여요: 거리, 고도, 기록 시간이 담긴 ‘투어 요약’과 그 아래 고도 그래프. 지도에는 그 선이 보여요.',
  'help.guide.tour-plan-from-import.step.1':
    '‘투어’ 탭에서 가져온 투어를 여세요. 왼쪽 ‘편집 가능한 버전’ 카드에서 ‘편집 가능한 버전 계획’을 클릭하세요.',
  'help.guide.tour-plan-from-import.result':
    '이제 투어에 끌어 옮길 수 있는 웨이포인트가 생기고, ‘출처’에 ‘다시 계획함, 기록된 트랙 보관’이라고 나와요.',
  'help.guide.tour-restore-recorded.result': '투어가 다시 ‘GPX 투어’가 되고, 기록 당시의 선이 보여요.',
  'help.guide.tour-take-over.step.6': '‘가져오기’를 클릭하세요.',
  'help.guide.tour-import-wanderer.step.2':
    '‘트레일 검색’에 입력하세요. ‘이 지도 영역 검색’은 지도에 보이는 영역 안의 트레일만 보여 줘요.',
  'help.ctx.trip-tour-map.title': '투어 지도',
  'help.guide.tour-map-layers.goal':
    '투어 종류에 가장 잘 맞는 지도로 계획해요: 오르막을 보는 등고선, 표시된 트레일이나 자전거 경로, 항공 사진.',
  'help.guide.tour-along-search.title': '투어 경로 주변 장소 찾기',
  'help.guide.tour-along-search.tip.1':
    '경로, 종류, 거리를 바꾸면 ‘다시 검색’이 강조되고, 목록이 이전 경로 기준이라고 알려 줘요. 클릭하면 목록이 최신으로 바뀌어요.',
  'help.guide.tour-along-add-stop.step.4':
    '경로가 그 장소를 지나도록 다시 계획되고, ‘투어 경로 주변’에 늘어난 거리와 시간이 나와요. 같은 줄의 ‘실행 취소’로 정차 지점을 다시 빼요.',
  'help.guide.tour-3d-terrain.step.2':
    '경로는 경사도별 색으로 보여요. 아래 줄의 ‘경사’를 클릭하면 대신 투어 색으로 그리고, 다시 클릭하면 경사 색이 돌아와요.',
  'help.guide.tour-3d-flyover.title': '투어 따라 비행하기',
  'help.guide.tour-3d-flyover.tip.2':
    '비행은 경로 전체의 지형을 다 불러온 뒤에 시작해서, 중간에 지도 데이터를 기다리며 멈추지 않아요. 링에 포인터를 올리면 얼마나 불러왔는지 보여요.',
  'help.guide.tour-map-overlays.result': '슬로프나 항로 표지가 지도 위에 그려지고, 범례에서 뜻을 알려 줘요.',
  'help.ctx.trip-tour-stages.bullet.3':
    '‘투어 요약’의 ‘구간’에 모든 구간이 시작 정차 지점부터 끝 정차 지점까지 나와요. 구간을 클릭하면 마지막 정차 지점이 선택되고 고도 그래프에 그 위치가 표시돼요.',
  'help.guide.tour-multi-day.step.4':
    '이제 ‘웨이포인트’가 ‘구간 1’과 ‘구간 2’로 나뉘고, 각각 거리와 시간이 보여요. 구간을 끝내는 정차 지점에는 달 아이콘이 붙어요.',
  'help.guide.tour-stages-on-days.title': '여러 날 투어를 여행의 날에 넣기',
  'help.guide.tour-stages-on-days.tip.1':
    '마지막 구간보다 여행이 먼저 끝나면, 옵션에 들어갈 수 있는 마지막 구간이 나와요. 그 뒤 구간은 날짜 없이 남아요.',
  'help.ctx.trip-tour-hike.bullet.2':
    '‘웨이포인트’에 정차 지점이 순서대로 나와요. ‘지점 추가’는 처음부터 켜져 있어서 지도를 클릭하면 다음 지점이 놓여요. 옆의 ‘여행 장소’로 여행에 있는 산장이나 호텔을 정차 지점으로 만들어요.',
  'help.guide.tour-hike-plan.step.2':
    '‘투어 유형’을 열고 ‘하이킹’을 고르세요: 걸어서, 정한 난이도 안에서 다니는 투어예요.',
  'help.guide.tour-hike-plan.tip.3':
    '난이도 아래 ‘경로 선택’에서 경로 선호를 정해요: ‘가파른 오르막 피하기’, ‘계단 피하기’, ‘페리 피하기’. 다른 길이 없으면 그래도 그 길로 가요.',
  'help.guide.tour-hike-trail-details.step.5':
    '‘노면’을 클릭하면 같은 경로를 아스팔트부터 자연 노면과 바위까지 밟는 바닥 기준으로 볼 수 있어요.',
  'help.guide.tour-hike-round.step.2':
    '지도 위에 ‘순환 하이킹’ 카드가 열려요. 출발 칸에서 출발점을 확인하고 원하는 ‘거리’를 입력하세요. 옆의 표시에 순환 하이킹이 가질 수 있는 길이 범위가 보여요.',
  'help.guide.tour-hike-compare-ways.title': '하이킹 한 구간의 다른 길 비교하기',
  'help.guide.tour-hike-compare-ways.tip.2':
    '라우터가 다른 길을 모르면 카드에 그렇게 나와요. 라우터가 고른 길을 따를 수 없으면 그 구간은 그대로이고, 카드에서 알려 줘요.',
  'help.guide.tour-ferrata-add.step.5':
    '오른쪽 ‘투어 요약’에 등급이 붙은 ‘비아 페라타’ 배지가 보이고, 편집기 위쪽에 ‘경로가 비아 페라타를 지납니다’라는 경고가 떠요.',
  'help.guide.tour-run-plan.step.1': '‘새 투어 계획’을 클릭하고 ‘투어 유형’을 열어 ‘달리기’를 고르세요.',
  'help.guide.tour-run-plan.tip.3': '거리 단위가 마일이면 페이스도 마일당이에요.',
  'help.guide.tour-run-ways.tip.1': '여기서는 달리기 경로나 시간이 바뀌지 않아요.',
  'help.ctx.trip-tour-walk.bullet.5':
    '‘이 여행의 투어’의 ‘투어 추가’로 Google Maps에서 공유한 도보 경로를 가져와요. ‘계획’ 탭에서 날에서 연 산책은 그날 정차 지점을 체크할 수 있어요.',
  'help.guide.tour-walk-plan.step.6':
    '오른쪽 ‘투어 요약’에 ‘예상 시간’, ‘머문 곳’, 그리고 둘을 더한 ‘예정’이 보여요. 왼쪽 열 아래쪽 ‘저장’을 클릭해 산책을 저장하세요.',
  'help.guide.tour-walk-sights.step.2':
    '테마를 고르면 ‘찾을 항목’이 채워져요. 열어서 종류를 켜거나 끄고, ‘경로에서 이 거리 이내’에서 찾을 범위를 고르세요.',
  'help.guide.tour-walk-day-times.title': '그날 도착 시간과 영업시간 보기',
  'help.guide.tour-walk-day-times.tip.3':
    '영업시간은 OpenStreetMap이나 정차 지점과 연결된 여행 장소에서 가져오고, 옆의 표시에 어느 쪽인지 나와요. 가기 전에 확인하세요.',
  'help.guide.tour-walk-google-import.step.4':
    '‘산책으로 불러오기’를 클릭하세요. 정차 지점 사이의 도보 경로는 TREK가 직접 계획해요. ‘저장’을 클릭해 산책을 저장하세요.',
  'help.guide.tour-walk-check-off.step.2':
    '‘산책 정류지’까지 스크롤하세요. 정차 지점마다 머무는 시간이, 시작 시간이 있으면 도착 시간도 보여요.',
  'help.ctx.trip-tour-bike.summary':
    '‘투어’ 탭 편집기에서 연 자전거 투어예요: 경로를 계산한 프로필, 주행 시간, 노면, 그리고 산악자전거 투어라면 트레일 난이도 등급.',
  'help.guide.tour-bike-profile.step.2': '‘투어 유형’ 칸을 열고 ‘자전거 투어’를 고르세요.',
  'help.guide.tour-bike-profile.tip.3':
    '지점 가까이에 자전거가 다닐 길이 없으면 레일에 ‘N번 지점에 닿는 자전거 길이 없습니다’라고 나와요. 지점을 옮기거나, 그 앞 지점의 ‘작업 더 보기’에서 ‘다음 구간을 손으로 그리기’를 고르세요.',
  'help.guide.tour-bike-surfaces.step.4':
    '‘길의 종류’에서 ‘농로·임도’나 ‘차량 통행 도로’ 같은 줄을 클릭하면 경로가 그 길을 지나는 곳이 보여요.',
  'help.guide.tour-bike-mtb-grades.step.1':
    '편집기에서 자전거 투어를 열고 ‘프로필’이 MTB인지 확인하세요. 트레일 등급은 그 프로필에서만 읽어요.',
  'help.ctx.trip-tour-ski.title': '스키와 겨울 투어',
  'help.guide.tour-ski-plan.goal':
    '지도에 있는 슬로프, 리프트, 코스를 따라 슬로프에서의 하루, 크로스컨트리 순환 코스, 스키 투어, 스노슈 산책을 계획해요.',
  'help.guide.tour-ski-plan.tip.2':
    '‘종목’ 옆 정보 점에 TREK가 스키 투어를 어떻게 다루는지 나와요. 거기에도, 여기 어디에도 눈, 눈사태, 슬로프와 리프트, 코스 운영 여부 정보는 없어요.',
  'help.guide.tour-ski-options.step.3':
    '‘우선’에서 ‘가장 빠름’, ‘가장 많이 타기’, ‘가장 쉬움’ 중 하나를 고르세요. ‘속도’에서는 ‘여유롭게’, ‘보통’, ‘스포티하게’ 중 하나를 고르세요. 라우터가 슬로프마다 잡는 시간이 달라져요.',
  'help.guide.tour-ski-fix-leg.goal': '빨간 구간을 클릭 한 번으로 계획하거나 직선으로 그려요.',
  'help.guide.tour-ski-fix-leg.result':
    '빨간 구간이 없어졌어요. 모든 구간이 슬로프를 따르거나 지점 사이를 직선으로 이어요.',
  'help.guide.tour-ski-summary.tip.3':
    '저장된 투어는 저장한 그대로 열려요. 지점을 옮기거나 옵션을 바꾸면 현재 슬로프 데이터로 다시 계획해요.',
  'help.guide.tour-ski-pistes-layer.tip.1':
    '스위치가 계속 회색이고 ‘슬로프를 보려면 확대하세요’라고 나오면 스키장 쪽으로 확대하세요.',
  'help.guide.tour-ski-import.step.3':
    '‘종목’을 고르고, ‘크로스컨트리’라면 ‘주법’도 고르세요. 고르기 전에는 창에 스키 트랙으로 가져오려면 종목을 고르라는 안내가 나와요.',
  'help.ctx.trip-tour-paddle.title': '패들 투어',
  'help.guide.tour-paddle-setup.title': '패들 투어 계획하기',
  'help.guide.tour-paddle-setup.step.7':
    '‘지점 추가’가 켜져 있는지 확인하고 지도를 클릭하세요: 먼저 물에 들어갈 곳, 그다음 중간 지점, 마지막으로 물에서 나올 곳.',
  'help.guide.tour-paddle-water-route.step.1':
    '손으로 그린 구간은 지점 아래에 ‘손으로 그림, 경로 계산 안 됨’과 길이가 보여요. TREK는 그린 선을 그대로 유지해요.',
  'help.guide.tour-paddle-water-route.tip.4':
    '계획되지 않은 구간이 있으면 저장할 수 없어요. 먼저 물길로 계획하거나 손으로 그리세요.',
  'help.guide.tour-paddle-portage.step.5':
    '‘출수와 입수’에 물에서 나와 짐을 내리고 다시 띄우는 데 걸리는 시간(분)을 입력하세요. 비워 두면 TREK가 10분으로 계산해요.',
  'help.guide.tour-paddle-lock.step.2':
    '‘이 지점에 갑문 추가’를 고르세요. 지점 아래에 ‘시간 미입력’이 표시된 갑문 카드가 나타나요.',
  'help.guide.tour-paddle-time.goal': '물 위, 운반, 갑문, 휴식 시간이 어떻게 합산되는지 보고 내 값을 정해요.',
  'help.guide.tour-paddle-time.tip.3':
    '휴식과 내가 정한 계획 총시간은 ‘상세 정보’에서 설정해요. 계획 총시간이 있으면 카드에 추정치 옆에 ‘내가 계획한 총 시간’이 보여요.',
  'help.guide.tour-paddle-wind.tip.1':
    '예보는 앞으로 16일까지만 있어요. 더 먼 날은 언제부터 예보를 볼 수 있는지, 지난 날은 이미 지났다고 알려 줘요.',
  'help.guide.tour-paddle-checklist.step.2':
    '그 아래 줄에 데이터가 얼마나 최신인지 나와요: OpenStreetMap 기준 날짜는 ‘OSM 기준일’, TREK가 읽은 시각은 ‘가져온 일시’, 경로 전체를 다루지 않는 곳은 ‘장애물 데이터’.',
  'help.guide.tour-paddle-checklist.tip.5':
    '체크리스트는 안전이나 법적 허가가 아니에요. 내가 정한 결정으로 OpenStreetMap에 기록된 금지 구역이나 사유지가 풀리지는 않아요.',
  'help.guide.tour-paddle-track-marks.step.5':
    '‘육상 운반’을 클릭한 다음, 선에서 물에서 나온 곳과 다시 들어간 곳을 클릭하세요.',
  'help.ctx.trip-tour-horse.summary':
    '승마는 경로를 자동으로 계산하지 않아요. OpenStreetMap에 있는 표지판 승마 경로의 구간으로 만들고, 그 사이는 손으로 그린 구간으로 잇거나, 기록한 그대로 보관해요.',
  'help.guide.tour-horse-plan.step.1':
    '타고 싶은 지역이 지도에 보이게 한 뒤 왼쪽 열 맨 위 ‘새 투어 계획’을 클릭하세요.',
  'help.guide.tour-horse-plan.tip.1':
    '승마 경로라고 해서 말을 타도 된다는 허가는 아니에요. ‘말 통행’은 OpenStreetMap의 태그를 보여 줄 뿐이에요. 항상 현장 표지판을 따르세요.',
  'help.guide.tour-horse-gap.step.2': '‘수동 구간으로 연결’을 켜세요. 빈 구간이 확인 없이 직선으로 그려져요.',
  'help.guide.tour-horse-recorded.goal': 'GPS 기기나 앱으로 기록한 승마를 가져와 실제로 달린 그대로 남겨요.',
  'help.guide.tour-horse-recorded.tip.3': '파일을 ‘투어’ 탭 아무 곳에나 끌어다 놓아도 같은 미리보기가 열려요.',
  'help.guide.create-trip.tip.3':
    '‘동행자’에서 이 TREK에 이미 계정이 있는 사람을 추가할 수 있어요. 여행이 만들어지면 바로 여행 멤버가 돼요.',
  'help.guide.trip-reminder.step.1':
    '여행 카드의 연필을 클릭하세요. 새 여행이라면 ‘새 여행’ 양식에 같은 섹션이 있어요.',
  'help.guide.company-holidays.tip.2':
    '종일 회사 휴일로 정하면 그날 이미 기록한 휴가가 지워져서, 아무도 그날 휴가 일수를 쓰지 않아요.',
  'help.guide.half-company-holiday.tip.2':
    '같은 설정으로 날을 다시 클릭하면 해제되고, ‘반차’를 끈 채 클릭하면 종일 회사 휴일이 돼요.',
  'help.guide.edit-holiday-calendar.step.1': '‘설정’을 열고 ‘공휴일’이나 ‘학교 방학’에서 캘린더를 찾으세요.',
  'help.guide.person-color.goal': '나나 함께 계획하는 사람에게 구분하기 쉬운 색을 정해요.',
  'help.guide.answer-fusion-request.tip.2': '나중에 둘 중 누구든 퓨전을 해제할 수 있고, 항목은 그대로 남아요.',
  'help.guide.log-for-partner.tip.2': '상대방에게 바로 반영되고, ‘휴가 일수’의 그 사람 줄도 바로 업데이트돼요.',
  'help.guide.country-places.title': '국가의 모든 장소 보기',
  'help.guide.tour-activity-stats.step.1': '지도 아래쪽 패널에서 ‘통계’, ‘버킷 리스트’ 옆의 ‘투어’ 탭을 여세요.',
  'help.guide.tour-activity-stats.tip.2':
    '투어 상세의 ‘실제 트랙 추가’로 실제 다녀온 트랙을 연결하면, 여기서 계획 값 대신 기록 값을 써요. 여러 날에 계획한 투어도 한 번만 집계돼요.',
  'help.ctx.collections.bullet.7':
    '저장한 투어: 여행에서 저장한 투어는 목록 맨 앞에 난이도, 유형, 원래 여행, 측정값과 함께 나와요. ‘여행에 추가’로 그 투어에서 새 투어를 만들고, 휴지통 아이콘으로 목록에서 빼요.',
  'help.guide.move-to-list.title': '장소를 다른 목록으로 옮기거나 복제하기',
  'help.guide.copy-to-trip.tip.2': '여행에 이미 있는 장소는 건너뛰고, 몇 개를 건너뛰었는지 TREK가 알려 줘요.',
  'help.guide.accept-list-invite.tip.2':
    '목록 위쪽 ‘공유됨’을 클릭하면 멤버가 보여요. 거기서 ‘목록 나가기’로 다시 나갈 수 있어요.',
  'help.guide.tour-collection-add-to-trip.goal':
    '목록에 저장한 투어로 내 여행에 새 투어를 만들어요. 웨이포인트는 넣어도 되고 빼도 돼요.',
  'help.guide.tour-collection-add-to-trip.result':
    '창에서 투어가 이제 그 여행에 속한다고 알려 줘요. ‘여행 열기’로 그 여행으로 가고, ‘닫기’를 누르면 컬렉션에 남아요.',
  'help.guide.tour-collection-manage.tip.3': '저장한 투어는 그 목록에서만 보이고, ‘모든 저장 항목’에는 나오지 않아요.',
  'help.guide.search-journey.step.3':
    '날을 클릭하면 그곳으로 스크롤되고, 화살표를 클릭하면 그날 항목이 나와서 하나를 고를 수 있어요.',
  'help.guide.journey-map-layers.goal': '계획과 실제 기록의 차이를 보고, 레이어를 켜고 꺼요.',
  'help.guide.journey-keep-route.goal': 'Dawarich의 하루 실제 경로를 Journey 지도에 추가해서 남겨 둬요.',
  'help.guide.journey-day-stays.goal': 'Dawarich가 기록한 방문을 하나씩 항목으로 바꿔요.',
  'help.guide.journey-take-over-day.goal': '하루의 방문 기록을 한 번에 초안 항목이나 하루 기록 하나로 바꿔요.',
  'help.guide.journey-auto-prepare.title': 'TREK가 기록된 날을 준비하게 하기',
  'help.guide.photo-location.title': '사진을 찍은 곳에 항목 위치 지정하기',
  'help.ctx.settings-about.summary':
    'TREK 소개, 이 서버의 버전, 프로젝트 관련 링크예요: 문서, 버그 신고 위치, 프로젝트 후원 방법.',
  'help.guide.startup.tip.2': '끈 애드온에 속한 시작 탭은 대신 계획이 열려요.',
  'help.guide.web-push-device.title': '이 기기에서 푸시 알림 받기',
  'help.guide.connect-airtrail.tip.1': '이 카드는 관리자가 AirTrail 애드온을 켜 뒀을 때만 보여요.',
  'help.guide.connect-dawarich.tip.1':
    'TREK는 항목, 장소, 국가를 제안만 해요. 확인하기 전에는 아무것도 추가되지 않고, Dawarich에 기록하는 것도 없어요.',
  'help.guide.tour-connect-wanderer.tip.1': '이 카드는 관리자가 ‘투어’에서 wanderer를 허용했을 때만 보여요.',
  'help.guide.tour-wanderer-watch.tip.1':
    '알림이 투어를 바꾸지는 않아요. 실제로 무엇이 바뀌었는지는 투어의 소스 확인에서 볼 수 있어요.',
  'help.guide.api-keys.tip.3':
    '키를 Authorization: Bearer 또는 X-API-Key로 /api/v1에 보내세요. 계정당 키는 10개까지 만들 수 있어요.',
  'help.guide.plugin-settings.step.2':
    '‘플러그인 활동’에는 플러그인이 나 대신 한 모든 작업이 최신순으로 나와요. ‘새로 고침’으로 최신 내용을 불러와요.',
  'help.ctx.admin-github.bullet.3': '‘정보’: Ko-fi, Buy Me a Coffee, Discord, ‘버그 신고’, ‘기능 요청’, 위키.',
  'help.guide.default-user-settings.goal':
    '아무도 ‘설정’을 열지 않아도 모든 계정에 알맞은 단위, 색상 모드, 통화를 정해 줘요.',
  'help.guide.default-map.step.3':
    '각 칸은 다른 곳을 누르면 저장돼요. 칸 이름 옆의 초기화 링크로 TREK 기본값으로 되돌려요.',
  'help.guide.own-routing-engine.tip.2':
    '자체 경로 서버만 설정하면 공개 Valhalla도 쓰지 않아요. 칸 옆 초기화 링크로 다시 비울 수 있어요.',
  'help.guide.admin-passkeys.step.1': '‘설정’ 탭의 ‘패스키 로그인’에서 ‘패스키 로그인 활성화’를 켜세요.',
  'help.guide.storage-backends.step.4':
    '맨 위 ‘건강’에 미러 대상에 쓰지 못한 기록이 나와요. ‘기록된 복제본 오류가 없습니다.’라고 나오면 모두 정상이에요.',
  'help.guide.channels-instance.tip.3':
    '‘웹 푸시’는 HTTPS가 필요해요. iPhone과 iPad에서는 먼저 TREK를 홈 화면에 추가해야 해요.',
  'help.guide.notification-defaults.step.1':
    '‘알림’ 탭 맨 아래 ‘사용자 기본값’까지 스크롤하세요. 줄은 이벤트, 열은 채널이에요.',
  'help.ctx.notifications.bullet.1':
    '오른쪽 위 벨에 아직 읽지 않은 알림 수가 보여요. 클릭하면 최근 10개가 나오고, 아래쪽 ‘모든 알림 보기’로 이 페이지가 열려요.',
  'help.guide.read-notifications.step.2':
    '패널에 최근 알림 10개가 나와요. 누가 어디서 무엇을 했는지 보여 주고, 읽지 않은 알림은 배경색이 있어요.',
  'help.guide.filter-notifications.step.2': '패널 아래쪽에서 ‘모든 알림 보기’를 클릭하세요.',
  'help.guide.mark-notifications-read.tip.1': '알림 버튼으로 열어도 읽음으로 표시돼요.',
  'help.guide.delete-notifications.tip.2':
    '삭제한 알림은 되돌릴 수 없어요. 숨기되 남겨 두려면 읽음으로 표시하고 ‘읽지 않음’ 필터를 쓰세요.',
  'help.guide.notification-settings.tip.2': '여행별 설정은 없어요. 스위치 하나가 모든 여행에 적용돼요.',
  'help.guide.link-journal.title': '여행에 Journey 연결하기',
  'help.guide.link-journal.tip.2': '그때부터 접근 권한을 준 사람들의 Journey 목록에도 그 Journey가 보여요.',
  'help.ctx.trip-places.bullet.8':
    'Dawarich를 연결하면 목록 맨 위 ‘Dawarich에서’에 여행 중 Dawarich가 기록한 방문이 나와요. ‘장소로 추가’로 방문을 장소로 만들고, ‘방문한 장소가 아님’으로 목록에서 빼요.',
  'help.guide.dawarich-stays.step.4':
    '실제 방문이 아니었다면 옆의 x ‘방문한 장소가 아님’을 클릭해 빼세요. 목록 맨 아래 ‘이미 처리한 항목 표시…’에서 추가하거나 뺀 방문 기록을 볼 수 있고, ‘되돌리기’로 뺀 방문을 다시 목록에 넣어요.',
  'help.guide.leave-stop-off-route.tip.1':
    '좌표가 있는 들를 곳에만 이 옵션이 있고, 그날에만 적용돼요. 다른 날의 같은 장소는 그대로 경로에 포함돼요.',
  'help.guide.move-booking-day.title': '예약을 다른 날로 옮기기',
  'help.guide.place-image-from-file.step.4':
    '이제 그 사진이 장소 사진이에요. 모서리의 작은 빨간 X를 클릭하면 다시 뺄 수 있어요.',
  'help.guide.place-own-hours.step.2': '‘웹사이트’ 아래에 알고 있다면 ‘전화’와 ‘이메일’을 채우세요.',
  'help.guide.add-accommodation.tip.4':
    '더 빠른 방법: 날 헤더의 +(툴팁 ‘날에 추가’)에 ‘숙박 추가’가 있어요. 이 양식이 열린 채로 날이 열려요.',
  'help.guide.confirm-stay-booking.goal': '숙박에 연결된 호텔 예약을 날에서 바로 확정됨으로 표시해요.',
  'help.guide.map-whole-trip.tip.4':
    '여행 전체 보기 여부는 내 계정에 여행별로 저장돼서, 다른 브라우저에서도 같은 방식으로 열려요.',
  'help.guide.tour-map-lines.step.3':
    '날 열에서 투어가 있는 날을 열면 투어가 그날 경로에 포함돼요: 경로가 투어 시작점까지 가고, 투어가 끝나는 곳에서 이어져요.',
  'help.guide.car-stops.goal': '렌터카나 내 차에 픽업, 반납, 그 사이에 들르는 곳을 정해요.',
  'help.guide.car-stops.tip.1': '렌터카 유형은 따로 없어요. 렌터카도 내 차도 모두 ‘차량’이에요.',
  'help.guide.transport-details.result':
    '이동 날짜의 ‘계획’이 열리고, 지도에 선이 그려지며, 그 줄의 경로 아이콘이 켜져요.',
  'help.guide.export-transports-csv.step.2':
    '‘보기 옵션’ 뒤의 스프레드시트 아이콘을 클릭하세요. 툴팁에 ‘스프레드시트로 내보내기 (CSV)’라고 나와요.',
  'help.guide.group-sort-bookings.title': '예약 묶고 정렬하기',
  'help.guide.group-sort-bookings.tip.2':
    '‘타임라인’에서는 같은 버튼에 ‘유형별로 한 줄씩’과 ‘다른 탭도 표시’가 있어요.',
  'help.guide.booking-on-map.result': '상세 정보가 닫히고 예약 날짜의 ‘계획’ 탭이 열리며, 지도에서 그 장소가 선택돼요.',
  'help.guide.export-bookings-csv.step.1':
    '탭의 일부만 내보내려면 먼저 ‘검색’이나 ‘필터’로 좁히세요. 파일에는 탭에 보이는 내용이 그대로 담겨요.',
  'help.guide.import-booking-file.tip.4':
    '확인서를 읽으려면 인터넷 연결이 필요해요. 오프라인이면 가져오기에서 알려 주니, 다시 온라인이 되면 다시 시도하세요.',
  'help.guide.arrange-packing-list.step.1':
    '목록 헤더 왼쪽 끝, 색 점 앞의 손잡이를 끌어서 다른 카드 위에 놓으세요. 놓을 카드에 강조 색 테두리가 생기고, 목록이 그 자리로 옮겨져요. 여행의 모든 사람에게 똑같이 바뀌어요.',
  'help.guide.count-packed-pieces.title': '같은 물건 여러 개 챙기기',
  'help.guide.count-packed-pieces.tip.2': '‘가방 추적’이 켜져 있으면 ‘가방’ 카드의 ‘완료’는 이미 센 개수만 계산해요.',
  'help.guide.packing-bags.tip.4':
    '여러 사람이 드는 가방의 무게는 ‘1인당’에서 똑같이 나눠요. 이 무게에는 점선 밑줄이 있고, 가리키면 안내가 나와요.',
  'help.guide.expense-receipts.step.1':
    '지출 줄 옆의 연필을 클릭하세요. 편집기가 열리고, 아래쪽에 ‘영수증 및 청구서’가 있어요.',
  'help.guide.expense-receipts.tip.3':
    '영수증은 여행 파일로 저장되기 때문에 첨부하려면 인터넷 연결과 파일 업로드 권한이 필요해요.',
  'help.guide.files-sync-settings.title': '문서 동기화 방향 정하기',
  'help.guide.files-sync-settings.tip.1':
    '한 방향은 항상 켜져 있어요. 켜진 방향이 하나뿐이면 클릭해도 아무 일도 일어나지 않아요.',
  'help.guide.manage-notes.title': '메모 읽기, 고정하기, 편집하기',
  'help.guide.manage-notes.tip.1':
    '‘펼치기’는 메모에 글이 있을 때만 메뉴에 있어요. 협업을 편집할 수 없는 멤버에게는 ‘펼치기’만 보여요.',
  'help.guide.note-categories.step.5':
    '‘저장’을 클릭하세요. 이름이나 색을 바꾼 카테고리의 모든 메모가 모든 멤버에게 한 번에 바뀌어요. ‘취소’를 누르면 변경을 버려요.',
  'help.guide.trip-chat.tip.5':
    '채팅에는 최신 메시지가 먼저 보여요. 채팅 맨 위 ‘이전 메시지 불러오기’로 예전 메시지를 불러와요.',
  'help.guide.roadtrip-reorder.result':
    '들를 곳이 정한 순서대로 놓이고, 바꾼 날마다 거리, 운전 시간, 도착 시간을 다시 계산해요.',
  'help.guide.roadtrip-overnight.goal': '이동 중 잘 곳을 찾아 하룻밤을 예약으로 주행에 추가해요.',
  'help.guide.roadtrip-overnight.tip.2':
    '예약한 숙박을 카드의 ‘편집’에서 다시 ‘휴식’으로 바꾸면 먼저 ‘숙박을 취소할까요?’라고 물어요. ‘휴식으로 바꾸기’를 누르면 숙박과 그 예약, 연결된 지출이 삭제되고, 들를 곳은 주행에 남아요.',
  'help.guide.roadtrip-stop-fill.tip.2': '이미 정해진 값을 다시 고르면 그곳은 기본값으로 돌아가요.',
  'help.guide.roadtrip-bookings.tip.1':
    '체크인을 고려해 터미널 도착 시간을 시간표보다 일찍 잡아요: 항공편이나 크루즈는 1시간, 페리는 30분, 기차나 버스는 10분이에요.',
  'help.guide.roadtrip-google-import.step.2': 'Google Maps에서 공유한 경로 링크를 붙여 넣고 ‘미리보기’를 클릭하세요.',
  'help.guide.roadtrip-hazards.goal': '주행 경로 주변의 기상 경보와 재난 알림을 지도에서 확인해요.',
  'help.ctx.trip-tours.title': '계획 속 투어',
  'help.guide.tour-show-list.title': '계획에서 여행의 투어 보기',
  'help.guide.tour-show-list.tip.2':
    '아직 투어가 없나요? 목록 맨 위 ‘GPX 또는 KML 가져오기’로 파일을 가져오거나, ‘투어’ 탭의 ‘새 투어 계획’으로 새로 만드세요.',
  'help.guide.tour-add-to-day.step.4':
    '또는 목록에서 줄을 끌어 왼쪽 열의 날에 놓으세요. 두 들를 곳 사이에 놓으면 그 자리에 들어가요.',
  'help.guide.tour-day-times.goal': '투어가 언제 끝나는지, 그날 다음 일정과 겹치는지 확인해요.',
  'help.guide.tour-day-times.tip.4':
    '같은 메뉴의 ‘컬렉션에 저장’은 카드의 ‘컬렉션’ 버튼처럼 투어를 경로와 함께 컬렉션에 저장해요.',
  'help.guide.tour-remove-from-day.tip.2':
    '이 메뉴와 카드에는 ‘삭제’가 없어요. 투어는 ‘투어’ 탭의 ‘이 여행의 투어’에서 줄의 휴지통으로 삭제해요.',
  'help.guide.tour-filter-list.tip.1':
    '‘경로 한도’는 경로 계획 때 허용한 최고 난이도이지, 실제 길에서 잰 난이도가 아니에요.',
  'help.guide.tour-hide-on-map.step.3':
    '숨긴 투어가 있으면 목록 위 줄에 ‘지도에서 숨김’과 개수가 보여요. ‘모두 표시’로 모든 투어를 한 번에 다시 보여 줘요.',
  'help.guide.tour-import-plan-tab.step.3':
    '‘가져오기 미리보기’에서 저장 전에 트랙을 하나씩 보여 줘요. ‘가져올 유형’에서 유형(‘하이킹’, ‘자전거 투어’ 등)을 고르고 ‘투어 1개 가져오기’를 클릭하세요.',
  'help.ctx.trip-tour-detail.bullet.3':
    '그 아래에 ‘여행 날짜’(투어가 들어간 날마다 타일), 고도 그래프가 있는 측정값, 그리고 해당하는 경우 도심 산책의 정류지, 패들 투어의 확인 항목과 바람, ‘실제 트랙’, ‘짐 목록’, ‘설명’, ‘메모’, ‘출처’, ‘파일’이 이어져요.',
  'help.guide.tour-detail-read.step.4':
    '‘여행 날짜’에 투어가 들어간 날마다 날짜가 적힌 타일이 보여요. ‘아직 여행의 어느 날에도 없음’이면 아직 계획하지 않은 투어예요.',
  'help.guide.tour-detail-read.tip.5':
    '휴대폰에서는 카드가 아래에서 올라오는 시트로 열려요. 내용을 보고 투어를 가져갈 수 있어요.',
  'help.guide.tour-rename-colour.tip.1':
    '이름과 색은 여행에 속해서 여행의 모든 사람에게 보여요. 다른 사람은 그대로 두고 내 지도에서만 투어를 숨기려면 ‘투어’ 목록의 눈 아이콘을 쓰세요.',
  'help.guide.tour-take-along.tip.1':
    '파일을 공유할 수 있는 기기에서는 GPX 옆에 ‘공유’가 생겨서 같은 파일을 다른 앱으로 바로 보내요.',
  'help.guide.tour-copy-keep.step.2':
    '사본이 바로 열리고, 원래 이름 뒤에 (사본)이 붙어요. 연필을 클릭해 새 이름을 붙이세요.',
  'help.guide.tour-packing-link.title': '투어를 짐 목록과 연결하기',
  'help.guide.tour-packing-link.tip.2':
    '섹션 헤더의 ‘변경’으로 다른 목록과 연결해요. 그 창의 ‘연결 해제’를 누르면 연결이 끊기고, 목록은 그대로예요.',
  'help.guide.tour-files.tip.1': '이 파일들은 여행 파일이기도 해서 ‘파일’ 탭에도 보여요.',
  'help.guide.tour-activity-link.step.4': '‘실제’에서 측정값을 확인하고 ‘링크’를 클릭하세요.',
  'help.guide.tour-activity-compare.step.1':
    '투어 카드를 여세요. ‘계획과 실제’에 계획의 ‘거리’, ‘누적 상승 고도’, ‘누적 하강 고도’, ‘휴식 포함 시간’이 트랙 값과 나란히, ‘차이’와 함께 보여요.',
  'help.guide.tour-origin-check.goal':
    '투어를 TREK에서 그렸는지 가져왔는지, 어떤 파일에서 왔는지, 그 뒤 바뀌었는지 알아봐요.',
  'help.ctx.trip-tour-planner.title': '투어',
  'help.guide.tour-open-workspace.title': '‘투어’ 탭 둘러보기',
  'help.guide.tour-open-workspace.step.7':
    '오른쪽 레일에서 투어를 클릭하세요. TREK에서 계획한 투어는 편집기에서 열리고, 가져온 트랙은 보기용 ‘GPX 투어’로 그대로 열려요.',
  'help.guide.tour-draw-route.step.2':
    '‘장소 또는 주소 검색’에 투어 출발지를 입력하고 결과를 고르세요. 지도가 그곳으로 이동해요.',
  'help.guide.tour-draw-route.tip.4':
    '저장하지 않은 초안은 남아 있어요. 여행의 ‘투어’ 탭을 다시 열면 ‘저장하지 않은 초안을 복원했습니다’라는 표시와 함께 복원돼요.',
  'help.guide.tour-type-profile.tip.1':
    '유형 변경은 기록에서 한 단계로 세요. 레일 헤더의 ‘지점 편집 실행 취소’로 이전 유형과 경로로 되돌려요.',
  'help.guide.tour-edit-points.step.4':
    '또는 줄의 ‘작업 더 보기’(점 세 개)를 열고 ‘지점 위로 이동’이나 ‘지점 아래로 이동’을 고르세요.',
  'help.guide.tour-shaping-points.step.1':
    '지도에서 경로가 다르게 지나가야 할 곳의 그려진 선을 클릭하세요. 그 자리에 작은 점, 즉 형태 지점이 생겨요.',
  'help.guide.tour-loop-reverse.title': '순환 코스 만들기, 투어 방향 뒤집기',
  'help.guide.tour-loop-reverse.result': '출발한 곳에서 끝나는 순환 코스, 또는 반대 방향의 같은 투어가 됐어요.',
  'help.guide.tour-leg-by-hand.tip.2':
    '어떤 길도 닿지 않는 지점에는 ‘지점 표시’와 번호가 있는 안내가 나와요. 지점을 길 위로 옮기거나, 그 지점까지 구간을 손으로 그리세요.',
  'help.guide.tour-trip-places.tip.1': '이미 투어에 있는 장소는 ‘투어에 있음’으로 표시되고 다시 고를 수 없어요.',
  'help.guide.tour-details-times.step.3': '‘휴식’에 0:45처럼 입력하세요. 예상 시간에 더해져요.',
  'help.guide.tour-save.step.1': '‘투어 이름’에 이름을 입력하세요. 이름이 없으면 ‘저장’이 회색으로 비활성화돼요.',
  'help.guide.tour-edit-saved.title': '저장된 투어 수정하기',
  'help.guide.tour-edit-saved.tip.3': '레일 헤더의 ‘GPX 다운로드’와 ‘컬렉션에 보관’은 변경을 저장한 뒤에 쓸 수 있어요.',
  'help.guide.tour-summary-profile.tip.1': '카드 제목을 클릭하면 요약 전체가 접혀요.',
  'help.guide.tour-list-manage.step.3': '날을 고르세요. 투어가 그날에 들어가고, 줄에 그 날이 보여요.',
  'help.guide.tour-delete.goal': '투어를 여행에서 완전히 삭제해요.',
  'help.guide.tour-saved-elsewhere.goal': '내가 수정하는 동안 다른 사람이 투어를 저장했을 때 어떻게 할지 정해요.',
  'help.ctx.trip-tour-import.title': '투어 가져오기',
  'help.guide.tour-import-gpx.goal': 'GPS 시계, 앱, Google Earth의 트랙을 저장 전에 확인하고 여행의 투어로 만들어요.',
  'help.guide.tour-import-gpx.tip.3': '여행에 이미 있는 트랙은 ‘이미 여행에 있음’으로 회색 표시되고 건너뛰어요.',
  'help.guide.tour-view-import.step.3': '왼쪽 위 화살표 ‘투어 목록으로’로 다시 닫아요.',
  'help.guide.tour-plan-from-import.step.2':
    'TREK가 트랙에서 기준점을 뽑아 경로를 다시 계산해요. 지도에 가져온 트랙은 점선, 제안 경로는 실선으로 보이고, 카드에서 두 길이, 트랙에서 50m 이내 비율, ‘최대 편차’를 비교해요.',
  'help.guide.tour-restore-recorded.title': '기록된 트랙으로 되돌리기',
  'help.guide.tour-take-over.title': '다른 여행에서 투어 가져오기',
  'help.guide.tour-take-over.tip.1':
    '사본은 별도 투어예요. 아직 어느 날에도 없고, 나중에 원본을 바꿔도 사본에 영향이 없으며 그 반대도 마찬가지예요. ‘출처’에 가져온 여행 이름이 나와요.',
  'help.guide.tour-import-wanderer.step.3':
    '트레일을 클릭하세요. 지도에 나타나고, 열에 GPX 파일의 측정값, 설명, wanderer에서 공개인지 비공개인지가 보여요.',
  'help.ctx.trip-tour-map.summary':
    '‘투어’ 탭 가운데의 지도로, 열린 투어를 위한 거예요: 투어 유형에 맞는 지도, 그 위에 겹쳐 보이는 슬로프나 항로 표지, 경로 주변 장소, 그리고 실제 지형 위의 3D 투어.',
  'help.guide.tour-map-layers.step.1':
    '‘투어’ 탭을 열고 오른쪽 ‘이 여행의 투어’에서 투어를 클릭하세요. 플래너에서 열리고, 지도 왼쪽 아래 버튼에 이 종류의 투어가 지원하는 지도가 나와요.',
  'help.guide.tour-along-search.goal': '계획 중인 투어 경로 가까이에서 전망대, 물, 산장, 식당을 찾아요.',
  'help.guide.tour-along-search.tip.2': '도심 산책에서는 목록 위 테마 네 개가 알맞은 종류를 골라 줘요.',
  'help.guide.tour-along-add-stop.result':
    '이제 투어가 그 장소를 지나가고, ‘투어 요약’에 새 거리와 시간이 보여요. 변경을 유지하려면 투어를 저장하세요.',
  'help.guide.tour-3d-terrain.step.3':
    '오른쪽 ‘경사 분포’ 버튼을 클릭하세요. 투어 중 ‘5 % 미만’, ‘5~10 %’, ‘10~18 %’, ‘18~27 %’, ‘27 % 이상’ 구간의 비율이 펼쳐져요. 접혀 있을 때는 가장 높은 지점과 가장 가파른 구간이 보여요.',
  'help.guide.tour-3d-flyover.goal': '걷거나 타거나 스키를 타기 전에 투어 전체를 처음부터 끝까지 미리 봐요.',
  'help.guide.tour-3d-flyover.tip.3':
    '비행을 일시 정지한 동안 고도 그래프를 따라 움직이면 점이 그 지점으로 옮겨져요. ‘비행 재생’을 누르면 거기서부터 이어져요.',
  'help.guide.tour-map-overlays.tip.1':
    '슬로프는 지도 데이터일 뿐 실시간 정보가 아니에요. 운영 여부, 정설 여부, 눈 상태, 눈사태는 알려 주지 않아요. 스키장보다 넓게 축소하면 스위치에 ‘슬로프를 보려면 확대하세요’라고 나와요.',
  'help.ctx.trip-tour-stages.bullet.4':
    '‘이 여행의 투어’에서 여러 날 투어에는 구간 수가 적힌 달 아이콘이 보여요. 그 버튼 ‘구간 보기’를 누르면 구간 목록이 날짜와 ‘전체 투어’ 합계와 함께 펼쳐져요.',
  'help.guide.tour-multi-day.step.5':
    '‘투어 요약’의 ‘구간’에 모든 구간이 나와요. 하나를 클릭하면 어디서 끝나는지 보여요: 마지막 정차 지점이 선택되고 고도 그래프에 그 위치가 표시돼요.',
  'help.guide.tour-stages-on-days.goal': '구간마다 각각 다른 날에 넣거나, 투어 전체를 하루에 넣어요.',
  'help.guide.tour-stages-on-days.tip.2':
    '이미 투어가 들어 있는 날에서는 ‘이날 전체 투어’가 회색으로 비활성화돼요. ‘이날부터 구간별로’는 그날에도 쓸 수 있고, 그날의 전체 투어를 대신해요.',
  'help.ctx.trip-tour-hike.bullet.3':
    '‘웨이포인트’ 카드 헤더에 경로 도구가 있어요: ‘방향 뒤집기’, ‘출발점으로 돌아가기’, 하이킹이라면 ‘출발점에서 순환 코스’. 정차 지점의 ‘작업 더 보기’에는 ‘다음 구간의 길 비교’가 있어요.',
  'help.guide.tour-hike-plan.step.3': '‘투어 이름’에 이름을 입력하세요.',
  'help.guide.tour-hike-plan.tip.4':
    '걷는 시간은 하이킹 이정표 기준(DIN 33466)으로 계산하고 휴식은 빠져요. ‘상세 정보’의 ‘휴식’에 넣으면 계획 총시간에 보여요.',
  'help.guide.tour-hike-trail-details.result':
    '하이킹의 어느 구간이 어떤 등급이고, 노면이 무엇이며, 지도에서 어디인지 알 수 있어요.',
  'help.guide.tour-hike-round.step.3':
    '‘순환 코스 찾기’를 클릭하세요. 순환 A, 순환 B 등이 목록과 지도에 각자 다른 색으로 나타나요.',
  'help.guide.tour-hike-compare-ways.goal':
    '두 정차 지점 사이에서 하이킹이 갈 수 있는 다른 길을 보고, 그중 하나를 골라요.',
  'help.guide.tour-hike-compare-ways.tip.3': '‘취소’는 카드를 닫고 경로를 바꾸지 않아요.',
  'help.guide.tour-ferrata-add.result':
    '하이킹이 OpenStreetMap의 비아 페라타 선을 그대로 따라가요. 지도를 클릭해 정상에서 이어 가세요. 라우터는 비아 페라타까지 가는 길과 그 뒤의 길만 계획해요.',
  'help.guide.tour-run-plan.step.2':
    '‘프로필’을 고르세요: ‘달리기’는 도심, 공원, 강변의 대부분 포장된 길, ‘트레일 러닝’은 숲길과 자연 길이에요.',
  'help.guide.tour-run-plan.tip.4': '‘트레일 러닝’은 산길(T2)까지만 쓰고, 그보다 어려운 길은 쓰지 않아요.',
  'help.guide.tour-run-ways.tip.2':
    '경로가 자연 길을 더 많이 쓰게 하려면 ‘프로필’을 ‘트레일 러닝’으로, 단단한 길로만 다니게 하려면 ‘달리기’로 바꾸세요.',
  'help.guide.tour-walk-plan.title': '정류지를 이어 도심 산책 계획하기',
  'help.guide.tour-walk-plan.tip.1':
    '정차 지점 번호 둘레의 테두리가 중요도를 나타내요: ‘꼭 방문’은 실선, ‘선택 사항’은 점선이에요. 작은 방패는 ‘보호됨’ 정차 지점이에요.',
  'help.guide.tour-walk-sights.step.3':
    '‘투어 경로 주변 검색’을 클릭하세요. 이름 앞 별은 ‘하이라이트’, 이 지역에서 가장 잘 알려진 곳이에요.',
  'help.guide.tour-walk-day-times.goal':
    '산책하는 날 각 정차 지점에 언제 도착하는지, 그때 문을 닫는 곳은 어디인지 알아봐요.',
  'help.guide.tour-walk-day-times.tip.4':
    '하루에 산책이 두 개라면: ‘계획’ 탭에서 둘 사이 구간(‘이동 수단 변경’)을 클릭하고 ‘대중교통’을 고르세요. 첫 산책이 끝나는 곳과 시각에서 검색을 시작하고, 다음 산책 시작 뒤에 도착하는 연결이면 경고해 줘요.',
  'help.guide.tour-walk-google-import.tip.1':
    '도보로 계획한 경로만 읽어요. 공유하기 전에 Google Maps를 도보로 바꾸세요.',
  'help.guide.tour-walk-check-off.step.3': '본 곳에는 ‘방문함으로 표시’를, 건너뛸 곳에는 ‘건너뛰기’를 클릭하세요.',
  'help.ctx.trip-tour-bike.bullet.1':
    '‘투어 유형’ 아래 ‘프로필’로 라우터가 어떤 라이딩에 맞춰 계획할지 정해요: ‘투어링’, ‘로드’, ‘그래블’, MTB. 그 아래 줄에 라우터가 찾는 길이 나오고, 바꾸면 경로 전체를 다시 계획해요.',
  'help.guide.tour-bike-profile.step.3':
    '‘프로필’에서 ‘투어링’, ‘로드’, ‘그래블’, MTB 중 하나를 고르세요. 그 아래 줄에 그 프로필에서 라우터가 찾는 길이 나와요.',
  'help.guide.tour-bike-profile.tip.4': '투어에 이름이 있고 경로와 고도 계산이 끝나야 ‘저장’이 활성화돼요.',
  'help.guide.tour-bike-surfaces.result':
    '지도에 고른 줄의 구간이 표시되고, 경로의 노면을 알 수 있어요. 투어 자체는 바뀌지 않아요.',
  'help.guide.tour-bike-mtb-grades.step.2':
    '‘노면과 길’ 카드에서 ‘트레일 난이도 (mtb:scale)’를 보세요: ‘S0, 특별한 어려움 없음’부터 ‘S4 이상, 전문가 지형’까지 경로 비율이 나와요.',
  'help.ctx.trip-tour-ski.summary':
    '‘투어’ 탭의 ‘스키와 겨울’ 유형 투어예요: 슬로프에서의 하루, 크로스컨트리 순환 코스, 스키 투어, 스노슈, 겨울 산책. 구간은 OpenStreetMap에 있는 슬로프, 리프트, 코스를 따르고, 슬로프 라우터가 내 종목과 제한에 맞춰 계획해요. 기록한 스키 트랙은 종목과 함께 가져와요.',
  'help.guide.tour-ski-plan.step.1': '‘투어’ 탭에서 왼쪽 레일 맨 위 ‘새 투어 계획’을 클릭하세요.',
  'help.guide.tour-ski-plan.tip.3': '나중에 종목을 바꿔도 지점은 그대로 두고, 그 종목의 옵션으로 구간을 다시 계획해요.',
  'help.guide.tour-ski-options.step.4':
    '스위치를 쓰세요: ‘리프트 이용’, ‘프리라이드 경로 허용’, ‘필요하면 리프트로 하산’, ‘추정 연결 피하기’. ‘크로스컨트리’에는 ‘정설된 트레일만’과 ‘조명 있는 트레일만’이, ‘산악 스키’에는 ‘슬로프 가장자리로 오르기’가 더해져요.',
  'help.guide.tour-ski-fix-leg.step.1':
    '라우터가 계획하지 못한 구간은 지점 아래에 이유와 함께 빨간 줄로 보여요. 예를 들어 ‘제외한 리프트만 이 지점들을 잇습니다’와 해당 슬로프나 리프트가 나와요.',
  'help.guide.tour-ski-summary.title': '스키 투어의 슬로프 경로 보기',
  'help.guide.tour-ski-summary.tip.4': '카드 아래쪽에 스키장 이름과 투어를 계획할 때 쓴 지도 데이터 날짜가 나와요.',
  'help.guide.tour-ski-pistes-layer.tip.2':
    '슬로프를 더 불러오지 못하면 스위치에 경고 표시가 생겨요. 지도와 경로는 그대로 쓸 수 있어요.',
  'help.guide.tour-ski-import.step.4': '‘투어 1개 가져오기’를 클릭하세요.',
  'help.ctx.trip-tour-paddle.summary':
    '강이나 호수에서 하는 카약, 카누, SUP 투어예요. 배와 수역을 정하고, TREK에 데이터가 있는 곳에서는 물길을 따르며, 육상 운반과 갑문을 시간에 넣고, 패들링하는 날의 바람과 경로 장애물 정보를 보여 줘요.',
  'help.guide.tour-paddle-setup.goal':
    '카약, 카누, SUP 투어를 시작하고, 무엇을 타고 어떤 물에서 얼마나 빨리 갈지 정해요.',
  'help.guide.tour-paddle-setup.tip.1':
    '‘배’를 ‘기타’로 정하면 제안 속도가 없어요. 속도를 입력하지 않으면 물 위 시간이 비어 있어요.',
  'help.guide.tour-paddle-water-route.step.2':
    '구간 하나를 물길로 계획하려면 그 앞 정차 지점을 가리키고 점 세 개 ‘작업 더 보기’를 클릭하세요.',
  'help.guide.tour-paddle-water-route.result':
    '모든 구간이 물길을 따르거나 의도적으로 손으로 그려졌고, TREK가 계획하지 못한 구간에는 이유가 나와요.',
  'help.guide.tour-paddle-portage.tip.1':
    '그래도 그 구간을 패들링하려면 지점의 ‘작업 더 보기’를 다시 열고 ‘이 구간 다시 패들링’을 고르세요. 다시 손으로 그린 구간이 돼요.',
  'help.guide.tour-paddle-lock.step.3': '갑문 카드를 클릭해 여세요.',
  'help.guide.tour-paddle-time.step.1':
    '‘시간 추정’은 왼쪽 열 웨이포인트 아래에 있어요. 헤더의 배지는 휴식을 포함한 총시간이에요.',
  'help.guide.tour-paddle-time.result': '추정치는 입력한 값으로 계산하고, 아직 빠진 항목을 알려 줘요.',
  'help.guide.tour-paddle-wind.tip.2':
    '여러 날 투어는 카드 헤더에 날마다 칩이 있어요. 하나를 클릭하면 그날 예보가 보여요.',
  'help.guide.tour-paddle-checklist.step.3':
    '항목은 경로 순서대로 나와요: OpenStreetMap의 보, 갑문, 급류, 입수 지점, 통행 규칙, 그리고 ‘내 계획’으로 표시된 내가 넣은 육상 운반과 갑문.',
  'help.guide.tour-paddle-checklist.result': '경로의 모든 항목을 결정했고, 안전 안내도 읽었어요.',
  'help.guide.tour-paddle-track-marks.step.6': '‘갑문’을 클릭한 다음, 선에서 갑문이 있는 곳을 클릭하세요.',
  'help.ctx.trip-tour-horse.bullet.1':
    '편집기에서 ‘투어 유형’을 ‘승마 투어’로 정하면 왼쪽 열에 ‘승마 루트’ 카드가 생겨요. ‘지도 화면에서 찾기’로 지도에 보이는 루트가 나와요.',
  'help.guide.tour-horse-plan.step.2':
    '‘투어 이름’ 아래 ‘투어 유형’ 칸을 클릭하고 ‘승마 투어’를 고르세요. ‘웨이포인트’ 아래에 ‘승마 루트’ 카드가 생겨요.',
  'help.guide.tour-horse-plan.tip.2':
    'TREK는 승마 시간을 계산하지 않아요. 그날 일정에 시간을 넣고 싶다면 ‘상세 정보’의 ‘예정’에 입력하세요.',
  'help.guide.tour-horse-gap.step.3':
    '‘구간 가져오기’를 클릭하세요. 스위치를 켜기 전에는 버튼이 회색으로 비활성화돼 있어요.',
  'help.guide.tour-horse-recorded.step.1':
    '‘이 여행의 투어’에서 ‘투어 추가’(+)를 클릭하고 ‘GPX 또는 KML 가져오기’를 고른 뒤 승마 파일을 선택하세요.',
  'help.guide.dateless-trip.title': '날짜 없이 여행 계획하기',
  'help.guide.trip-reminder.step.2':
    '‘리마인더’에서 1일, 3일, 9일 중 하나를 고르세요. 다른 기간을 원하면 ‘직접 설정’을 클릭하고 1~30 사이 일수를 입력하세요.',
  'help.guide.upcoming-reservations.title': '다음 예약으로 바로 가기',
  'help.guide.half-company-holiday.title': '회사 반일 휴일 표시하기',
  'help.guide.edit-holiday-calendar.step.2':
    '색 네모를 클릭해 새 색을 고르거나, 새 레이블을 입력하고 Enter를 누르세요.',
  'help.guide.person-color.step.1': '‘인원’ 카드에서 이름 앞의 색 점을 클릭하세요.',
  'help.guide.answer-fusion-request.title': '퓨전 요청에 답하기',
  'help.guide.log-for-partner.title': '함께 계획하는 사람의 휴가 기록하기',
  'help.guide.dissolve-fusion.title': '함께 계획하기 그만두기',
  'help.guide.country-places.goal':
    'TREK가 국가로 집계한 장소를 보면서, 그곳에서 한 일을 확인하거나 엉뚱한 국가에 들어간 장소를 찾아요.',
  'help.guide.regions.tip.3':
    '‘버킷 리스트에 추가’는 지역에도 쓸 수 있어요. 버킷 리스트의 국가와 같은 빗금으로 표시돼요.',
  'help.guide.tour-activity-stats.step.2':
    '왼쪽 버튼 두 개로 기간과 유형을 고르세요. ‘기간’에는 ‘전체 기간’, ‘올해’, ‘최근 12개월’, 그리고 투어가 있는 지난 연도들이 있어요. 유형은 숫자를 투어 한 종류로 좁히거나 ‘모든 유형’을 보여 줘요.',
  'help.guide.tour-activity-stats.tip.3':
    '참가자가 지정된 날은 그 사람들에게만 집계되고, 아무도 지정되지 않은 날은 여행의 모든 사람에게 집계돼요. 이 탭은 실시간 데이터를 불러와서 인터넷 연결이 필요해요.',
  'help.guide.move-to-list.goal': '장소를 목록 사이에서 옮기거나 다른 목록에 복사해서 목록을 정리해요.',
  'help.guide.accept-list-invite.result':
    '목록이 레일의 ‘공유됨’ 아래에 생기고, 장소와 함께 열려요. 멤버가 바꾼 내용은 실시간으로 보여요.',
  'help.guide.tour-collection-add-to-trip.step.1':
    '목록을 여세요. 저장한 투어는 장소 위 맨 앞 줄에 있어요. 투어의 ‘여행에 추가’를 클릭하거나 줄을 클릭하세요.',
  'help.guide.tour-collection-manage.title': '저장한 투어 찾고 삭제하기',
  'help.guide.tour-collection-manage.result': '투어가 목록에서 빠지고, 짧은 메시지로 알려 줘요.',
  'help.guide.entry-draft.title': '항목을 초안으로 두기',
  'help.guide.journey-map-layers.step.1':
    '지도 위쪽 레이어 바에 ‘계획’, ‘기록’, ‘항목’, ‘사진’이 각각 개수와 함께 있어요. 클릭하면 숨기거나 보여요.',
  'help.guide.journey-keep-route.step.1': '날 헤더에서 Dawarich 버튼 ‘기록 가져오기’를 클릭하세요.',
  'help.guide.journey-day-stays.step.1':
    '검토할 방문 기록이 있는 날은 ‘Dawarich에서 방문 4개’ 같은 줄과 시간 범위로 끝나요. 클릭하면 방문 기록이 보여요.',
  'help.guide.journey-take-over-day.step.1':
    '그날 방문 기록 줄 끝의 ‘하루 가져오기’를 클릭하거나, 날 헤더에서 대기 중인 방문 수가 보이는 목록 버튼을 클릭하세요.',
  'help.guide.journey-auto-prepare.goal': '여행 중에 날마다 방문 기록을 자동으로 정리해 검토할 수 있게 해요.',
  'help.guide.photo-location.goal': '항목마다 장소를 검색하지 않고도 지도에 표시해요.',
  'help.ctx.settings-about.bullet.1': '제목 옆에 이 서버의 버전이 보여요.',
  'help.guide.readability.tip.3':
    '가독성은 ‘실험적’ 기능이에요. 이상하게 보이면 탭 맨 아래 ‘기본값으로 초기화’를 클릭해 기본 설정으로 되돌리세요.',
  'help.guide.web-push-device.goal': 'TREK를 닫아 둬도 휴대폰이나 컴퓨터에서 TREK 알림을 받아요.',
  'help.guide.connect-airtrail.tip.2':
    '키는 암호화되어 저장되고 다시 보이지 않아요. 칸에 점이 보이면 저장된 키가 있다는 뜻이에요.',
  'help.guide.connect-dawarich.tip.2':
    '버튼 아래에 TREK가 마지막으로 확인한 시각과 내 Dawarich 버전이 지원하지 않는 기능이 나와요.',
  'help.guide.tour-connect-wanderer.tip.2':
    '사설 주소에 있는 인스턴스라면 관리자가 내부 네트워크를 허용해야 할 수 있어요.',
  'help.guide.tour-wanderer-watch.tip.2':
    '‘일시 중지됨’과 날짜가 보이면 wanderer가 응답하지 않은 거고, ‘토큰 거부됨’은 연결 테스트를 성공하거나 새 토큰이 필요하다는 뜻이에요.',
  'help.guide.plugin-settings.result':
    '플러그인이 내 설정으로 동작하고, 나 대신 한 작업이 모두 ‘플러그인 활동’에 나와요.',
  'help.ctx.admin-defaults.bullet.3':
    '설정한 칸 옆의 초기화 링크로 TREK 기본값으로 되돌려요. 사용자가 직접 정한 설정이 항상 우선이에요.',
  'help.ctx.admin-settings.bullet.5': '‘위험 구역’: ‘JWT 시크릿 교체’는 나를 포함한 모든 사용자를 로그아웃시켜요.',
  'help.guide.default-user-settings.step.1':
    '‘기본 사용자 설정’에서 ‘색상 모드’(‘라이트’, ‘다크’, ‘자동’), ‘온도 단위’, ‘거리 단위’, ‘시간 형식’, ‘주 시작 요일’, ‘표시 통화’를 고르고, ‘예약 코드 흐리게’를 켤지 끌지 정하세요. 고르는 즉시 저장돼요.',
  'help.guide.admin-passkeys.step.2':
    'trek.example.org 같은 ‘Relying Party ID (도메인)’와 TREK에 접속하는 주소인 ‘허용된 오리진’을 입력하고 ‘저장’을 클릭하세요. 둘 다 비워 두면 APP_URL을 써요.',
  'help.guide.rotate-jwt-secret.title': '모두 한 번에 로그아웃시키기',
  'help.guide.notification-defaults.step.2':
    '칸을 클릭하면 다음 상태로 바뀌어요: 켜짐, ‘끔’, ‘차단’. 툴팁에 다음 상태가 나오고, 클릭할 때마다 바로 저장돼요.',
  'help.ctx.notifications.bullet.2':
    '맨 위 ‘전체’와 ‘읽지 않음’으로 모든 알림과 읽지 않은 알림만 보기를 오가요. 스크롤하면 목록을 더 불러와요.',
  'help.guide.read-notifications.step.3':
    '알림 아래 버튼(예: ‘Vacay 보기’)을 클릭하면 관련 화면이 열려요. 읽음으로도 표시돼요.',
  'help.guide.filter-notifications.step.3':
    '‘읽지 않음’을 클릭하면 읽지 않은 알림만 보여요. ‘전체’로 다시 모두 보여요.',
  'help.guide.mark-notifications-read.tip.2':
    '읽음으로 표시하면 배경색과 개수만 바뀌어요. 알림은 삭제하기 전까지 목록에 남아요.',
  'help.guide.delete-notifications.result': '알림이 목록과 벨에서 사라져요.',
  'help.guide.notification-settings.result': '‘설정’의 ‘알림’이 열리고, 이벤트와 채널마다 스위치가 있어요.',
  'help.guide.link-journal.goal': '내 Journey 하나를 고른 사람들에게 여행 안에서 보여 줘요.',
  'help.guide.link-journal.tip.3':
    '나중에 ‘여행 설정’의 Journey에서 ‘접근 권한 편집’, ‘저널 변경’, ‘연결 해제’를 할 수 있어요. 연결을 해제하면 탭이 사라지지만, Journey에서 직접 추가한 사람은 접근 권한을 유지해요.',
  'help.guide.dawarich-stays.result':
    '방문 기록이 고른 날 또는 ‘미계획’에 여행 장소로 들어가고, 패널에 처리 완료로 표시돼요.',
  'help.ctx.trip-days.bullet.7': '여행이 진행 중이면 계획이 오늘 날짜로 열리고 그 위치로 스크롤돼요.',
  'help.guide.leave-stop-off-route.tip.2':
    '‘날에서 제거’는 들를 곳을 그날에서 빼고, ‘경로에서 제외’는 계획에 남겨 둬요.',
  'help.guide.move-booking-day.goal': '양식을 열지 않고 계획에서 바로 교통이나 예약을 다른 날로 옮겨요.',
  'help.guide.place-image-from-file.result': '그 사진이 카드, 장소 열, 날, 지도에서 장소 사진으로 보여요.',
  'help.guide.place-own-hours.step.3':
    '그 아래 ‘영업 시간’에 한 주가 요일마다 한 줄로 보여요. TREK가 영업시간을 찾았다면 이미 채워져 있고, 아니면 먼저 ‘영업시간 추가’를 클릭하세요. 요일마다 여는 시간과 닫는 시간을 입력하고, 쉬는 날에는 ‘종료됨’을 클릭하세요.',
  'help.guide.add-accommodation.tip.5': 'GPX 트랙과 투어 장소는 숙소로 나오지 않고, 여행의 일반 장소만 나와요.',
  'help.guide.confirm-stay-booking.step.1':
    '체크인하는 날을 여세요. 숙박 카드의 ‘예약’ 아래에 그날 밤의 호텔 예약이 ‘대기 중’ 또는 ‘확정됨’으로 보여요. 그 상자를 클릭하세요.',
  'help.guide.tour-map-lines.step.4':
    '지도에서 투어를 숨기려면 오른쪽 열을 ‘투어’로 바꾸고 투어를 가리켜 눈 아이콘 ‘지도에서 숨기기’를 클릭하세요. 선과 핀이 지도에서 사라지고, 줄은 목록에 흐리게 남아요. 사선이 그어진 눈 ‘지도에 표시’를 누르면 다시 보여요.',
  'help.guide.car-stops.step.1': '차를 받는 날의 헤더에서 툴팁이 ‘날에 추가’인 +를 클릭하고 ‘교통 추가’를 고르세요.',
  'help.guide.car-stops.tip.2': '‘위로 이동’과 ‘아래로 이동’은 경유지가 두 곳 이상일 때만 보여요.',
  'help.guide.transport-details.title': '교통을 열고 상세 정보 활용하기',
  'help.guide.transport-details.tip.1': '선이 그려진 이동에서 ‘지도에서’를 다시 누르면 선이 꺼져요.',
  'help.guide.export-transports-csv.result':
    '브라우저가 여행 이름을 딴 파일(예: autumn-in-japan-transports.csv)을 저장해요. 이동마다 한 줄로 ‘유형’, ‘제목’, ‘상태’, ‘시작’, ‘종료’, 출발지, 도착지, ‘위치’, ‘확인’, ‘메모’가 들어 있어요.',
  'help.guide.group-sort-bookings.goal': '카드나 목록을 상태, 날, 유형별로 원하는 순서대로 정리해요.',
  'help.guide.booking-on-map.tip.1':
    '‘지도에서’는 장소가 있는 예약에만 있어요. 양식의 ‘장소 / 활동’에서 장소를 고르면 버튼이 생겨요.',
  'help.guide.export-bookings-csv.step.2':
    '보기 아이콘 뒤 슬라이더 ‘보기 옵션’을 열고 ‘정렬’에서 순서를 고르세요. 줄은 그 순서를 따르고, 예약마다 한 줄이며 구역 구분은 없어요.',
  'help.guide.edit-booking.tip.4':
    '무언가 바꾼 뒤 양식 바깥을 클릭하거나 Esc를 누르면 ‘변경 사항을 버릴까요?’라고 물어요. ‘계속 편집’을 누르면 양식으로 돌아가요.',
  'help.guide.arrange-packing-list.step.2':
    '목록 안에서는 줄 왼쪽의 손잡이로 항목을 위아래로 끌어요. 줄 왼쪽 끝에 강조 색 선이 놓일 자리를 보여 줘요.',
  'help.guide.count-packed-pieces.goal': '항목에 수량을 정하고, 챙긴 개수를 하나씩 표시해요.',
  'help.guide.count-packed-pieces.tip.3': '수량이 1이면 카운터 없이 체크박스만 있어요.',
  'help.guide.expense-receipts.step.2':
    '‘영수증 및 청구서’ 옆의 ‘첨부’를 클릭하고 사진이나 PDF를 고르세요. 여러 개를 한 번에 골라도 돼요. 파일마다 제목 아래에 휴지통과 함께 나와요.',
  'help.guide.files-sync-settings.goal':
    '문서를 저장소에서 가져오기만 할지, 내보내기만 할지, 양방향으로 할지, 그리고 문서를 삭제하거나 양쪽에서 바꿨을 때 어떻게 할지 정해요.',
  'help.guide.files-sync-settings.tip.2':
    '‘물어보기’를 고르면 양쪽에서 편집한 문서는 카드 아래 ‘확인이 필요합니다’에서 기다려요. ‘해결’을 클릭하고 ‘TREK 버전 유지’, ‘저장소 버전 유지’, ‘둘 다 유지’ 중 하나를 고르세요.',
  'help.guide.manage-notes.goal': '메모를 전체로 열어 보고, 중요한 메모는 맨 위에 두고, 지난 내용은 고치거나 삭제해요.',
  'help.guide.manage-notes.tip.2':
    '편집 중 이미 첨부된 파일의 빨간 X를 누르면 ‘저장’을 누르기 전이라도 바로 삭제되고, 휴지통으로 가지 않아요. 메모의 모든 파일은 여행의 ‘파일’ 탭에도 보여요.',
  'help.guide.note-categories.step.6':
    '‘메모’ 카드로 돌아오면 헤더 아래 버튼으로 카드를 걸러요. 카테고리를 클릭하면 그 메모만 보이고, ‘전체’나 같은 버튼을 다시 누르면 모두 보여요.',
  'help.guide.roadtrip-reorder.tip.1': '여기서 들를 곳을 옮기면 일정에서도 옮겨져요. ‘일’에도 같은 순서가 보여요.',
  'help.guide.roadtrip-overnight.step.1':
    '‘경로 중간’의 ‘찾는 항목’에서 ‘숙박’을, 캠핑 자리라면 ‘캠핑장’을 체크하고, 멈출 날을 고른 뒤 ‘검색’을 클릭하세요.',
  'help.guide.roadtrip-overnight.tip.3':
    '‘주행 설정’의 ‘경로 선’에서 ‘매일 숙소에서 시작하고 숙소에서 끝내기’를 켜 두면, 다음 날 운전은 잔 곳에서 출발해요.',
  'help.guide.roadtrip-stop-fill.title': '들를 곳 하나의 충전량 정하기',
  'help.guide.roadtrip-bookings.title': '항공편, 기차, 페리를 주행에 넣기',
  'help.guide.roadtrip-bookings.tip.2':
    '들를 곳에서 예약한 테이블이나 티켓은 그곳에 버튼으로 보이고, 어느 들를 곳에도 속하지 않은 예약은 ‘이날의 다른 예약’에 나와요.',
  'help.guide.roadtrip-google-import.step.3':
    '찾은 정차 지점을 확인하세요. 각각 위치가 나오고, 위치를 확인하지 못한 지점은 건너뛰어요.',
  'help.guide.roadtrip-hazards.step.1': '오른쪽 열에서 ‘주행 설정’을 여세요.',
  'help.ctx.trip-tours.summary':
    '‘계획’ 탭의 오른쪽 열을 투어 모드로 바꾼 화면이에요: 여행의 모든 투어가 날 옆에 목록으로 나와요. 여기서 투어를 날에 넣고, 목록을 걸러 보고, 지도에서 선을 숨기고, GPX나 KML 파일을 가져와요. 경로를 그리고 고치는 일은 ‘투어’ 탭에서 해요.',
  'help.guide.tour-show-list.goal': '장소 열 대신 여행의 투어를 보여 줘서 날 옆에서 보고 고를 수 있게 해요.',
  'help.guide.tour-show-list.tip.3':
    '투어 애드온이 켜져 있으면 트랙은 장소 목록에 나오지 않아요. 가져온 트랙은 모두 투어가 되어 여기에 나와요.',
  'help.guide.tour-add-to-day.step.5':
    '구간이 있는 투어는 같은 메뉴에서 이어서 물어봐요. ‘이날부터 구간별로’는 1구간을 그날에, 다음 구간을 그다음 날에 차례로 넣고, ‘이날 전체 투어’는 전부를 그 하루에 넣어요.',
  'help.guide.tour-day-times.step.1':
    '날 열에서 투어 줄을 가리키고 ‘추가 옵션’(점 세 개)을 클릭한 뒤 ‘편집’을 고르세요.',
  'help.guide.tour-day-times.result':
    '투어가 시간 있는 다른 들를 곳처럼 시작과 종료 시간과 함께 그날 타임라인에 들어가요.',
  'help.guide.tour-remove-from-day.result': '그날에서 투어가 빠지고, 목록의 줄에서도 날 배지가 사라져요.',
  'help.guide.tour-filter-list.tip.2':
    '투어끼리 차이가 있는 항목만 구역으로 보여서, 짧은 목록에는 ‘상태’만 있을 수도 있어요.',
  'help.guide.tour-hide-on-map.tip.1':
    '숨기기는 나에게만 적용되고, 이 여행에 대해 이 브라우저에 저장돼요. 투어와 날짜, 색은 바뀌지 않고, 다른 사람의 지도에서는 계속 보여요.',
  'help.guide.tour-import-plan-tab.tip.1':
    '이미 여행에 있는 트랙은 ‘이미 여행에 있음’으로 표시되고 두 번 가져오지 않아요.',
  'help.ctx.trip-tour-detail.bullet.4':
    '맨 아래 줄: 날이 열려 있으면 ‘날에 추가’ 또는 ‘날에서 제거’, 출발점까지 ‘내비게이션’, 투어 웹 페이지, GPX, 기기가 파일을 공유할 수 있으면 ‘공유’, ‘컬렉션’, ‘복사’.',
  'help.guide.tour-detail-read.step.5':
    '그 아래에 측정값이 나와요: ‘거리’, ‘최저 고도’, ‘최고 고도’, ‘누적 상승 고도’, ‘누적 하강 고도’, 그 아래 시간, 그리고 투어 선 색으로 그린 고도 그래프.',
  'help.guide.tour-detail-read.result':
    '계획 옆에 투어 카드가 열려 있고, 어느 날에 들어 있는지, 얼마나 길고 가파른지, 어디서 왔는지 알 수 있어요.',
  'help.guide.tour-rename-colour.tip.2': '연필과 색 점은 장소를 편집할 수 있는 멤버만 쓸 수 있어요.',
  'help.guide.tour-take-along.tip.2':
    '‘설정’에서 자주 쓰는 지도 앱을 고르면 ‘내비게이션’이 목록 없이 그 앱을 바로 열어요.',
  'help.guide.tour-copy-keep.step.3': '다른 여행에서도 쓰려면 투어를 열고 카드 아래쪽 ‘컬렉션’을 클릭하세요.',
  'help.guide.tour-packing-link.goal':
    '여행의 짐 목록이나 그 안의 목록에서 투어에 챙길 것을 투어 카드에 바로 보여 줘요.',
  'help.guide.tour-packing-link.tip.3':
    '연결하려면 장소 편집 권한이 필요해요. 다른 사람은 연결된 목록을 볼 수는 있지만 연결을 바꿀 수는 없어요.',
  'help.guide.tour-files.tip.2': '‘업로드’는 투어를 수정하고 파일을 추가할 수 있는 멤버에게만 보여요.',
  'help.guide.tour-activity-link.step.5': '이제 트랙이 ‘실제 트랙’에 자체 값과 그래프로 계획 옆에 나와요.',
  'help.guide.tour-activity-compare.step.2':
    '‘계획에서 가장 먼 거리’는 트랙과 계획한 선 사이 최대 거리를, ‘계획 이탈’은 트랙 중 얼마나 그 선을 벗어났는지 보여 줘요.',
  'help.guide.tour-origin-check.step.1':
    '투어 카드를 열고 ‘출처’까지 스크롤하세요. ‘출처’에 어디서 왔는지 나와요: 파일 이름이 있는 ‘GPX 가져오기’, KML 또는 KMZ 가져오기, 또는 주소가 있는 wanderer.',
  'help.ctx.trip-tour-planner.summary':
    '여행의 투어 플래너예요: 왼쪽에 편집기, 오른쪽에 여행의 모든 투어, 그 사이에 지도가 있어요. 여기서 지점을 하나씩 찍어 투어를 그리고, 실제 길과 도로를 따라 경로를 계산하고, 상세 정보를 넣어 여행에 저장해요.',
  'help.guide.tour-open-workspace.goal': '투어 플래너를 열고 각 부분이 무엇을 하는지 알아봐요.',
  'help.guide.tour-open-workspace.tip.1':
    '각 레일 안쪽 가장자리 탭의 ‘접기’로 레일을 숨기면 지도가 넓어져요. ‘계획’과 ‘이 여행의 투어’로 레일을 다시 열어요. 레일 가장자리를 끌면 폭이 바뀌어요.',
  'help.guide.tour-draw-route.step.3':
    '‘웨이포인트’의 ‘지점 추가’가 켜져 있는지 확인하고(지도 버튼의 ‘지점 찍기’와 같은 스위치예요), 지도에서 투어가 시작할 곳을 클릭하세요.',
  'help.guide.tour-draw-route.result':
    '지도에 번호가 붙은 경로가, ‘웨이포인트’에 지점이 생겼어요. 이제 이름을 붙여 저장하면 돼요.',
  'help.guide.tour-type-profile.tip.2':
    '어떤 유형은 저장 전에 더 입력해야 해요: ‘달리기’는 ‘계획 페이스’, ‘패들 투어’는 배와 수역, ‘스키와 겨울’ 투어는 종목.',
  'help.guide.tour-edit-points.step.5': '옆의 휴지통 ‘지점 삭제’로 지점을 투어에서 빼요.',
  'help.guide.tour-shaping-points.step.2':
    '점을 경로가 지나야 할 길 위로 끌어다 놓으세요. 그 점을 지나도록 경로를 다시 계획해요.',
  'help.guide.tour-loop-reverse.goal': '투어가 출발점에서 끝나게 하거나 방향을 뒤집어요.',
  'help.guide.tour-leg-by-hand.title': '구간을 손으로 그리거나 다시 계획하기',
  'help.guide.tour-leg-by-hand.result':
    '구간이 원하는 곳을 지나는 직선이 되어 손으로 그린 구간으로 표시되거나, 다시 경로가 계산돼요.',
  'help.guide.tour-trip-places.tip.2':
    '정차 지점을 삭제하거나 연결을 해제해도 장소는 날짜까지 포함해 여행에 그대로 남아요.',
  'help.guide.tour-details-times.step.4':
    '‘예정’에 총시간이 보여요. 직접 입력하면 그 값이 대신 쓰이고, ‘직접 입력’으로 표시돼요.',
  'help.guide.tour-save.step.2':
    '‘새 투어’ 옆의 점이 사라질 때까지 기다리세요. 저장하려면 경로와 모든 고도 계산이 끝나야 해요.',
  'help.guide.tour-edit-saved.goal': '전에 계획한 투어를 열어 수정하고 다시 저장해요.',
  'help.guide.tour-edit-saved.result': '저장된 투어에 변경 사항이 반영됐어요.',
  'help.guide.tour-summary-profile.tip.2': '비아 페라타를 오르는 경로에는 수치 위에 등급이 적힌 경고 배지가 붙어요.',
  'help.guide.tour-list-manage.step.4':
    '‘여행 합계’ 위의 버튼이 필터예요. 표시 중인 상태(처음에는 ‘전체’)와 투어 수가 보여요.',
  'help.guide.tour-delete.step.1':
    '‘이 여행의 투어’에서 투어를 가리키고 줄 오른쪽의 휴지통(투어 이름과 함께 ‘삭제’)을 클릭하세요.',
  'help.guide.tour-saved-elsewhere.step.1':
    '편집 중에 레일 맨 위에 ‘이 투어가 다른 곳에서 저장되었습니다’가 나타나요. 결정할 때까지 내 변경은 그대로 남아요.',
  'help.ctx.trip-tour-import.summary':
    '다른 곳에 이미 있는 투어를 여행으로 가져와요: 시계나 앱의 GPX, KML, KMZ 파일, 내 다른 여행의 투어, 내 wanderer의 트레일. 가져온 투어는 기록된 그대로 남고, 그걸 바탕으로 편집 가능한 버전을 계획할 수 있어요.',
  'help.guide.tour-import-gpx.step.1':
    '여행의 ‘투어’ 탭을 여세요. 오른쪽 ‘이 여행의 투어’ 맨 위의 +(‘투어 추가’)를 클릭하세요.',
  'help.guide.tour-import-gpx.tip.4':
    'KML이나 KMZ 파일은 선 말고 무엇이 들어 있었는지(핀, 영역, 기타 항목)도 ‘가져오지 않음’에 보여 줘요.',
  'help.guide.tour-view-import.tip.1':
    '가져온 투어는 지점별로 편집할 수 없어요. 위쪽 ‘편집 가능한 버전’ 카드의 ‘편집 가능한 버전 계획’으로 수정할 수 있는 투어를 만들어요.',
  'help.guide.tour-plan-from-import.step.3':
    '‘가져온 항목 바꾸기’를 클릭하면 이 투어를 그 자리에서 다시 계획해요: 날짜와 메모는 유지되고, 기록된 트랙도 보관돼서 되돌릴 수 있어요. ‘새 투어로 계획’은 가져온 투어는 그대로 두고 옆에 두 번째 투어를 만들어요.',
  'help.guide.tour-restore-recorded.goal': '가져온 투어를 다시 계획한 것을 되돌려, 한참 뒤에도 원래 트랙을 되찾아요.',
  'help.guide.tour-take-over.goal': '내 다른 여행에서 이미 계획하거나 가져온 투어를 다시 그리지 않고 써요.',
  'help.guide.tour-take-over.tip.2':
    '내 다른 여행만, 그리고 처음 100개 투어만 나와요. 나머지는 검색이나 필터로 찾으세요.',
  'help.guide.tour-import-wanderer.step.4': '‘여행으로 가져오기’를 클릭하세요.',
  'help.ctx.trip-tour-map.bullet.1':
    '지도 왼쪽 아래 버튼에 열린 투어 유형이 지원하는 기본 지도가 있어요: ‘지도’, ‘지형도’, 하이킹이면 ‘하이킹’, 자전거 투어면 ‘자전거’, ‘위성 사진’. 여기서 고른 지도는 플래너에만 적용되고 ‘설정’의 지도 설정은 바뀌지 않아요.',
  'help.guide.tour-map-layers.step.2':
    '‘지형도’를 클릭하면 등고선과 음영 기복으로 땅이 얼마나 가파른지 보여 줘요. 고른 지도는 버튼에서 강조된 채로 있어요.',
  'help.guide.tour-along-search.step.1':
    '‘투어’ 탭에서 투어를 열고, 왼쪽 패널을 정차 지점 아래 ‘투어 경로 주변’까지 스크롤하세요. 투어에 경로가 생기면 이 카드가 나와요.',
  'help.guide.tour-along-search.tip.3':
    '결과는 OpenStreetMap과 TREK 장소 인덱스에서 가져와서 인터넷 연결이 필요해요. 아무것도 없으면 ‘넓히기’로 다음 거리까지 찾고, 서버가 바쁘면 ‘다시 시도’에 다시 시도할 수 있을 때까지 남은 시간이 보여요.',
  'help.guide.tour-along-add-stop.tip.1':
    '그 장소는 여행 장소가 아니라 투어의 정차 지점이 돼서, 장소 목록에는 나오지 않아요.',
  'help.guide.tour-3d-terrain.step.4':
    '‘음영 지형’ 슬라이더를 끌면 언덕을 최대 세 배까지 높게 보여 줘요. 완만한 지형에서 유용해요.',
  'help.guide.tour-3d-flyover.step.1':
    '투어를 3D로 바꾸세요. 경로 주변 지형을 불러오는 동안 재생 버튼 자리에 링이 차오르고, 다 차면 ‘비행 재생’을 클릭하세요. 카메라가 경로 위의 점을 따라가고, ‘투어 요약’ 고도 그래프의 커서도 함께 움직여요.',
  'help.guide.tour-map-overlays.title': '지도에 슬로프나 항로 표지 표시하기',
  'help.guide.tour-map-overlays.tip.2':
    '투어를 열지 않아도 슬로프 스위치가 있어서, 계획하기 전에 스키장을 둘러볼 수 있어요. 하이킹에서는 대신 ‘비아 페라타’ 버튼이 화면 안의 루트 수와 함께 나와요.',
  'help.ctx.trip-tour-stages.bullet.5':
    '투어 줄의 + ‘날에 추가’로 고른 날부터 하루에 한 구간씩 여행에 넣거나, 투어 전체를 그 하루에 넣어요.',
  'help.guide.tour-multi-day.step.6':
    '다시 당일 투어로 만들려면 ‘당일’을 클릭하고 ‘당일 투어로 바꿀까요?’에서 ‘구간 끝 모두 제거’로 확인하세요. 경로는 그대로예요.',
  'help.guide.tour-stages-on-days.step.1': '‘이 여행의 투어’에서 여러 날 투어를 가리키고 + ‘날에 추가’를 클릭하세요.',
  'help.guide.tour-stages-on-days.tip.3':
    '‘계획’ 탭에서 여러 날 투어를 날로 끌어다 놓아도 창에서 같은 것을 물어보고, 투어 카드의 ‘날에 추가’도 마찬가지예요.',
  'help.ctx.trip-tour-hike.bullet.4':
    '웨이포인트 아래 ‘길 정보’는 OpenStreetMap에서 구간마다 SAC 등급, 노면, 길 유형을 보여 주고, 그에 따라 지도의 경로에 색을 입혀요. 이 카드는 투어를 바꾸지 않아요.',
  'help.guide.tour-hike-plan.step.4':
    '‘지점 추가’는 처음부터 켜져 있어요. 지도에서 하이킹 출발점과 도착점을 클릭하세요. 옆의 ‘여행 장소’로 여행의 산장이나 호텔을 고를 수도 있어요. 지점이 두 개가 되면 TREK가 걷는 경로를 계산해요.',
  'help.guide.tour-hike-trail-details.title': '하이킹 경로의 등급, 노면, 길 유형 보기',
  'help.guide.tour-hike-trail-details.tip.1':
    'OpenStreetMap에 값이 없는 길은 ‘알 수 없음’에 나오는데, 알 수 없다고 쉬운 건 아니에요. 일부에 ‘이번에는 조회할 수 없었음’이 보이면 ‘다시 시도’를 클릭하세요.',
  'help.guide.tour-hike-round.step.4':
    '순환 코스를 클릭해 고르세요. 줄에 거리, 오르막, 시간, 그리고 요청한 거리와의 차이가 보여요.',
  'help.guide.tour-hike-compare-ways.step.1':
    '구간이 시작하는 정차 지점을 가리키고, 줄의 ‘작업 더 보기’를 클릭한 뒤 ‘다음 구간의 길 비교’를 고르세요.',
  'help.guide.tour-ferrata-add.title': '하이킹에 비아 페라타 넣기',
  'help.guide.tour-ferrata-add.tip.1':
    '비아 페라타는 장비와 경험이 필요해요. 배지 툴팁에 경로 중 비아 페라타로 오르는 양이 나와요.',
  'help.guide.tour-run-plan.step.3': '‘계획 페이스’를 킬로미터당 분과 초로 입력하세요(예: 7:30).',
  'help.guide.tour-run-ways.title': '달리기 코스의 길 종류 보기',
  'help.ctx.trip-tour-walk.title': '도심 산책',
  'help.guide.tour-walk-plan.goal': '정차 지점마다 머무는 시간과 중요도를 정해 관광 산책을 만들어요.',
  'help.guide.tour-walk-plan.tip.2': '도심 산책에는 하이킹 한도도 ‘휴식’ 칸도 없어요. 대신 머무는 시간이 쓰여요.',
  'help.guide.tour-walk-sights.step.4':
    '목록에서 장소를 클릭하세요. 지도 위에 카드가 열려요. ‘추가할 위치’에서 어느 두 정차 지점 사이에 넣을지 고르세요.',
  'help.guide.tour-walk-day-times.step.1':
    '산책을 날에 넣으세요: ‘이 여행의 투어’에서 줄의 둥근 +(‘날에 추가’)를 클릭하고 날을 고르세요.',
  'help.guide.tour-walk-day-times.result':
    '도착할 때 모든 장소가 문을 열도록 정차 지점 순서를 바꾸거나 머무는 시간을 조정할 수 있어요.',
  'help.guide.tour-walk-google-import.tip.2':
    '‘다른 링크 사용’을 누르면 링크 입력으로 돌아가요. 불러오면 플래너의 저장하지 않은 변경이 대체되는데, 그 전에 창에서 경고해 줘요.',
  'help.guide.tour-walk-check-off.step.4':
    '목록 맨 위에 방문한 정차 지점 수와 남은 걷는 시간이 보여요. 정차 지점의 ‘되돌리기’로 표시를 취소해요.',
  'help.ctx.trip-tour-bike.bullet.2':
    '오른쪽 ‘투어 요약’에 ‘주행 시간(추정)’이 나와요. 오르막을 포함해 프로필에 맞춰 라우터가 계산한 시간이고, 휴식은 빠져요.',
  'help.guide.tour-bike-profile.step.4':
    '‘웨이포인트’에서 ‘여행 장소’를 클릭하고 출발지와 도착지를 고르세요. 여기서는 Hotel Alpenroyal, 그다음 Hotel Greif예요. ‘지점 추가’가 켜져 있는지 확인하고 지도를 클릭해도 돼요. 지점이 두 개가 되면 TREK가 경로를 계산해요.',
  'help.guide.tour-bike-profile.tip.5':
    '관리자가 CyclOSM 지도를 허용하면 자전거 투어를 연 동안 지도 레이어 줄에 ‘자전거’도 생겨요. 불러오지 못하면 ‘지도’로 바꾸세요. 투어는 바뀌지 않아요.',
  'help.guide.tour-bike-surfaces.tip.1':
    '‘데이터 없음’은 OpenStreetMap에 그곳 노면 정보가 없다는 뜻이에요. 노면 상태를 알 수 없을 뿐, 좋다는 뜻은 아니에요.',
  'help.guide.tour-bike-mtb-grades.step.3': '등급 줄을 클릭하면 지도에서 그 트레일이 강조돼요.',
  'help.ctx.trip-tour-ski.bullet.1':
    '‘종목’을 먼저 고르고, 미리 선택된 건 없어요: ‘알파인’, ‘스노보드’, ‘크로스컨트리’, ‘산악 스키’, ‘스노슈’, ‘겨울 하이킹’. ‘크로스컨트리’는 ‘주법’도 물어봐요: ‘클래식’, ‘스케이팅’, ‘알 수 없음’. 종목이 없으면 투어를 저장할 수 없어요.',
  'help.guide.tour-ski-plan.step.2': '‘투어 유형’을 열고 ‘스키와 겨울’을 고르세요.',
  'help.guide.tour-ski-plan.tip.4':
    '슬로프 데이터가 없는 곳은 지점 사이를 직선으로 이어요. 스노슈와 겨울 하이킹은 대신 여름 길을 쓸 수 있고, 구간에 회색 안내가 붙어요.',
  'help.guide.tour-ski-options.step.5':
    '‘제외’에서 타지 않을 리프트 종류를 누르세요: ‘견인 리프트’, ‘오픈 체어리프트’, ‘곤돌라’, ‘케이블카’, ‘푸니쿨라와 기차’. 누른 항목에는 취소선이 그어져요.',
  'help.guide.tour-ski-fix-leg.step.2':
    '줄이 제안하는 해결 방법을 클릭하세요: ‘더 어려운 슬로프 허용’, ‘이 리프트 허용’, ‘리프트로 하산’, ‘주법 바꾸기’, ‘종목 바꾸기’. 옵션이 바뀌고 구간을 다시 계획해요.',
  'help.guide.tour-ski-summary.goal': '하루가 스키, 리프트, 대기, 도보로 어떻게 나뉘는지 봐요.',
  'help.guide.tour-ski-summary.result': '슬로프에서, 리프트에서, 리프트 대기에 하루가 얼마나 걸리는지 알 수 있어요.',
  'help.guide.tour-ski-pistes-layer.tip.3':
    '이 레이어는 지도 데이터일 뿐 실시간 정보가 아니에요. 운영 여부, 정설 여부, 눈 상태, 눈사태는 알려 주지 않아요. 투어를 열지 않아도 스위치가 있어서 계획 전에 스키장을 둘러볼 수 있어요.',
  'help.guide.tour-ski-import.step.5':
    '‘이 여행의 투어’에서 트랙을 클릭해 여세요. 나중에 종목을 고치려면 ‘스키 트랙’ 카드의 ‘변경’을 클릭하세요.',
  'help.ctx.trip-tour-paddle.bullet.1':
    '‘투어 유형’에서 ‘패들 투어’를 고르면 ‘배’(‘카약’, ‘카누’, SUP, ‘기타’)와 ‘수역’(‘강’, ‘호수’)을 물어봐요. 둘 다 골라야 투어를 저장할 수 있어요.',
  'help.guide.tour-paddle-setup.step.1': '‘투어’ 탭에서 왼쪽 열 맨 위 ‘새 투어 계획’을 클릭하세요.',
  'help.guide.tour-paddle-setup.tip.2':
    '패들 투어 지도는 ‘지도’와 ‘위성 사진’, 그리고 겹쳐 보는 OpenSeaMap ‘항로 표지’를 지원해요.',
  'help.guide.tour-paddle-water-route.step.3':
    '‘다음 구간을 물 위로 계획’을 고르세요. TREK가 이 지점부터 다음 지점까지 강이나 호수를 따라 구간을 계획해요.',
  'help.guide.tour-paddle-portage.title': '장애물을 보트를 들고 돌아가기',
  'help.guide.tour-paddle-portage.tip.2':
    '마지막 지점에서는 ‘여기부터 육상 운반’이 다음 지점을 찍을 때 적용돼요. 줄에 ‘여기서부터 운반’이 보이고, 옆의 X ‘운반 취소’로 되돌려요.',
  'help.guide.tour-paddle-lock.step.4': '‘대기’와 ‘통과’ 시간(분)을 입력하세요. 둘 다 넣으면 카드에 합계가 보여요.',
  'help.guide.tour-paddle-time.step.2':
    '띠에 출발부터 도착까지 경로가 보여요: 물길, 갈색 육상 운반 구간, 눈금으로 표시된 갑문. 경로의 장애물은 표시로 나오고, 클릭하면 지도에서 찾을 수 있어요.',
  'help.guide.tour-paddle-wind.title': '패들링하는 날 바람 확인하기',
  'help.guide.tour-paddle-wind.tip.3':
    '호수를 건너는 날 바람이 세면 카드에서 ‘물가 가까이 계획’을 제안해요. 호수 구간을 물가를 따라 계획해요.',
  'help.guide.tour-paddle-checklist.step.4':
    '항목을 클릭하세요. 지도가 그곳으로 이동해요: 장애물이면 내 결정이 담긴 카드가 열리고, 내가 넣은 육상 운반이나 갑문이면 그 지점이 선택돼요.',
  'help.guide.tour-paddle-track-marks.title': '기록된 패들 트랙에 육상 운반과 갑문 표시하기',
  'help.guide.tour-paddle-track-marks.step.7': '카드를 열고 시간(분)을 입력한 뒤 ‘저장’을 클릭하세요.',
  'help.ctx.trip-tour-horse.bullet.2':
    '루트는 별도 창에서 열려요: 구간을 고르고 달리는 ‘방향’을 정한 뒤 ‘말 통행’을 확인하고 ‘구간 가져오기’를 클릭하세요.',
  'help.guide.tour-horse-plan.step.3':
    '‘승마 루트’ 카드에서 ‘지도 화면에서 찾기’를 클릭하세요. 화면 안의 표지판 승마 루트가 모두 길이와 함께 나와요.',
  'help.guide.tour-horse-plan.tip.3':
    '검색한 뒤 지도를 옮겼나요? 버튼이 ‘이 화면 검색’으로 바뀌어요. 화면이 너무 넓으면 먼저 확대하라고 안내해요.',
  'help.guide.tour-horse-gap.step.4':
    '‘웨이포인트’ 카드에 연결 구간이 ‘수동, 확인되지 않음’과 길이로 보여요. 가리키면 이유를 볼 수 있어요.',
  'help.guide.tour-horse-recorded.step.2':
    '‘가져오기 미리보기’가 열려요. 아직 아무것도 저장되지 않았어요. ‘가져올 유형’에서 ‘투어 유형’을 ‘승마 투어’로 정하세요. 배지 세 개가 가져오면서 유지하는 것과 계산하지 않는 것을 알려 줘요.',
  'help.guide.dateless-trip.goal': '언제 떠날지 정하기 전에 계획을 시작해요.',
  'help.guide.trip-reminder.step.3': '‘업데이트’를 클릭하세요.',
  'help.guide.upcoming-reservations.goal': '모든 여행에서 다음 예약을 확인하고, 그 예약이 속한 여행을 열어요.',
  'help.guide.log-day.tip.3': '종일 회사 휴일인 날은 기록할 수 없어요. 회사 반일 휴일에는 휴가가 0.5일만 차감돼요.',
  'help.guide.half-company-holiday.goal': '크리스마스이브처럼 하루 전체를 쉬지 않고 모두에게 오후만 휴무를 줘요.',
  'help.guide.public-holidays.tip.2': '달력에서 공휴일에 마우스를 올리면 이름이 보여요.',
  'help.guide.edit-holiday-calendar.step.3': '목록에서 국가나 지역을 바꾸거나, 휴지통을 클릭해 캘린더를 삭제하세요.',
  'help.guide.person-color.step.2': '색을 고르세요. 바로 저장되고 창이 닫혀요.',
  'help.guide.answer-fusion-request.goal': '나를 초대한 사람과 휴가 계획을 합칠지 정해요.',
  'help.guide.log-for-partner.goal': '내 계획에 퓨전된 사람의 휴가를 대신 입력해요. 예를 들어 그 사람이 부탁했을 때요.',
  'help.guide.dissolve-fusion.goal': '퓨전한 계획을 다시 각자의 계획으로 나눠요.',
  'help.guide.country-places.step.1': '다녀온 국가를 검색해 고르세요. 아래쪽 패널에 국가 카드가 나타나요.',
  'help.guide.tour-activity-stats.step.3':
    '숫자를 확인하세요: 모서리에 투어 수가 적힌 거리, 그다음 ‘누적 상승 고도’와 ‘누적 하강 고도’. ‘모든 유형’에서는 가장 많이 한 유형 세 개가 개수와 거리와 함께 이어서 나와요.',
  'help.guide.move-to-list.step.1': '필터 줄의 체크박스 아이콘 ‘선택’을 클릭하고 장소를 체크하세요.',
  'help.guide.tour-collection-add-to-trip.step.2':
    '‘추가할 여행’에서 여행을 고르세요. 투어를 추가할 권한이 없는 여행은 흐리게 보여요.',
  'help.guide.tour-collection-manage.goal': '목록에 어떤 투어가 있고 어디서 왔는지 보고, 필요 없는 투어는 삭제해요.',
  'help.guide.entry-draft.goal': '지금 항목을 써 두고, 준비될 때까지 공유된 Journey에서는 숨겨요.',
  'help.guide.journey-map-layers.step.2': '바 끝의 (i)를 클릭하면 지도 범례가 나와요. 모든 핀, 점, 선을 설명해 줘요.',
  'help.guide.journey-keep-route.step.2':
    '하루의 시작과 끝을 정하는 ‘이 날의 시간대’를 확인하고, 기록의 거리, 시간 범위, 조각, 빈 구간을 확인하세요.',
  'help.guide.journey-day-stays.step.2':
    '방문 기록에서 ‘일기 작성’을 클릭하세요. 그날 도착 시각에 방문 장소 이름과 위치가 담긴 항목이 추가돼요.',
  'help.guide.journey-take-over-day.step.2':
    '남길 방문 기록을 체크하고 이름을 고치세요. 체크한 두 방문 사이의 ‘하나의 항목으로 합치기’로 둘을 합치고, ‘따로 두기’로 다시 나눠요.',
  'help.guide.journey-auto-prepare.step.1': '헤더 오른쪽 위의 ⋯를 클릭해 ‘Journey 설정’을 여세요.',
  'help.guide.photo-location.step.1': '헤더 오른쪽 위의 ⋯를 클릭해 ‘Journey 설정’을 여세요.',
  'help.guide.share-public.tip.3': '초안은 링크에 절대 보이지 않고, 기록된 경로는 공개된 항목이 있는 날에만 보여요.',
  'help.ctx.settings-plugins.title': '플러그인',
  'help.ctx.settings-about.bullet.2': '‘버그 신고’와 ‘기능 요청’은 GitHub 프로젝트를 열고, 위키는 문서를 열어요.',
  'help.guide.map-provider.tip.3':
    'GL 지도에서는 오른쪽 버튼으로 끌어 회전하고 기울여요. 가운데 버튼을 클릭하면 장소를 추가해요.',
  'help.guide.web-push-device.step.1':
    '‘이 기기의 푸시 알림’에서 ‘이 기기에서 켜기’를 클릭하고, 브라우저가 물으면 알림을 허용하세요. ‘테스트 전송’으로 알림이 오는지 확인해요.',
  'help.guide.connect-airtrail.title': '내 AirTrail 연결하기',
  'help.guide.connect-dawarich.title': '내 Dawarich 연결하기',
  'help.guide.tour-connect-wanderer.title': '내 wanderer 연결하기',
  'help.guide.tour-connect-wanderer.tip.3': '오른쪽 ‘연결 해제’로 토큰을 다시 삭제해요.',
  'help.guide.tour-wanderer-watch.tip.3':
    '이 알림을 받을 채널은 ‘알림’의 ‘wanderer: 내 트레일에 관한 알림’ 줄에서 정해요.',
  'help.guide.plugin-settings.tip.1': '이 설정은 나에게만 적용돼요. 다른 멤버는 각자 플러그인을 설정해요.',
  'help.guide.offline-conflicts.step.3':
    '서버가 계속 거부하는 변경은 ‘오프라인 캐시’에 ‘실패한 변경 사항’으로 나와요. ‘다시 시도’로 한 번 더 보내고, ‘취소’로 서버 버전을 유지해요.',
  'help.ctx.admin-notifications.bullet.4':
    '맨 아래 ‘사용자 기본값’: 이벤트와 채널마다, 직접 바꾸지 않은 모든 사람에게 켜짐, ‘끔’, ‘차단’을 정해요.',
  'help.guide.default-user-settings.step.2':
    '설정한 칸 이름 옆에 초기화 링크가 생기고, 누르면 TREK 기본값으로 돌아가요.',
  'help.guide.own-routing-engine.title': '자체 경로 서버 쓰기',
  'help.guide.admin-passkeys.result':
    '로그인 페이지에 ‘패스키로 로그인’이 생기고, 사람들이 설정에서 패스키를 추가할 수 있어요.',
  'help.guide.rotate-jwt-secret.goal': '유출이 의심될 때 모든 세션을 끝내요.',
  'help.guide.notification-defaults.result':
    '칸을 직접 바꾸지 않은 모든 사람은 내가 고른 값으로 시작하고, 차단한 칸은 그 사람의 설정에서 잠긴 것으로 보여요.',
  'help.ctx.notifications.bullet.3':
    '알림마다 누가 어디서 무엇을 했는지 나와요. 읽지 않은 알림은 배경색이 있어요. 아래 ‘여행 보기’, ‘Vacay 보기’ 같은 버튼을 누르면 그곳으로 가고 읽음으로 표시돼요.',
  'help.guide.read-notifications.tip.1':
    '벨은 상단 바가 있는 모든 화면에 있고, 새 알림이 오면 숫자가 자동으로 바뀌어요.',
  'help.guide.filter-notifications.tip.1':
    '아래로 스크롤하면 이전 알림을 계속 불러와서 첫 화면 뒤로도 빠짐없이 볼 수 있어요.',
  'help.guide.mark-notifications-read.result': '배경색이 있는 알림이 더 이상 없고, 벨의 빨간 숫자도 사라져요.',
  'help.guide.notification-settings.title': '받을 알림 고르기',
  'help.guide.link-journal.step.1': '여행 이름 옆 ‘여행 설정’을 클릭하고 왼쪽에서 Journey를 고르세요.',
  'help.guide.dawarich-stays.tip.1':
    '‘장소 추가’를 클릭하기 전에는 여행에 아무것도 들어가지 않아요. 방문 기록으로 추가한 장소는 상세 정보에 ‘Dawarich 기록에서 추가됨’이 보여요.',
  'help.guide.leave-stop-off-route.title': '들를 곳을 경로에서 빼기',
  'help.guide.move-booking-day.step.1': '그날 예약 줄에 마우스를 올리세요. 왼쪽 손잡이가 보이면 끌 수 있다는 뜻이에요.',
  'help.guide.place-image-from-file.tip.1': 'JPG, PNG, GIF, WebP 파일만 고를 수 있고, PDF 티켓은 안 돼요.',
  'help.guide.place-own-hours.step.4':
    '‘영업 시간’ 오른쪽 버튼: 복사 버튼은 모든 요일에 월요일 시간을 넣고, X는 내가 넣은 시간을 지워요. TREK가 찾은 시간이 있으면 ‘장소 정보에서 가져오기’로 그 시간을 되돌려요.',
  'help.guide.confirm-stay-booking.step.2': '계획 위에 예약이 열려요. 헤더의 첫 번째 버튼이 상태예요.',
  'help.ctx.trip-map.bullet.9':
    '여행의 모든 투어는 각자의 색 선으로 보이고, 시작 지점에 핀이 있어요. 선을 클릭하면 투어 카드가 열려요. 투어가 있는 날에는 그날 경로가 투어 시작점까지 가고 끝나는 곳에서 이어져요. ‘투어’ 목록에서 투어 옆 눈 아이콘 ‘지도에서 숨기기’로 내 지도에서 선을 빼요.',
  'help.guide.tour-map-lines.result':
    '원하는 투어만 각자의 색으로 지도에 보이고, 숨긴 투어는 ‘투어’ 목록에 흐리게 남아요.',
  'help.guide.car-stops.step.2':
    '헤더의 유형 버튼을 클릭하고 ‘차량’을 고르세요. 양식이 바뀌어요: ‘날짜’와 ‘시작 시간’은 ‘픽업’과 ‘픽업 시간’으로, ‘종료 날짜’와 ‘종료 시간’은 ‘반납’과 ‘반납 시간’으로 바뀌고, 출발지와 도착지 아래에 ‘가는 길의 경유지’가 생겨요.',
  'help.guide.transport-details.goal':
    '이동의 모든 정보를 한곳에서 보고, 예약 코드를 복사하고, 이름을 바꾸거나, 지도에서 바로 찾아요.',
  'help.guide.transport-details.tip.2':
    'Esc를 누르거나 상세 정보 바깥을 클릭하면 닫혀요. ‘이름 바꾸기’나 삭제 확인이 열려 있으면 그것부터 닫혀요.',
  'help.guide.export-transports-csv.tip.1': '이 아이콘은 탭에 이동이 하나 이상 있을 때만 바에 보여요.',
  'help.guide.group-sort-bookings.step.1':
    '‘카드’나 ‘목록’에서 보기 아이콘 세 개 뒤의 슬라이더 ‘보기 옵션’을 클릭하세요.',
  'help.guide.create-booking.tip.4':
    '오프라인에서는 예약이 이 기기에 저장되고, 다시 온라인이 되면 동기화돼요. 새 파일은 인터넷 연결이 필요하니 빼거나 나중에 저장하세요. 실수로 양식 바깥을 클릭하거나 Esc를 누르면, 입력한 내용이 사라지기 전에 ‘변경 사항을 버릴까요?’라고 물어봐요.',
  'help.guide.booking-on-map.tip.2': '숙박은 첫날 밤으로 열려요.',
  'help.guide.export-bookings-csv.step.3':
    '‘보기 옵션’ 뒤의 스프레드시트 아이콘 ‘스프레드시트로 내보내기 (CSV)’를 클릭하세요.',
  'help.guide.arrange-packing-list.step.3':
    '‘공유됨’과 ‘내 목록’ 줄 맨 오른쪽의 ‘가나다순’을 누르면 목록마다 항목이 이름순으로 보여서, 이미 있는지 빠르게 확인할 수 있어요. 다시 클릭하면 내 순서로 돌아가요.',
  'help.guide.count-packed-pieces.step.1':
    '줄의 수량 배지(뒤에 x가 붙은 작은 숫자)를 클릭하고, 가져갈 개수(예: 5)를 입력한 뒤 Enter를 누르세요.',
  'help.guide.expense-receipts.step.3':
    '창 아래쪽 ‘저장’을 클릭하세요. 파일이 지출과 함께 올라가고, 여행의 ‘파일’에도 보여요.',
  'help.guide.files-sync-settings.step.1':
    '바 오른쪽 끝의 ‘문서 동기화’를 클릭하세요. 여행이 연결돼 있으면 오른쪽에 내 저장소 카드가 열려요. 저장소가 둘 이상이면 왼쪽 ‘이 여행’에서 원하는 저장소를 클릭하세요.',
  'help.guide.files-sync-settings.tip.3':
    '‘복사’ 버튼이 있는 링크 ‘즉시 업데이트’는 TREK가 자동으로 변경을 구독할 수 없는 저장소에만 있어요. 이 링크를 저장소에 붙여 넣으면 다음 확인 때가 아니라 바로 변경이 들어와요.',
  'help.guide.manage-notes.step.1':
    '메모 카드 헤더의 점 세 개(‘추가 옵션’)를 클릭하세요. 메뉴에 ‘펼치기’, ‘고정’, ‘편집’, ‘삭제’가 있어요.',
  'help.guide.note-categories.title': '메모를 카테고리로 나누기',
  'help.guide.note-categories.result': '메모에 새 이름과 색이 보이고, ‘메모’ 카드에는 고른 카테고리만 보여요.',
  'help.guide.roadtrip-stops.tip.5':
    '일정에 종료 시간이 있는 들를 곳은 그 시간까지 머물러요. 창에 언제 출발하는지 나오고, ‘종료 시간 삭제’로 다시 직접 머무는 시간을 정할 수 있어요.',
  'help.guide.roadtrip-reorder.tip.2':
    '예약한 이동과 그 터미널은 예약에 정해진 자리에 그대로 있어요. 끌 수 있는 건 장소뿐이에요.',
  'help.guide.roadtrip-overnight.step.2':
    '호텔에는 + 대신 침대 아이콘이 있어요. ‘숙박으로 추가’ 아이콘을 클릭하면 하룻밤용 ‘경유지로 추가’ 창이 열려요. 캠핑장에는 일반 ‘추가’ 버튼이 있어요.',
  'help.guide.roadtrip-stop-fill.goal':
    '주유소나 충전소 한 곳의 충전량을 따로 정해요. 예를 들어 급속 충전기에서는 80 %, 밤새 충전할 때는 100 %.',
  'help.guide.roadtrip-bookings.goal': '예약한 이동이 주행의 어디에 들어가는지, 언제까지 도착해야 하는지 확인해요.',
  'help.guide.roadtrip-bookings.tip.3':
    '여행의 어느 날에도 속하지 않은 이동은 주행에 포함되지 않아요. 레일 맨 위 안내에 그 이동이 나오고, ‘예약 열기’로 날짜를 정할 수 있어요.',
  'help.guide.roadtrip-google-import.step.4': '‘날’에서 정차 지점을 넣을 날을 고르고 ‘가져오기’를 클릭하세요.',
  'help.guide.roadtrip-hazards.step.2':
    '창 오른쪽 열 맨 아래 ‘현재 경보’에서 ‘위험 지역 표시’를 켜고 ‘닫기’를 클릭하세요.',
  'help.ctx.trip-tours.bullet.1':
    '오른쪽 열 맨 위 ‘장소’와 ‘투어’ 전환으로 장소 목록을 투어 목록으로 바꿔요. 투어 애드온이 켜져 있을 때만 있고, 이때 투어는 장소 목록에 나오지 않아요.',
  'help.guide.tour-show-list.step.1':
    '‘계획’ 탭 오른쪽 열 맨 위 전환 버튼에서 ‘투어’를 클릭하세요. 이제 열에 장소 대신 투어가 나와요.',
  'help.guide.tour-show-list.result': '오른쪽 열에 여행의 투어가 나오고, 클릭한 투어는 카드로 열려 있어요.',
  'help.guide.tour-add-to-day.tip.1':
    '구간이 있는 투어를 날로 끌어다 놓으면 작은 창에서 같은 것을 물어봐요. ‘취소’를 누르면 계획은 그대로예요.',
  'help.guide.tour-day-times.step.2':
    '‘시작’을 정하고 ‘종료’는 비워 두세요. 칸 아래 줄에 TREK가 계산한 종료 시간(시작 시간 더하기 투어 시간)이 나와요.',
  'help.guide.tour-remove-from-day.title': '날에서 투어 빼기',
  'help.guide.tour-filter-list.title': '투어 목록 거르기',
  'help.guide.tour-filter-list.tip.3':
    '남는 투어가 없으면 ‘이 필터와 일치하는 투어가 없습니다’라고 나오고, ‘필터 초기화’로 모두 해제해요. 필터는 목록에 보이는 것만 바꾸고 투어나 날은 바꾸지 않아요.',
  'help.guide.tour-hide-on-map.tip.2':
    '휴대폰 지도에는 항상 모든 투어가 보이고, ‘투어’ 탭에는 눈 아이콘이 없어요. 숨기기는 여기 ‘계획’ 탭에서만 돼요.',
  'help.guide.tour-import-plan-tab.tip.2':
    '가져온 트랙은 여기 목록에 남고 플래너에서 열리지 않아요. 둥근 +로 날에 넣거나, ‘투어’ 탭을 열어 거기서 보세요.',
  'help.ctx.trip-tour-detail.bullet.5':
    '이 카드는 투어 정보를 보고 관련 작업을 하는 곳이에요. 경로 자체는 ‘투어’ 탭에서 바꿔요: 탭을 열고 ‘이 여행의 투어’에서 투어를 클릭하세요. 투어 삭제도 여기가 아니라 거기서 해요.',
  'help.guide.tour-detail-read.step.6':
    '더 스크롤하면 ‘설명’과 ‘메모’, 그다음 ‘출처’가 나와요: TREK에서 계획했는지, 어떤 파일에서 가져왔는지, 어떤 wanderer 트레일에서 왔는지가 날짜와 함께 보여요.',
  'help.guide.tour-rename-colour.title': '투어 이름과 색 바꾸기',
  'help.guide.tour-rename-colour.result': '여행 곳곳에서 투어가 새 이름으로 보이고, 선은 고른 색으로 그려져요.',
  'help.guide.tour-take-along.tip.3':
    '파일은 서버에서 받아서 인터넷 연결이 필요해요. 오프라인에서 만든 투어는 동기화된 뒤 내려받을 수 있어요.',
  'help.guide.tour-copy-keep.step.4': '‘컬렉션’에서 목록을 고르고 ‘컬렉션에서의 이름’을 확인한 뒤 ‘보관’을 클릭하세요.',
  'help.guide.tour-packing-link.step.1': '투어 카드를 열고 ‘짐 목록’까지 스크롤하세요. ‘짐 목록 연결’을 클릭하세요.',
  'help.guide.tour-packing-link.result': '‘목록’ 탭의 짐 목록으로 이동했고, 투어 카드에 체크한 모든 항목이 반영돼요.',
  'help.guide.tour-files.result': '파일이 투어에 첨부되고, 카드에서 열 수 있어요.',
  'help.guide.tour-activity-link.tip.1': '계획은 그대로예요. 트랙은 연결만 되고, ‘연결 해제’로 다시 뗄 수 있어요.',
  'help.guide.tour-activity-compare.step.3':
    '‘지도에서 비교’를 클릭하면 실제 트랙이 계획 옆에 점선으로 그려져요. ‘비교 종료’로 다시 지워요.',
  'help.guide.tour-origin-check.step.2':
    '‘가져옴’에 가져온 날짜가, ‘여기’에 현재 상태가 보여요: ‘가져온 그대로’, ‘TREK에서 편집함’, ‘다시 계획함, 기록된 트랙 보관’.',
  'help.ctx.trip-tour-planner.bullet.1':
    '투어 애드온이 켜져 있으면 여행 탭 바에서 ‘계획’ 바로 다음에 ‘투어’가 있어요. 이 탭은 컴퓨터와 태블릿에 있고, 휴대폰에서는 ‘계획’ 탭에서 투어를 보고 날에 넣을 수 있지만 그릴 수는 없어요.',
  'help.guide.tour-open-workspace.step.1':
    '여행 탭 바에서 ‘계획’ 바로 다음의 ‘투어’를 클릭하세요. 지도가 화면을 채우고 양쪽에 레일이 있어요.',
  'help.guide.tour-open-workspace.tip.2': '이 탭 아무 곳에나 GPX, KML, KMZ 파일을 끌어다 놓으면 여행 투어로 가져와요.',
  'help.guide.tour-draw-route.step.4':
    '지도 아래쪽에 ‘지점을 찍었습니다’가 나타나요. 옆의 ‘실행 취소’로 지점을 다시 빼요.',
  'help.guide.tour-type-profile.title': '투어 종류 고르기',
  'help.guide.tour-type-profile.result': '고른 유형과 프로필에 맞게 투어 경로가 계산돼요.',
  'help.guide.tour-edit-points.step.6':
    '레일 헤더의 ‘지점 편집 실행 취소’와 ‘지점 편집 다시 실행’으로 모든 변경을 하나씩 되돌리거나 다시 실행해요.',
  'help.guide.tour-shaping-points.step.3':
    '‘웨이포인트’에 번호 없이 ‘형태 지점’ 배지로 나와서, 정차 지점 번호는 그대로예요.',
  'help.guide.tour-loop-reverse.step.1':
    '‘웨이포인트’ 카드 헤더의 ‘출발점으로 돌아가기’를 클릭하세요. 투어에 첫 지점으로 돌아가는 마지막 구간이 생겨요.',
  'help.guide.tour-leg-by-hand.goal':
    '라우터가 길을 찾지 못하는 곳에서 두 지점을 직선으로 잇거나, 구간을 다시 계획해요.',
  'help.guide.tour-trip-places.title': '여행 장소를 정차 지점으로 쓰기',
  'help.guide.tour-trip-places.tip.3': '여행의 다른 투어는 정차 지점으로 고를 수 없어요.',
  'help.guide.tour-details-times.tip.1': '시간은 2:56, 2 h 56, 176 minutes처럼 입력할 수 있어요.',
  'help.guide.tour-save.step.3':
    '왼쪽 레일 아래쪽 ‘저장’을 클릭하세요. ‘투어를 저장했습니다’가 나타나고, 레일 제목이 ‘투어 편집’으로 바뀌어요.',
  'help.guide.tour-edit-saved.step.1':
    '‘이 여행의 투어’에서 투어를 클릭하세요. 왼쪽 레일에 ‘투어 편집’으로 열리고, 지도에 경로가 보여요.',
  'help.guide.tour-summary-profile.title': '투어 요약과 고도 그래프 보기',
  'help.guide.tour-summary-profile.tip.3':
    '패들 투어에는 고도가 없어요. 물 위에서 얻을 수 있는 고도는 물가의 고도뿐이기 때문이에요.',
  'help.guide.tour-list-manage.step.5':
    '아직 날짜가 없는 투어는 ‘미계획’을 고르거나, ‘출처’, ‘경로 한도’, ‘유형’으로 좁히세요. 줄마다 해당 투어 수가 보이고, 합계도 필터에 맞춰 바뀌어요.',
  'help.guide.tour-delete.step.2':
    '함께 삭제되는 것을 확인하세요: 경로, 편집 가능한 웨이포인트, 날 배정. ‘영구 삭제’를 클릭하세요.',
  'help.guide.tour-saved-elsewhere.step.2': '‘새 버전 불러오기’는 확인 후 내 변경을 더 새로운 버전으로 바꿔요.',
  'help.ctx.trip-tour-import.bullet.1':
    '‘이 여행의 투어’ 맨 위 +가 ‘투어 추가’예요. ‘GPX 또는 KML 가져오기’, ‘Google Maps에서 산책 가져오기’, ‘다른 여행에서 투어 가져오기’가 있어요. 파일을 ‘투어’ 탭 아무 곳에나 끌어다 놓아도 돼요.',
  'help.guide.tour-import-gpx.step.2':
    '‘GPX 또는 KML 가져오기’를 고르고, 각 10MB까지의 .gpx, .kml, .kmz 파일을 하나 이상 고르세요.',
  'help.guide.tour-import-gpx.tip.5':
    '고도가 없는 파일은 ‘파일에 고도가 없습니다’라고 나와요. 선과 거리는 정확하지만 오르막과 내리막은 알 수 없어요.',
  'help.guide.tour-view-import.tip.2':
    '헤더의 다운로드 아이콘으로 다시 GPX 파일로 저장하고, 북마크로 컬렉션에 저장해요.',
  'help.guide.tour-plan-from-import.step.4':
    '투어가 웨이포인트와 함께 편집기에서 열려요. 원하면 수정하고 열 아래쪽 ‘저장’을 클릭하세요.',
  'help.guide.tour-restore-recorded.step.1':
    '‘이 여행의 투어’에서 다시 계획한 투어를 클릭하세요. 편집기의 ‘기록된 트랙’ 카드에 원래 기록한 트랙이 보관돼 있다고 나와요.',
  'help.guide.tour-take-over.step.1':
    '투어를 가져올 여행의 ‘투어’ 탭을 여세요. ‘이 여행의 투어’ 맨 위의 +(‘투어 추가’)를 클릭하세요.',
  'help.guide.tour-take-over.tip.3':
    '투어를 가져오려면 인터넷 연결이 필요해요. 편집기에 저장하지 않은 변경이 있으면 사본은 목록에 추가되지만 열리지는 않아서, 작업 중인 내용이 그대로 있어요.',
  'help.guide.tour-import-wanderer.tip.1':
    '‘설정’의 ‘통합’에서 wanderer를 연결하면 이 버튼이 생겨요. 그 전에는 목록에 ‘설정에서 연결’이 나와요.',
  'help.ctx.trip-tour-map.bullet.2':
    '버튼의 구분선 뒤에는 투어 유형별 스위치가 있어요: 투어 편집 중 ‘지점 찍기’, 하이킹의 ‘비아 페라타’, 패들 투어의 ‘항로 표지’, 스키 투어의 슬로프. 끝의 3D는 투어를 3D 지형 위에 보여 줘요.',
  'help.guide.tour-map-layers.step.3':
    '하이킹이라면 ‘하이킹’을 클릭해 표시된 트레일과 번호를 보세요. 자전거 투어에는 대신 자전거 경로를 보여 주는 ‘자전거’가 있어요. ‘위성 사진’은 항공 사진이고, ‘지도’로 기본 지도로 돌아가요.',
  'help.guide.tour-along-search.step.2':
    '‘찾을 항목’을 클릭하고 원하는 종류를 한 번에 여섯 개까지 체크하세요: ‘전망대’, ‘정상’, ‘산장과 대피소’, ‘식수’, ‘식사’ 등. 투어 유형에 맞는 항목이 나오고, 처음에는 세 개가 체크돼 있어요.',
  'help.guide.tour-along-add-stop.title': '투어 경로 주변 장소를 정차 지점으로 추가하기',
  'help.guide.tour-along-add-stop.tip.2':
    '새 끝점이 되는 장소에는 ‘투어가 길어집니다’가 표시돼요. 이전 끝점은 더 이상 끝이 아니고, 투어가 이 장소까지 이어져요.',
  'help.guide.tour-3d-terrain.step.5': '3D를 다시 클릭하면 평면 지도로 돌아가서 계속 계획할 수 있어요.',
  'help.guide.tour-3d-flyover.step.2':
    '‘속도’에서 1×, 2×, 4× 중 하나를 고르세요. 1×에서는 대부분의 투어가 처음부터 끝까지 약 45초 걸려요.',
  'help.guide.tour-map-overlays.goal':
    '스키나 패들 투어를 계획하면서 지도에 스키 슬로프와 리프트, 또는 부표와 항구 표지를 보여 줘요.',
  'help.guide.tour-map-overlays.tip.3':
    '레이어를 불러오지 못하면 스위치에 !와 설명이 나와요. 지도와 경로는 그대로 쓸 수 있어요.',
  'help.guide.tour-multi-day.title': '여러 날에 걸친 투어 계획하기',
  'help.guide.tour-multi-day.tip.1':
    '‘여기서 구간 종료’는 당일 투어에서도 쓸 수 있고, 그러면 자동으로 여러 날 투어가 돼요. 첫 정차 지점, 마지막 정차 지점, 형태 지점에서는 구간을 끝낼 수 없어요.',
  'help.guide.tour-stages-on-days.step.2': '1구간을 시작하는 날을 고르세요.',
  'help.guide.tour-stages-on-days.tip.4':
    '일정에서 구간마다 ‘구간 N’으로 거리와 시간이 따로 보여요. ‘계획’ 탭의 날 목록 위 ‘실행 취소’로 배치 전체를 한 번에 되돌려요.',
  'help.ctx.trip-tour-hike.bullet.5':
    '하이킹에서는 왼쪽 아래 지도 버튼 줄의 ‘비아 페라타’로 주변 비아 페라타를 보여 줘요. 비아 페라타 카드에서 별도 구간으로 경로에 추가해요.',
  'help.guide.tour-hike-plan.step.5':
    '‘상세 정보’에서 ‘탐방로 최대 난이도’를 열고 T1(‘하이킹’)부터 T6(‘매우 어려운 고산 하이킹’)까지 허용할 난이도를 고르세요. 그 범위 안에서 경로를 다시 계획해요.',
  'help.guide.tour-hike-trail-details.goal':
    '하이킹 경로의 길에 대해 OpenStreetMap에 기록된 정보를 보고, 그 구간을 지도에서 찾아요.',
  'help.guide.tour-hike-trail-details.tip.2': '하이킹 한도보다 높은 등급은 그 줄에 ‘한도 초과’ 배지가 붙어요.',
  'help.guide.tour-hike-round.step.5':
    '‘이 순환 코스 선택’을 클릭하고, 계획한 경로를 바꿀지 물으면 ‘바꾸기’를 클릭하세요.',
  'help.guide.tour-hike-compare-ways.step.2':
    '지도 위에 ‘이 구간의 다른 길’이 ‘현재 길’과 길 A, 길 B 등과 함께 열려요. 각각 다른 색으로 지도에 그려지고, 줄을 가리키면 그 선이 강조돼요.',
  'help.guide.tour-ferrata-add.goal': '하이킹 주변의 비아 페라타를 찾아 그중 하나를 경로에 넣어요.',
  'help.guide.tour-ferrata-add.tip.2':
    '비아 페라타는 하이킹에서만 쓸 수 있어요. 경로가 이미 지나는 비아 페라타는 카드에 ‘투어에 추가’ 대신 ‘투어의 일부’가 보여요.',
  'help.guide.tour-run-plan.step.4':
    '지도에서 출발점과 도착점을 정하거나 ‘여행 장소’로 고르세요. 페이스 아래에 달리기 시간(거리 곱하기 페이스)이 보여요.',
  'help.guide.tour-run-ways.goal': '달리기 코스 중 비포장이 얼마나 되는지, 길이 얼마나 어려운지 확인해요.',
  'help.ctx.trip-tour-walk.summary':
    '‘투어’ 탭에서 계획하는 걸어서 정류지를 잇는 투어예요: 정류지마다 머무는 시간, 중요한 곳, 가는 길의 명소, 그리고 산책하는 날 각 정류지에 도착하는 시간과 영업시간 확인까지.',
  'help.guide.tour-walk-plan.step.1':
    '왼쪽 열 맨 위 ‘새 투어 계획’을 클릭하고, ‘투어 유형’을 열어 ‘도심 산책 / 관광’을 고르세요.',
  'help.guide.tour-walk-plan.tip.3':
    '정차 지점 ‘작업 더 보기’의 ‘장소와 연결 해제’는 여행 장소와의 연결만 끊어요. 장소 자체는 여행에 남아요.',
  'help.guide.tour-walk-sights.step.5':
    '‘경유지로 추가’를 클릭하세요. 산책이 얼마나 길어지는지 안내가 나오고, 옆에 ‘실행 취소’가 있어요.',
  'help.guide.tour-walk-day-times.step.2':
    '그날 시작 시간을 정하세요: ‘계획’ 탭에서 날 안의 산책을 오른쪽 클릭하고 ‘편집’을 고른 뒤 ‘시작’을 입력하세요.',
  'help.guide.tour-walk-google-import.title': 'Google Maps 도보 경로를 도심 산책으로 만들기',
  'help.guide.tour-walk-google-import.tip.3':
    'Google Maps에 그려진 선이 아니라 정차 지점만 가져와요. 짧은 maps.app.goo.gl 링크는 인터넷 연결이 있어야 열 수 있어요.',
  'help.guide.tour-walk-check-off.tip.1':
    '표시는 날마다 따로 저장돼요. 투어 목록이 아니라 계획의 그날에서 산책을 여세요.',
  'help.ctx.trip-tour-bike.bullet.3':
    '‘웨이포인트’ 아래 ‘노면과 길’ 카드에 경로 노면이 나와요: 노면, 길 종류, 비포장으로 확인된 비율. 줄을 클릭하면 지도에서 그 구간이 강조돼요.',
  'help.guide.tour-bike-profile.step.5':
    '오른쪽 ‘투어 요약’에서 ‘주행 시간(추정)’을 확인하세요. 정보 점에 마우스를 올리면 계산 방법이 나와요.',
  'help.guide.tour-bike-surfaces.title': '자전거 투어의 노면 보기',
  'help.guide.tour-bike-surfaces.tip.2':
    '‘로드’ 프로필에서는 막대 위에 비포장으로 확인된 거리를 알리는 경고가 나와요. ‘지도에 표시’로 그 구간을 표시해요.',
  'help.guide.tour-bike-mtb-grades.result':
    '지도에 고른 등급의 트레일이 표시되고, 투어에서 어느 구간이 어려운지 알 수 있어요.',
  'help.ctx.trip-tour-ski.bullet.2':
    '종목 아래에 슬로프 라우터 옵션이 있고, 내 종목에 해당하는 것만 보여요: ‘가장 어려운 슬로프’, ‘우선’, ‘속도’, ‘리프트 이용’ 같은 스위치, 타지 않을 리프트 종류를 고르는 ‘제외’. 바꿀 때마다 투어를 다시 계획해요.',
  'help.guide.tour-ski-plan.step.3':
    '‘종목’에서 할 것을 고르세요: ‘알파인’, ‘스노보드’, ‘크로스컨트리’, ‘산악 스키’, ‘스노슈’, ‘겨울 하이킹’. 미리 선택된 건 없고, 종목이 없으면 저장할 수 없어요.',
  'help.guide.tour-ski-plan.result':
    '‘이 여행의 투어’에 ‘스키와 겨울’ 투어가 저장됐어요. 구간은 지도의 슬로프, 리프트, 코스를 따르고, 시간은 ‘투어 요약’에서 계산돼요.',
  'help.guide.tour-ski-options.tip.1': '바꿀 때마다 투어를 구간별로 다시 계획해요.',
  'help.guide.tour-ski-fix-leg.step.3':
    '맞는 해결 방법이 없으면 ‘직선으로 그리기’를 클릭하세요. 구간이 두 지점 사이 직선이 돼요.',
  'help.guide.tour-ski-summary.step.1':
    '웨이포인트 아래에서 ‘슬로프 경로’ 카드를 찾으세요. 제목을 클릭하면 접히거나 다시 펼쳐져요.',
  'help.guide.tour-ski-pistes-layer.title': '지도에 슬로프 표시하기',
  'help.guide.tour-ski-pistes-layer.result': '투어 아래에 슬로프가 그려지고, 색의 의미를 알 수 있어요.',
  'help.guide.tour-ski-import.step.6': '‘스키 트랙 분류’에서 알맞은 종목이나 주법을 고르고 ‘저장’을 클릭하세요.',
  'help.ctx.trip-tour-paddle.bullet.2':
    '지점마다 역할이 배지로 붙어요: ‘입수 지점’, ‘출수 지점’, ‘재입수 지점’, ‘최종 출수 지점’. 지점 아래에는 그다음 구간이 나와요: 손으로 그린 구간, 육상 운반, 갑문, 또는 구간을 계획하지 못한 이유.',
  'help.guide.tour-paddle-setup.step.2':
    '‘투어 유형’을 열고 ‘패들 투어’(‘물 위에서, 카약, 카누 또는 SUP로’)를 고르세요.',
  'help.guide.tour-paddle-setup.tip.3':
    '패들 투어에서 ‘투어 경로 주변’은 ‘입수 지점’, ‘보트 대여’, ‘식수’를 먼저 찾아요.',
  'help.guide.tour-paddle-water-route.step.4':
    'TREK가 계획하지 못한 구간은 빨간색이 되고, 그 지역 수역 데이터가 아직 없다는 식으로 이유를 알려 줘요. 당장은 ‘직선으로 그리기’를 클릭해 손으로 그리세요.',
  'help.guide.tour-paddle-portage.goal':
    '보트를 들고 가는 구간을 표시해서 육지로 계산하고, 배에서 내렸다가 다시 타는 시간도 넣어요.',
  'help.guide.tour-paddle-portage.tip.3':
    '‘시간 추정’ 카드에서 ‘운반 속도’를 직접 정하기 전까지 운반은 2km/h로 계산해요.',
  'help.guide.tour-paddle-lock.tip.1':
    'TREK는 갑문 운영 시간표를 몰라요. 시간은 내가 입력한 값일 뿐이니, 갑문 운영 시간은 직접 확인하세요.',
  'help.guide.tour-paddle-time.step.3':
    '‘수역’ 줄은 물 위 거리를 ‘패들 속도’로 계산한 거예요. 속도는 열 맨 위 ‘패들 속도’ 칸에서 바꾸세요.',
  'help.guide.tour-paddle-wind.goal': '패들링하는 날 투어 출발 지점의 바람 예보를 확인해요.',
  'help.guide.tour-paddle-wind.tip.4': '예보 값이 없다고 안전하다는 뜻은 아니에요. 현장 상황을 확인하세요.',
  'help.guide.tour-paddle-checklist.step.5':
    '출발 전에 열 맨 아래 ‘패들링에는 위험이 따릅니다’를 클릭해 ‘수상 안전’을 읽으세요.',
  'help.guide.tour-paddle-track-marks.goal':
    '시계로 기록한 패들 트랙을 가져와서, 보트를 들고 간 곳과 갑문을 지난 곳을 추가해요.',
  'help.guide.tour-paddle-track-marks.tip.1':
    '트랙 위를 정확히 클릭하세요. 선에서 너무 먼 곳을 클릭하면 거부되고, 카드에 안내가 나와요.',
  'help.ctx.trip-tour-horse.bullet.3':
    '구간마다 ‘웨이포인트’ 카드에 루트 이름, 통행 점, 길이가 담긴 배지로 보여요. 승마 루트가 없는 구간은 ‘수동, 확인되지 않음’으로 나와요.',
  'help.guide.tour-horse-plan.step.4': '목록에서 루트를 클릭하세요. 구간에 번호가 붙은 별도 지도에서 열려요.',
  'help.guide.tour-horse-plan.tip.4': '왼쪽 열 헤더의 ‘지점 편집 실행 취소’로 구간 하나를 통째로 되돌려요.',
  'help.guide.tour-horse-gap.result': '승마에 빈 구간이 없어지고, 이은 구간은 손으로 그린 구간으로 표시돼요.',
  'help.guide.tour-horse-recorded.step.3': '‘투어 1개 가져오기’를 클릭하세요.',
  'help.guide.dissolve-fusion.step.3': '확인 창에서 “해제”를 눌러 확인하세요.',
};

export default help;
