import type { TranslationStrings } from '../types';

// English fallback until 'ko' is translated.
const help: TranslationStrings = {
  'help.title': 'Help & Docs',
  'help.search': 'Search docs…',
  'help.contents': 'Contents',
  'help.noResults': 'No matching pages.',
  'help.errorTitle': "Couldn't load this page",
  'help.errorBody': 'The help content is fetched from the TREK wiki. Check your connection and try again.',

  // center
  'help.center.button': '이 화면의 도움말',
  'help.center.title': '도움말',
  'help.center.onThisScreen': '이 화면에서',
  'help.center.screens': '화면',
  'help.center.thisScreen': '현재 화면',
  'help.center.subScreens': '하위 화면: {count}',
  'help.center.subScreensLabel': '하위 화면',
  'help.center.guidesCount': '가이드 {count}개',
  'help.center.goToScreen': '{screen}(으)로 이동',
  'help.center.overview': '개요',
  'help.center.howTo': '이렇게 하려면…',
  'help.center.searchPlaceholder': '가이드와 문서 검색…',
  'help.center.searchEmpty': '“{query}”에 대한 결과가 없습니다.',
  'help.center.searchGuides': '가이드',
  'help.center.searchDocs': '문서',
  'help.center.searchError': '지금은 검색을 사용할 수 없습니다.',
  'help.center.back': '뒤로',
  'help.center.close': '도움말 닫기',
  'help.center.steps': '{count}단계',
  'help.center.step': '{n}단계',
  'help.center.stepsLabel': '단계',
  'help.center.stepOf': '{total}단계 중 {n}단계',
  'help.center.screenshot': '스크린샷',
  'help.center.result': '결과',
  'help.center.tips': '알아두면 좋은 점',
  'help.center.related': '관련 항목',
  'help.center.openDocs': '도움말 및 문서에서 열기',
  'help.center.docsSection': '문서에서',
  'help.center.noContext': '이 화면에 대한 가이드가 아직 없습니다.',
  'help.center.noContextHint': '문서를 검색하거나 찾던 내용을 알려주세요.',
  'help.center.feedback': '빠진 내용이 있나요?',
  'help.center.feedbackLink': 'GitHub에 알려주세요',
  'help.center.discord': 'Discord에서 질문하기',
  'help.center.quick': '간단',
  'help.center.guide': '가이드',
  'help.center.tour': '따라하기',
  'help.center.imageAlt': '“{title}”의 {n}단계',

  // ctx
  'help.ctx.dashboard.title': '대시보드',
  'help.ctx.dashboard.summary':
    '대시보드는 모든 여행으로 들어가는 입구입니다. 상단의 탑승권은 진행 중이거나 다음에 떠날 여행을 크게 보여주고, 그 아래 줄은 지금까지의 여행 기록을 집계하며, 카드에는 계획 중, 보관됨, 완료된 여행이 모두 나열됩니다.',
  'help.ctx.dashboard.bullet.1':
    '탑승권: 진행 중이거나 다음 여행을 날짜, 동행자, 장소, 카운트다운과 함께 보여줍니다. 클릭하면 여행이 열립니다.',
  'help.ctx.dashboard.bullet.2': '여행 통계: 방문한 국가, 여행 수, 여행 일수, 비행 거리를 모든 여행에 걸쳐 집계합니다.',
  'help.ctx.dashboard.bullet.3':
    '여행 카드: 예정, 보관됨, 완료됨으로 필터링하고 격자 또는 목록으로 봅니다. 카드에 마우스를 올리면 편집, 복제, 보관, 삭제를 할 수 있습니다.',
  'help.ctx.dashboard.bullet.4': '오른쪽 위젯: 환율 계산기, 세계 시계, 다가오는 예약, 컬렉션. 각각 끌 수 있습니다.',
  'help.ctx.dashboard.bullet.5': '“새 여행” 카드와 오른쪽 아래 버튼은 둘 다 새 여행을 시작합니다.',

  // create-trip
  'help.guide.create-trip.title': '여행 만들기',
  'help.guide.create-trip.goal': '이름, 날짜, 커버 사진으로 새 여행을 시작합니다.',
  'help.guide.create-trip.step.1':
    '“새 여행”을 클릭합니다. 여행 목록 끝의 카드와 오른쪽 아래 버튼은 같은 역할을 합니다.',
  'help.guide.create-trip.step.2': '여행에 이름을 붙입니다. 필수 항목은 이것뿐이며 나머지는 나중에 추가할 수 있습니다.',
  'help.guide.create-trip.step.3':
    '시작일과 종료일을 고릅니다. TREK은 날짜마다 하루씩 만들어 주므로 일정을 바로 채울 수 있습니다.',
  'help.guide.create-trip.step.4':
    '선택 사항: 커버 사진을 추가합니다. 직접 업로드하거나 끌어다 놓거나 Unsplash에서 목적지를 검색하세요.',
  'help.guide.create-trip.step.5': '“새 여행 만들기”를 클릭합니다.',
  'help.guide.create-trip.result': '여행이 대시보드에 나타납니다. 다음 여행이라면 상단의 탑승권에 표시됩니다.',
  'help.guide.create-trip.tip.1':
    '날짜는 나중에 바꿀 수 있습니다. 이미 예약이 있다면 TREK이 예약도 날짜와 함께 옮길지 물어봅니다.',
  'help.guide.create-trip.tip.2':
    '여기서 고르는 여행 통화는 모든 비용이 환산되는 기준입니다. 목적지의 통화를 선택하세요.',

  // edit-trip
  'help.guide.edit-trip.title': '여행 편집하기',
  'help.guide.edit-trip.goal': '여행 이름을 바꾸거나 날짜를 변경하거나 설정을 조정합니다.',
  'help.guide.edit-trip.step.1': '여행 카드(또는 탑승권)에 마우스를 올리고 연필 아이콘을 클릭합니다.',
  'help.guide.edit-trip.step.2': '필요한 항목을 바꿉니다: 이름, 설명, 날짜, 커버, 통화, 알림, 구성원.',
  'help.guide.edit-trip.step.3': '“업데이트”를 클릭합니다.',
  'help.guide.edit-trip.result': '카드가 즉시 갱신되고 여행의 모든 구성원에게 반영됩니다.',
  'help.guide.edit-trip.tip.1':
    '이미 예약이 있는 여행의 날짜를 옮기면 예약도 함께 옮길지 묻는 두 번째 단계가 열립니다.',

  // cover-image
  'help.guide.cover-image.title': '커버 사진 설정하기',
  'help.guide.cover-image.goal': '카드와 탑승권에 표시될 이미지를 여행에 지정합니다.',
  'help.guide.cover-image.step.1': '카드의 연필 아이콘으로 여행 편집 양식을 엽니다.',
  'help.guide.cover-image.step.2':
    '“커버 이미지”에 사진을 끌어다 놓거나, 클릭해 업로드하거나, Unsplash 검색에 목적지를 입력합니다.',
  'help.guide.cover-image.step.3': '사진을 고르고 “업데이트”를 클릭합니다.',
  'help.guide.cover-image.result': '사진은 여행과 함께 저장되어 여행이 표시되는 모든 곳에 나타납니다.',
  'help.guide.cover-image.tip.1':
    'Unsplash 검색 사진에는 출처가 자동으로 표시됩니다. 직접 업로드한 사진은 내 서버에 남습니다.',

  // duplicate-trip
  'help.guide.duplicate-trip.title': '여행 복제하기',
  'help.guide.duplicate-trip.goal': '기존 여행을 새 여행의 템플릿으로 재사용합니다.',
  'help.guide.duplicate-trip.step.1': '카드에 마우스를 올리고 복제 아이콘을 클릭합니다.',
  'help.guide.duplicate-trip.step.2': '복사되는 항목과 되지 않는 항목을 확인한 뒤 승인합니다.',
  'help.guide.duplicate-trip.result': '원본 옆에 복사본이 나타나며, 이름과 날짜만 바꾸면 됩니다.',
  'help.guide.duplicate-trip.tip.1':
    '일정, 장소, 예약, 예산 항목, 짐 목록, 일별 메모는 복사됩니다. 구성원, 채팅, 투표, 파일, 공유 링크는 복사되지 않습니다.',

  // archive-trip
  'help.guide.archive-trip.title': '여행 보관 및 복원하기',
  'help.guide.archive-trip.goal': '여행을 삭제하지 않고 치워두었다가 나중에 다시 가져옵니다.',
  'help.guide.archive-trip.step.1': '카드에 마우스를 올리고 “보관”을 클릭합니다.',
  'help.guide.archive-trip.step.2': '카드 위의 필터를 “보관됨”으로 바꾸면 다시 볼 수 있습니다.',
  'help.guide.archive-trip.step.3': '카드의 “복원”을 클릭하면 “예정”으로 돌아갑니다.',
  'help.guide.archive-trip.result':
    '보관된 여행은 모든 내용을 그대로 유지합니다. 대시보드와 전체 여행 캘린더 피드에서만 보이지 않게 됩니다.',

  // delete-trip
  'help.guide.delete-trip.title': '여행 삭제하기',
  'help.guide.delete-trip.goal': '여행을 완전히 삭제합니다.',
  'help.guide.delete-trip.step.1': '카드에 마우스를 올리고 휴지통 아이콘을 클릭합니다.',
  'help.guide.delete-trip.step.2': '확인합니다. 대화상자에 여행 이름이 표시되므로 맞는지 확인할 수 있습니다.',
  'help.guide.delete-trip.result':
    '여행과 일정, 장소, 예약, 파일이 모두 사라집니다. 되돌릴 수 없으니 확실하지 않다면 보관하세요.',

  // filter-and-view
  'help.guide.filter-and-view.title': '완료된 여행 찾기, 격자와 목록 전환하기',
  'help.guide.filter-and-view.goal': '완료되었거나 보관된 여행을 보고 원하는 레이아웃을 고릅니다.',
  'help.guide.filter-and-view.step.1':
    '카드 위의 “예정”, “보관됨”, “완료됨”을 사용합니다. 종료일이 지난 여행은 모두 완료됨에 들어갑니다.',
  'help.guide.filter-and-view.step.2':
    '목록 아이콘을 클릭하면 간결한 목록으로 바뀌고, 다시 클릭하면 격자로 돌아옵니다.',
  'help.guide.filter-and-view.result': '대시보드는 이 기기에서의 레이아웃을 기억합니다.',

  // calendar-feed
  'help.guide.calendar-feed.title': '캘린더에서 모든 여행 구독하기',
  'help.guide.calendar-feed.goal': '진행 중인 모든 여행의 일정과 예약을 캘린더 앱에서 항상 동기화된 상태로 봅니다.',
  'help.guide.calendar-feed.step.1': '보기 전환 옆의 캘린더 아이콘을 클릭합니다.',
  'help.guide.calendar-feed.step.2': '“Enable calendar subscription”을 클릭합니다. TREK이 비공개 피드 링크를 만듭니다.',
  'help.guide.calendar-feed.step.3':
    '버튼(Google, Apple, Outlook) 중 하나로 피드를 추가하거나, URL 구독을 지원하는 캘린더 앱에 링크를 복사합니다.',
  'help.guide.calendar-feed.result':
    '진행 중인 모든 여행이 캘린더에 표시되고 자동으로 갱신됩니다. 보관된 여행과 90일 이상 전에 끝난 여행은 제외됩니다.',
  'help.guide.calendar-feed.tip.1':
    '링크는 비밀입니다. 링크를 가진 사람은 누구나 피드를 읽을 수 있으니, 유출되면 같은 대화상자에서 취소하세요.',

  // widgets
  'help.guide.widgets.title': '대시보드 위젯 고르기',
  'help.guide.widgets.goal': '통계 줄과 오른쪽 위젯을 표시하거나 숨깁니다.',
  'help.guide.widgets.step.1': '오른쪽 위의 아바타 메뉴를 열고 “설정”을 선택합니다.',
  'help.guide.widgets.step.2': '“Appearance” 탭으로 이동합니다.',
  'help.guide.widgets.step.3': '“Dashboard widgets”에서 각 위젯을 켜거나 끕니다. 데스크톱과 모바일은 따로 설정합니다.',
  'help.guide.widgets.step.4': '대시보드로 돌아갑니다. 변경 사항은 바로 적용됩니다.',
  'help.guide.widgets.result':
    '숨긴 위젯만큼 여행에 쓸 공간이 넓어집니다. 오른쪽 열 전체를 끄면 레이아웃이 가운데 정렬됩니다.',
  'help.guide.widgets.link': '외관 설정 열기',

  // currency-widget
  'help.guide.currency-widget.title': '환율 계산하기',
  'help.guide.currency-widget.goal': '최신 환율로 두 통화 간 금액을 환산합니다.',
  'help.guide.currency-widget.step.1': '금액을 입력하고 두 통화를 고릅니다.',
  'help.guide.currency-widget.step.2': '가운데 화살표는 통화 쌍을 바꾸고, 원형 화살표는 환율을 새로 고칩니다.',
  'help.guide.currency-widget.result': '통화 쌍은 계정에 저장되므로 모든 기기에서 동일합니다.',
  'help.guide.currency-widget.tip.1': '환율은 유럽중앙은행에서 가져오며 하루에 한 번 갱신됩니다.',

  // timezones-widget
  'help.guide.timezones-widget.title': '세계 시계 추가하기',
  'help.guide.timezones-widget.goal': '목적지의 현지 시간을 한눈에 확인합니다.',
  'help.guide.timezones-widget.step.1': '“시간대” 위젯의 +를 클릭하고 도시를 검색합니다.',
  'help.guide.timezones-widget.step.2': '시계 옆의 ×로 삭제합니다.',
  'help.guide.timezones-widget.result': '시계는 계정에 저장됩니다.',

  // ── Screen: vacay ──────────────────────────────────────────────────────────
  'help.ctx.vacay.title': 'Vacay',
  'help.ctx.vacay.summary':
    'Vacay는 개인 휴가 플래너입니다. 한 해에 휴가가 며칠인지, 어떤 날을 기록했는지, 얼마나 남았는지를 관리합니다. 격자는 한 해 전체를 한눈에 보여주고, 사이드바에는 연도 선택, 함께 계획하는 사람, 공유받은 캘린더, 범례, 휴가 일수가 있습니다.',
  'help.ctx.vacay.bullet.1':
    '연간 격자: 월 카드 12장, 하루에 셀 하나. 날짜를 클릭해 기록하거나 지웁니다. 작은 파란 점은 이미 여행이 잡힌 날을 표시합니다.',
  'help.ctx.vacay.bullet.2':
    '하단 도구 모음: “휴가” 또는 “회사 휴일” 모드, 그리고 클릭이 무엇을 기록할지 바꾸는 “반차”와 “대체휴무” 스위치.',
  'help.ctx.vacay.bullet.3': '“휴가 일수”: 올해의 일수, 사용한 날과 남은 날, 이전 기간에서 이월된 날을 포함합니다.',
  'help.ctx.vacay.bullet.4':
    '“인원”은 내 계획과 병합된 사람들로 각자 색이 있습니다. “공유된 캘린더”는 다른 사람의 휴무를 읽기 전용 링으로 보여줍니다.',
  'help.ctx.vacay.bullet.5':
    '“설정”에서는 주말, 주 시작 요일, 이월, 휴가 연도, 회사 휴일, 공휴일과 학교 방학 캘린더를 다룹니다.',
  // log-day
  'help.guide.log-day.title': '휴가일 기록하기',
  'help.guide.log-day.goal': '연간 격자에 휴무일을 표시하고 잔여 일수가 따라 바뀌는 것을 확인합니다.',
  'help.guide.log-day.step.1':
    '하단 도구 모음을 확인하세요. 내 색의 왼쪽 버튼은 클릭하면 나를 위한 휴가일이 기록된다는 뜻입니다.',
  'help.guide.log-day.step.2': '아무 월 카드에서 날짜를 클릭하세요. 내 색으로 채워지고 “사용”이 하루 늘어납니다.',
  'help.guide.log-day.step.3': '같은 날짜를 다시 클릭하면 지워집니다.',
  'help.guide.log-day.result':
    '날이 기록되고 “일”, “사용”, “남음”이 바로 갱신되며, 계획을 병합한 사람 모두가 실시간으로 봅니다.',
  'help.guide.log-day.tip.1': '“설정”에서 “주말 차단”이 켜져 있는 동안에는 주말을 기록할 수 없습니다.',
  'help.guide.log-day.tip.2':
    '셀의 파란 점은 내 여행 중 하나가 그날에 걸쳐 있다는 뜻이라, 휴가와 여행이 겹치는 곳을 볼 수 있습니다.',
  // half-day
  'help.guide.half-day.title': '반차 기록하기',
  'help.guide.half-day.goal': '하루치 휴가를 쓰지 않고 오후만 쉬세요.',
  'help.guide.half-day.step.1': '도구 모음에서 “반차”를 켭니다. 주황 점은 격자에서 반차에 붙는 표시입니다.',
  'help.guide.half-day.step.2': '날짜를 클릭하세요. 0.5로 기록되고 모서리에 주황 점이 붙습니다.',
  'help.guide.half-day.step.3': '끝나면 “반차”를 다시 끕니다. 다른 설정으로 반차를 클릭하면 그 자리에서 변환됩니다.',
  'help.guide.half-day.result': '“사용”이 0.5 늘어납니다. “반차”와 “대체휴무”는 독립적이라 반차 대체휴무도 가능합니다.',
  'help.guide.half-day.tip.1': '도구 모음은 항상 다음 클릭이 놓을 표시를 보여주므로 기록 전에 확인할 수 있습니다.',
  // comp-day
  'help.guide.comp-day.title': '대체휴무 또는 유연근무 기록하기',
  'help.guide.comp-day.goal': '휴가 일수를 쓰지 않는 대체휴무를 사용합니다.',
  'help.guide.comp-day.step.1':
    '도구 모음에서 “대체휴무”를 켭니다. 빗금 원판은 격자에서 대체휴무일이 보이는 모습입니다.',
  'help.guide.comp-day.step.2': '날짜를 클릭하세요. 단색 블록 대신 내 색의 대각선 빗금으로 채워집니다.',
  'help.guide.comp-day.result': '대체휴무일은 휴가 일수 타일 옆에 따로 집계되며 “남음”을 줄이지 않습니다.',
  'help.guide.comp-day.tip.1':
    '되돌려 받은 초과근무, 유연근무, 보상휴가: 쉬는 날이지만 휴가가 아닌 것은 모두 여기에 해당합니다.',
  // entitlement
  'help.guide.entitlement.title': '휴가 일수 설정하기',
  'help.guide.entitlement.goal': '한 해 휴가가 며칠인지 Vacay에 알려줍니다.',
  'help.guide.entitlement.step.1': '사이드바의 “휴가 일수” 아래에 있는 “일” 타일을 클릭합니다.',
  'help.guide.entitlement.step.2': '일수를 입력하고 Enter를 누릅니다.',
  'help.guide.entitlement.result': '“남음”은 휴가 일수, 이월분, 사용한 날로 다시 계산됩니다.',
  'help.guide.entitlement.tip.1': '연도마다 휴가 일수가 따로 있으므로 여기서의 변경은 선택한 연도에만 적용됩니다.',
  // years
  'help.guide.years.title': '연도 추가와 전환',
  'help.guide.years.goal': '내년을 미리 계획하거나 작년을 돌아봅니다.',
  'help.guide.years.step.1': '연도 오른쪽의 +를 클릭해 다음 해를, 왼쪽의 +로 이전 해를 추가합니다.',
  'help.guide.years.step.2': '화살표나 아래의 연도 칩으로 연도를 전환합니다.',
  'help.guide.years.step.3':
    '연도를 삭제하려면 칩에 마우스를 올리고 작은 빼기를 클릭하세요. 기록도 함께 사라지니 신중히 확인하세요.',
  'help.guide.years.result': '각 연도는 자체 휴가 일수와 기록을 유지하며, 이월이 이를 연결합니다.',
  // company-holidays
  'help.guide.company-holidays.title': '회사 휴일 표시하기',
  'help.guide.company-holidays.goal': '누구의 휴가도 쓰지 않고 회사 전체가 쉬는 날을 차단합니다.',
  'help.guide.company-holidays.step.1':
    '“설정”을 열고 “회사 휴일”이 켜져 있는지 확인합니다. 기본으로 켜져 있으며, 켜져 있는 동안에만 도구 모음에 모드가 나타납니다.',
  'help.guide.company-holidays.step.2': '격자로 돌아와 도구 모음을 “회사 휴일” 모드로 바꿉니다.',
  'help.guide.company-holidays.step.3': '날짜들을 클릭하세요. 호박색으로 바뀌고 범례에 나타납니다.',
  'help.guide.company-holidays.result': '회사 휴일은 계획에 병합된 모두에게 보이며 “남음”을 줄이지 않습니다.',
  'help.guide.company-holidays.tip.1': '병합된 구성원 누구나 회사 휴일을 편집할 수 있으니 누가 관리할지 정하세요.',
  // public-holidays
  'help.guide.public-holidays.title': '공휴일 표시하기',
  'help.guide.public-holidays.goal': '국가나 지역의 공휴일을 격자에 표시합니다.',
  'help.guide.public-holidays.step.1': '“설정”을 열고 “공휴일”을 켭니다.',
  'help.guide.public-holidays.step.2':
    '“캘린더 추가”를 클릭하고 국가를, 필요하면 지역도 고릅니다. 원하면 색과 이름을 지정하세요.',
  'help.guide.public-holidays.step.3': '“설정”을 닫습니다. 공휴일이 격자와 범례에 나타납니다.',
  'help.guide.public-holidays.result': '공휴일은 캘린더 색으로 표시되며 휴가 일수에서 차감되지 않습니다.',
  'help.guide.public-holidays.tip.1': '여러 캘린더를 추가할 수 있습니다. 예를 들어 내 지역과 병합된 동료의 지역.',
  // school-holidays
  'help.guide.school-holidays.title': '학교 방학 표시하기',
  'help.guide.school-holidays.goal': '내 지역의 학교 방학을 내 휴무일 옆에서 확인합니다.',
  'help.guide.school-holidays.step.1': '“설정”을 열고 “School Holidays”를 켭니다.',
  'help.guide.school-holidays.step.2':
    '“캘린더 추가”를 클릭하고 국가를 고릅니다. 국가가 캘린더를 나눈 경우 지역이나 그룹도 고르세요.',
  'help.guide.school-holidays.step.3': '“설정”을 닫습니다. 각 방학 기간의 날짜 아래에 색 띠가 표시됩니다.',
  'help.guide.school-holidays.result': '학교 방학은 표시용일 뿐 누구의 휴가 일수도 줄이지 않습니다.',
  'help.guide.school-holidays.tip.1':
    '지역이 없나요? 관리자가 “관리자”, “개인 설정”, “학교 방학”에서 직접 관리할 수 있습니다.',
  // weekends
  'help.guide.weekends.title': '주말 차단과 주 시작 요일 설정',
  'help.guide.weekends.goal': '주말을 집계에서 빼고 익숙한 요일에 주를 시작합니다.',
  'help.guide.weekends.step.1': '“설정”을 엽니다.',
  'help.guide.weekends.step.2': '“주말 차단”을 켜고 어떤 요일을 주말로 볼지 고릅니다.',
  'help.guide.weekends.step.3': '“주 시작 요일”에서 월요일 또는 일요일을 고릅니다.',
  'help.guide.weekends.result': '차단된 날은 격자에서 회색으로 표시되며 실수로 기록할 수 없습니다.',
  // leave-year
  'help.guide.leave-year.title': '휴가 연도 설정하기',
  'help.guide.leave-year.goal': '1월부터 12월이 아니라 회계연도나 입사일을 기준으로 휴가 일수를 셉니다.',
  'help.guide.leave-year.step.1': '“설정”을 열고 “휴가 연도”를 찾습니다.',
  'help.guide.leave-year.step.2':
    '“캘린더”, “회계연도”(시작 월과 일 지정) 또는 “입사일”(입사한 날짜 지정) 중에서 고릅니다.',
  'help.guide.leave-year.result': '휴가 일수, 사용일, 이월이 그 기간을 따르고 격자는 그 첫 달부터 시작합니다.',
  'help.guide.leave-year.tip.1': '이 설정은 개인용입니다. 병합된 계획에서도 각자 자신의 휴가 연도와 숫자를 유지합니다.',
  // carry-over
  'help.guide.carry-over.title': '미사용 일수 이월하기',
  'help.guide.carry-over.goal': '기간 말에 남은 날을 다음 기간에 더합니다.',
  'help.guide.carry-over.step.1': '“설정”을 엽니다.',
  'help.guide.carry-over.step.2': '“이월”을 켭니다.',
  'help.guide.carry-over.result': '이월된 양은 모든 연도에 걸쳐 다시 계산되어 휴가 일수 아래에 표시됩니다.',
  'help.guide.carry-over.tip.1': '끄면 모든 이월 잔액이 0으로 돌아갑니다.',
  // invite
  'help.guide.invite.title': '누군가와 함께 계획하기',
  'help.guide.invite.goal': '다른 TREK 사용자와 계획을 병합해 서로의 휴무를 한 격자에서 봅니다.',
  'help.guide.invite.step.1': '“인원” 패널의 사람 아이콘을 클릭합니다.',
  'help.guide.invite.step.2': '사용자를 고르고 초대를 보냅니다.',
  'help.guide.invite.step.3': '상대가 알림을 받고 수락합니다. 그때까지 초대는 대기 중으로 표시됩니다.',
  'help.guide.invite.result':
    '두 계획이 병합됩니다. 각자 색이 있고, 서로를 위해 날짜를 기록할 수 있으며, 모든 것이 실시간으로 동기화됩니다.',
  'help.guide.invite.tip.1':
    '병합을 취소하려면 “설정”의 “퓨전 해제”를 사용하세요. 각자의 기록은 자신의 계획으로 돌아갑니다.',
  'help.guide.invite.tip.2': '상대가 내 휴무만 보면 된다면 병합 대신 캘린더를 공유하세요.',
  // share-calendar
  'help.guide.share-calendar.title': '캘린더를 읽기 전용으로 공유하기',
  'help.guide.share-calendar.goal': '계획에 대한 권한을 주지 않고 내가 언제 쉬는지 보여줍니다.',
  'help.guide.share-calendar.step.1': '“공유된 캘린더” 패널의 공유 아이콘을 클릭합니다.',
  'help.guide.share-calendar.step.2': '사용자를 고르고 “공유”를 클릭합니다. 수락은 필요 없습니다.',
  'help.guide.share-calendar.step.3':
    '나에게 공유된 캘린더는 같은 패널에 나타납니다. 눈 아이콘으로 숨기고, “공유 중지”로 내 공유를 취소합니다.',
  'help.guide.share-calendar.result':
    '내 휴무가 상대의 격자에 색 링으로 나타납니다. 공유한 내용은 상대가 편집할 수 없습니다.',
  'help.guide.share-calendar.tip.1':
    '공유와 병합은 독립적입니다. 한 사람과 병합하면서 다른 사람들과 공유할 수 있습니다.',
  'help.guide.share-calendar.tip.2': '링이 있는 날에 마우스를 올리면 누가 얼마나 쉬는지 볼 수 있습니다.',

  // ── Screen: atlas ─────────────────────────────────────────────────────────────────────
  'help.ctx.atlas.title': 'Atlas',
  'help.ctx.atlas.summary':
    'Atlas는 세계 지도 위에 그려진 나의 여행 발자취입니다. 여행으로 다녀온 나라는 모두 색이 칠해지고, TREK을 쓰기 전에 다녀온 나라는 직접 추가할 수 있습니다. 확대하면 지역이 보이고, 아직 가 보고 싶은 곳은 버킷 리스트로 관리하며, 하단의 유리 패널에서 숫자를 확인합니다.',
  'help.ctx.atlas.bullet.1':
    '지도: 방문한 나라는 그 나라만의 색을 유지하고, 예정된 나라는 점선 테두리, 버킷 리스트의 나라는 빗금, 나머지는 회색입니다. 나라에 마우스를 올리면 여행, 장소, 첫 방문과 마지막 방문이 보입니다.',
  'help.ctx.atlas.bullet.2':
    '상단 검색: 나라나 장소를 입력합니다. 나라를 고르면 지도가 그곳으로 이동해 팝업이 열리고, 장소를 고르면 그 지역에 내려앉아 바로 표시할 수 있습니다.',
  'help.ctx.atlas.bullet.3':
    '오른쪽 위의 “예정된 국가 표시”: 다가오는 여행의 나라를 보여줍니다. 이 스위치는 예정된 여행이 있는 동안에만 나타납니다.',
  'help.ctx.atlas.bullet.4':
    '하단 패널: 통계 탭에는 국가, 여행, 장소, 도시, 일수, 대륙, 연속 기록이 있고, 버킷 리스트 탭에는 아직 앞에 남은 것들이 있습니다.',
  'help.ctx.atlas.bullet.5':
    '지역: 줌 레벨 5부터 지도가 주와 도 단위로 바뀌며, 각각 클릭해 표시하거나 해제할 수 있습니다.',
  'help.ctx.atlas.bullet.6':
    'Dawarich: 애드온을 연결하면 통계 왼쪽의 패널이 기록을 바탕으로 버킷 리스트 항목을 체크하고 나라를 추가합니다. 사용자의 확인 없이는 절대 진행되지 않습니다.',
  // mark-country
  'help.guide.mark-country.title': '나라를 방문한 곳으로 표시하기',
  'help.guide.mark-country.goal': 'TREK을 쓰기 전에 다녀온 나라를 추가해 지도와 집계에 포함합니다.',
  'help.guide.mark-country.step.1': '지도 상단의 검색창에 나라 이름을 입력합니다.',
  'help.guide.mark-country.step.2': '목록에서 고릅니다. 지도가 그곳으로 이동하고 그 나라의 팝업이 열립니다.',
  'help.guide.mark-country.step.3': '“방문으로 표시”를 선택합니다.',
  'help.guide.mark-country.result':
    '그 나라가 지도에서 자기 색을 갖고 “국가”가 하나 늘어납니다. 이 색은 고정입니다. 다른 나라를 더 표시해도 나머지 색이 뒤섞이지 않습니다.',
  'help.guide.mark-country.tip.1':
    '지도에서 회색 나라를 클릭해도 같은 팝업이 열립니다. 작은 나라에는 검색이 확실한 방법입니다.',
  'help.guide.mark-country.tip.2':
    '직접 표시한 나라는 그곳으로 가는 여행의 날짜와 상관없이 항상 방문한 곳으로 집계됩니다.',
  // unmark-country
  'help.guide.unmark-country.title': '표시한 나라 제거하기',
  'help.guide.unmark-country.goal': '직접 표시한 나라를 지도에서 다시 뺍니다.',
  'help.guide.unmark-country.step.1':
    '나라를 검색해 고르거나 지도에서 클릭합니다. 직접 표시한 나라라면 팝업이 제거할지 묻습니다.',
  'help.guide.unmark-country.step.2': '“제거”로 확인합니다.',
  'help.guide.unmark-country.result': '그 나라는 다시 회색이 되고 집계에서 빠집니다.',
  'help.guide.unmark-country.tip.1':
    '이 방법으로 제거할 수 있는 것은 직접 표시한 나라뿐입니다. 여행이나 장소가 있는 나라는 그것들이 남아 있는 한 유지됩니다. 직접 표시한 나라라면 패널의 상세 카드에도 “제거”가 있습니다.',
  // country-details
  'help.guide.country-details.title': '어떤 나라에서 무엇을 했는지 보기',
  'help.guide.country-details.goal': '방문한 나라를 열고, 그곳으로 데려다준 여행으로 바로 이동합니다.',
  'help.guide.country-details.step.1': '방문한 적 있는 나라를 검색합니다.',
  'help.guide.country-details.step.2':
    '고릅니다. 지도가 그곳으로 이동하고, 하단 패널에 국기, 장소, 여행, 그리고 여행마다 칩이 하나씩 달린 카드가 나타납니다.',
  'help.guide.country-details.result': '여행 칩을 클릭하면 그 여행이 플래너에서 열립니다.',
  'help.guide.country-details.tip.1':
    '지도에서 나라에 마우스를 올리면 같은 숫자와 함께 첫 방문과 마지막 방문이 보입니다.',
  // planned-countries
  'help.guide.planned-countries.title': '앞으로 갈 나라 표시하기',
  'help.guide.planned-countries.goal': '다가오는 여행의 나라를 방문한 곳으로 집계하지 않고 지도에 올립니다.',
  'help.guide.planned-countries.step.1':
    '오른쪽 위의 “예정된 국가 표시”를 켭니다. 옆의 숫자는 기다리고 있는 나라의 수입니다.',
  'help.guide.planned-countries.step.2':
    '예정된 나라를 검색해 고릅니다. 패널에는 “예정”이 표시되고, 지도의 툴팁에는 언제 가는지가 보입니다.',
  'help.guide.planned-countries.result':
    '예정된 나라는 점선 테두리로 나타나므로 이미 다녀온 곳처럼 보이지 않습니다. 스위치는 선택을 기억합니다.',
  'help.guide.planned-countries.tip.1':
    '나라는 그곳으로 가는 여행이 시작되는 순간 방문한 곳으로 집계됩니다. 진행 중인 여행도 포함됩니다. 날짜가 없는 여행은 통계에서 완전히 제외됩니다.',
  'help.guide.planned-countries.tip.2': '이 스위치는 다가오는 여행이 있는 동안에만 존재합니다.',
  // regions
  'help.guide.regions.title': '지역 표시하기',
  'help.guide.regions.goal': '나라보다 더 세밀하게, 다녀온 주, 도, 현을 표시합니다.',
  'help.guide.regions.step.1':
    '지역이 나타날 때까지 나라를 확대합니다(줌 레벨 5부터). 나라를 검색해 고르면 충분히 가까이 이동합니다.',
  'help.guide.regions.step.2':
    '지역을 클릭합니다. 마우스를 올리면 이름이 보이고, 팝업에는 지역과 그 나라가 표시됩니다.',
  'help.guide.regions.step.3': '“방문으로 표시”를 선택합니다.',
  'help.guide.regions.result':
    '지역이 그 나라의 색으로 채워집니다. 지역을 표시하면 아직 방문한 곳이 아니었던 나라도 방문한 곳으로 집계됩니다.',
  'help.guide.regions.tip.1':
    '방문한 지역을 클릭하면 “제거”가 나타납니다. 직접 표시한 지역이든 장소 때문에 표시된 지역이든 마찬가지입니다.',
  'help.guide.regions.tip.2': '실제 장소가 있는 지역은 자동으로 표시됩니다. 거기서는 할 일이 없습니다.',
  // search-place
  'help.guide.search-place.title': '장소를 찾아 그 지역 표시하기',
  'help.guide.search-place.goal': '도시가 어느 지역에 속하는지 몰라도, 밀라노를 검색해 롬바르디아를 표시합니다.',
  'help.guide.search-place.step.1':
    '검색창에 도시, 명소 또는 주소를 입력합니다. 나라가 먼저 나오고, 일치하는 장소는 그 아래 “장소” 제목 밑에 나타납니다.',
  'help.guide.search-place.step.2':
    '장소를 고릅니다. 지도가 그곳으로 이동하고 그 지점이 어느 지역에 있는지 알아냅니다.',
  'help.guide.search-place.step.3':
    '그 지역에 대해 “방문으로 표시”를 선택하거나, 아직 가기 전이라면 “버킷 리스트에 추가”를 선택합니다.',
  'help.guide.search-place.result':
    '지역이 표시되고 나라도 함께 표시됩니다. 지도 데이터에 지역 정보가 없는 나라는 나라 자체로 대신합니다.',
  'help.guide.search-place.tip.1': '장소는 TREK의 다른 곳과 같은 검색에서 오므로, 관리자가 설정한 제공자를 따릅니다.',
  // bucket-country
  'help.guide.bucket-country.title': '나라를 버킷 리스트에 올리기',
  'help.guide.bucket-country.goal':
    '다녀온 나라와는 별도로, 가고 싶은 나라의 버킷 리스트를 지도 위에서 바로 관리합니다.',
  'help.guide.bucket-country.step.1': '나라를 검색해 고르거나 지도에서 클릭합니다.',
  'help.guide.bucket-country.step.2': '“버킷 리스트에 추가”를 선택합니다.',
  'help.guide.bucket-country.step.3': '언제 갈지 이미 안다면 월과 연도를 고른 뒤 “버킷 리스트에 추가”로 확인합니다.',
  'help.guide.bucket-country.result':
    '그 나라는 나중에 다녀오면 갖게 될 색의 빗금으로 그려지고, 패널의 버킷 리스트 탭에 나타납니다.',
  'help.guide.bucket-country.tip.1': '나라가 목록에 오르면 같은 팝업에 “버킷 리스트에서 제거”가 나타납니다.',
  'help.guide.bucket-country.tip.2':
    '목표 날짜마다 항목 하나입니다. 같은 나라를 서로 다른 두 달에 올릴 수는 있지만, 같은 달에 두 번은 안 됩니다.',
  // bucket-place
  'help.guide.bucket-place.title': '장소를 버킷 리스트에 추가하기',
  'help.guide.bucket-place.goal': '꿈꾸는 도시, 명소, 주소를 좌표와 목표 날짜와 함께 저장합니다.',
  'help.guide.bucket-place.step.1': '하단 패널에서 버킷 리스트 탭을 엽니다.',
  'help.guide.bucket-place.step.2': '“장소 추가”를 클릭합니다.',
  'help.guide.bucket-place.step.3':
    '이름을 입력하고 검색 버튼을 누른 뒤, 일치하는 결과를 골라 장소에 좌표를 붙입니다. 이름만 입력하고 검색을 건너뛰어도 됩니다.',
  'help.guide.bucket-place.step.4': '원한다면 월과 연도를 고르고 “추가”를 클릭합니다.',
  'help.guide.bucket-place.result':
    '그 장소는 목표 날짜와 함께 버킷 리스트 맨 위에 놓입니다. 옆의 ×로 다시 제거합니다.',
  'help.guide.bucket-place.tip.1':
    '좌표가 있는 항목은 나중에 기록이 그곳에 있었음을 보여주면 Dawarich가 대신 체크해 줄 수 있는 항목입니다.',
  // stats
  'help.guide.stats.title': '통계 읽기',
  'help.guide.stats.goal': '패널의 숫자가 무엇을 세고 무엇을 세지 않는지 알아봅니다.',
  'help.guide.stats.step.1':
    '“국가”는 실제로 다녀온 서로 다른 나라의 수입니다. 예정된 나라는 그 옆에 표시될 뿐 포함되지 않습니다. “여행”, “장소”, “일”은 모든 여행에 걸친 합계입니다. “도시”는 장소의 주소에서 산출하므로 추정치입니다.',
  'help.guide.stats.step.2':
    '대륙별로 방문한 나라 수가 표시되고, 남극은 다녀온 뒤에 줄에 합류합니다. 그다음은 연속 기록, 즉 여행이 최소 한 번은 있는 연속된 햇수와, 올해 다녀온 여행 수입니다.',
  'help.guide.stats.result': '숫자는 여행을 계획하는 대로 따라옵니다. 여기서 관리할 것은 없습니다.',
  'help.guide.stats.tip.1':
    '도시는 주소 텍스트에서 읽어낼 뿐 따로 조회하지 않으므로, “Osteria Francescana, Italy”처럼 짧은 주소나 현으로 끝나는 주소는 도시가 아니라 지역으로 잡힐 수 있습니다.',
  'help.guide.stats.tip.2': '직접 표시한 나라는 “국가”와 대륙에는 집계되지만, 여행, 장소, 일수는 가져오지 않습니다.',
  // dawarich-countries
  'help.guide.dawarich-countries.title': '기록에서 국가 추가하기',
  'help.guide.dawarich-countries.goal':
    '지난 1년 동안 어느 나라에 있었는지 Dawarich가 말하게 하고, 확인한 나라를 지도에 올립니다.',
  'help.guide.dawarich-countries.step.1':
    'Dawarich 애드온이 연결되어 있으면 지도 아래쪽, 통계 왼쪽에 타일 두 개를 가진 Dawarich 패널이 있습니다. “국가”를 클릭합니다.',
  'help.guide.dawarich-countries.step.2':
    '대화 상자가 “국가” 탭으로 열립니다. “국가 찾기”를 클릭합니다. TREK이 최근 12개월의 기록이 닿은 국가와 도시를 한 달씩 읽으므로 잠시 기다리세요. Atlas에 아직 없는 국가는 국기, 도시 수, 그중 첫 도시의 이름과 함께 나열되고 처음부터 체크되어 있습니다. 행을 클릭하면 뺄 수 있습니다.',
  'help.guide.dawarich-countries.step.3':
    '오른쪽 아래 버튼으로 확정합니다. 다섯 행이 체크되어 있으면 “국가 5곳 추가”라고 적혀 있습니다. 대화 상자가 몇 곳이 추가되었는지 알려 주고, 닫으면 지도는 이미 다시 읽혀 있습니다.',
  'help.guide.dawarich-countries.result':
    '확인한 국가는 지도에서 색을 띠고 “국가”에 세어지며, Dawarich에서 왔다고 기록됩니다. 손으로 표시한 것은 건드리지 않습니다.',
  'help.guide.dawarich-countries.tip.1':
    'Atlas가 이미 방문한 것으로 보여 주는 국가는, 손으로 표시했든 여행에서 왔든 이전 확인에서 왔든 제외되므로 직접 한 표시가 다시 붙여지는 일은 없습니다. 이전에 Atlas에서 지운 국가는 여기서 확인하면 다시 돌아옵니다.',
  'help.guide.dawarich-countries.tip.2':
    'TREK이 맞추지 못한 국가 이름은 버려지지 않고 행 아래에 나열되며, “다시 확인”은 Dawarich에 한 번 더 묻습니다. 목록 아래의 안내는 최근 12개월을 확인했다고 말합니다. 그 기간은 고정입니다.',
  // dawarich-wishes
  'help.guide.dawarich-wishes.title': '기록에서 위시리스트 완료 처리하기',
  'help.guide.dawarich-wishes.goal':
    '버킷 리스트의 어떤 장소에 실제로 갔는지 알아내고, 그 일이 있었던 날짜로 완료 처리합니다.',
  'help.guide.dawarich-wishes.step.1': '지도 아래쪽, 통계 왼쪽의 Dawarich 패널에서 “위시리스트”를 클릭합니다.',
  'help.guide.dawarich-wishes.step.2':
    '대화 상자가 “위시리스트” 탭으로 열립니다. “위시리스트 확인”을 클릭합니다. TREK이 좌표가 있는 모든 항목에 대해 기록을 살핍니다. 도달한 소원은 얼마나 가까이 갔는지, 얼마나 머물렀는지, 어느 날이었는지와 함께 나열되고 처음부터 체크되어 있습니다. 이미 완료 처리한 것은 “이미 완료 처리됨”이라고 적힙니다. 목록 아래의 안내는 좌표가 없는 항목을 세고, 규칙도 거기에 있습니다. “250 m 이내에서 20분 이상 머무르면 소원을 이룬 것으로 봅니다.”',
  'help.guide.dawarich-wishes.step.3':
    '오른쪽 아래 버튼으로 확정합니다. 두 행이 체크되어 있으면 “2건 완료 처리”라고 적혀 있습니다. 그런 다음 대화 상자를 닫고 옆 패널의 “버킷 리스트” 탭을 엽니다.',
  'help.guide.dawarich-wishes.result':
    '각 소원에는 오늘이 아니라 머문 날짜가 적힌 초록 체크가 붙습니다. 툴팁은 “Dawarich 기록을 바탕으로 완료 처리됨”이라고 적히고, 날짜를 클릭하면 되돌립니다.',
  'help.guide.dawarich-wishes.tip.1':
    '지나쳐 간 것은 세지 않습니다. 규칙은 가까움과 시간을 모두 요구하고, 조건을 채운 머무름이 여럿이면 가장 긴 것이 뽑힙니다. 좌표가 없는 소원은 확인할 수 없으니, 이름만으로가 아니라 “장소 추가”의 검색으로 장소를 추가하세요.',
  'help.guide.dawarich-wishes.tip.2':
    '한 번의 확인은 최대 50개 항목을, 아직 완료 처리되지 않은 것부터 살피고, 그보다 많으면 그렇게 알립니다. 이미 완료 처리된 소원은 자기 날짜를 그대로 지킵니다.',

  // ── Screen: collections ───────────────────────────────────────────────────────────────
  'help.ctx.collections.title': '컬렉션',
  'help.ctx.collections.summary':
    'Collections는 여행 밖에 있는 나의 장소 라이브러리입니다. 찾아서 간직하고 싶은 장소를 이름 있는 목록으로 모으고, 각 장소에는 “아이디어”, “가고 싶은 곳”, “방문함” 중 하나의 상태가 붙습니다. 장소는 여행으로 복사되고 여행에서 복사될 뿐 연결되지 않으므로, 목록과 여행이 서로를 바꾸는 일은 없습니다.',
  'help.ctx.collections.bullet.1':
    '왼쪽의 목록 레일: 내 목록, 나와 공유된 목록, 수락을 기다리는 초대, 내가 소유한 모든 것을 합친 “모든 저장 항목”, 그리고 맨 위의 “새 목록”과 파일 가져오기.',
  'help.ctx.collections.bullet.2':
    '열린 목록의 헤더: 색, 커버, 설명과 링크, 멤버, 그리고 오른쪽의 “편집”, “내보내기”, “공유” 동작.',
  'help.ctx.collections.bullet.3':
    '장소 위의 필터 행: 상태, 카테고리, 평점, 정렬, 레이블 필터, 장소를 추가하는 +, 여행 가져오기, 일괄 작업을 위한 “선택”.',
  'help.ctx.collections.bullet.4':
    '장소 행: 아바타, 이름과 주소, 레이블과 카테고리, 그리고 한 번의 클릭으로 바뀌는 오른쪽의 상태 알약.',
  'help.ctx.collections.bullet.5':
    '오른쪽의 지도: 좌표가 있는 장소마다 핀 하나, 목록과 지도 전환, 검색창, 레이블 필터. 핀을 클릭하면 그 장소가 열립니다.',
  'help.ctx.collections.bullet.6':
    '상세 시트: 행을 클릭하면 커버, 카테고리, 레이블, 상태, 설명, 링크가 보이고 “편집”, “여행에 복사”, “목록에서 제거”를 쓸 수 있습니다.',
  // create-list
  'help.guide.create-list.title': '목록 만들기',
  'help.guide.create-list.goal': '색과 커버가 있는 이름 있는 새 목록을 시작해 장소를 담을 준비를 합니다.',
  'help.guide.create-list.step.1': '목록 레일 맨 위의 “새 목록”을 클릭합니다.',
  'help.guide.create-list.step.2':
    '목록에 이름을 붙이고 색을 고릅니다. 커버 이미지, 설명, 링크는 선택 사항이며 나중에 “편집”으로 추가할 수 있습니다.',
  'help.guide.create-list.step.3': '“만들기”를 클릭합니다.',
  'help.guide.create-list.result':
    '목록이 빈 상태로 열리고, “장소 추가”와 “여행에서 가져오기”가 채우는 두 가지 방법으로 제시됩니다.',
  'help.guide.create-list.tip.1':
    '커버는 직접 올린 이미지일 수도 있고, 같은 대화 상자의 Unsplash 검색으로 찾은 사진일 수도 있습니다.',
  // add-place
  'help.guide.add-place.title': '장소 추가하기',
  'help.guide.add-place.goal': '장소를 찾아 이름, 카테고리, 상태, 메모와 함께 한 번에 열린 목록에 저장합니다.',
  'help.guide.add-place.step.1': '장소 위 필터 행의 +를 클릭합니다.',
  'help.guide.add-place.step.2': '검색 필드에 장소를 입력하고 결과를 고릅니다. 이름, 주소, 좌표가 거기서 채워집니다.',
  'help.guide.add-place.step.3':
    '상태를 정하고, 원한다면 카테고리, 설명, 링크도 넣은 뒤 “추가”를 클릭합니다. 대화 상자는 다음 장소를 위해 열린 채로 남고, “취소”가 닫습니다.',
  'help.guide.add-place.result': '장소가 목록에 나타나고, 좌표가 있으면 지도의 핀으로도 나타납니다.',
  'help.guide.add-place.tip.1':
    '여행 안에서는 장소 인스펙터나 장소 메뉴의 “컬렉션에 저장”으로, 여행을 떠나지 않고 여행의 장소를 목록에 넣을 수 있습니다.',
  'help.guide.add-place.tip.2':
    '목록은 내 것이거나 내가 편집자 또는 관리자인 것이어야 합니다. “모든 저장 항목”이나 보기만 할 수 있는 목록에는 +가 없습니다.',
  // import-from-trip
  'help.guide.import-from-trip.title': '여행에서 장소 가져오기',
  'help.guide.import-from-trip.goal': '여행의 장소를 하나씩 저장하는 대신 한 번에 목록으로 가져옵니다.',
  'help.guide.import-from-trip.step.1':
    '필터 행에서 구름 화살표가 있는 가져오기 버튼을 클릭합니다. 빈 목록에서는 같은 동작이 “장소 추가” 옆에 있습니다.',
  'help.guide.import-from-trip.step.2': '내 여행 중 하나를 고릅니다.',
  'help.guide.import-from-trip.step.3':
    '원하는 장소에 체크합니다. 이미 목록에 있는 장소는 회색으로 표시되고, 여행의 어느 날에도 속하지 않은 장소는 처음부터 선택되어 있습니다. “새 항목만”은 이미 가진 것을 숨깁니다.',
  'help.guide.import-from-trip.step.4': '“가져오기”를 클릭합니다. 버튼에는 추가될 개수가 항상 표시됩니다.',
  'help.guide.import-from-trip.result':
    '장소가 이름, 주소, 좌표, 설명, 카테고리와 함께 목록으로 복사됩니다. 여행은 그대로입니다.',
  'help.guide.import-from-trip.tip.1': '이름이나 좌표가 같은 중복은 자동으로 건너뛰므로, 두 번 가져와도 문제없습니다.',
  'help.guide.import-from-trip.tip.2':
    '여행의 장소 목록 안에서는 대신 선택 모드의 “컬렉션에 저장”으로 직접 고른 장소들만 저장할 수 있습니다.',
  // place-status
  'help.guide.place-status.title': '장소의 상태 정하기',
  'help.guide.place-status.goal': '무엇이 아이디어이고, 무엇이 후보이며, 어디를 다녀왔는지 관리합니다.',
  'help.guide.place-status.step.1': '장소 행 오른쪽 끝의 상태 알약을 클릭합니다. “아이디어”가 “가고 싶은 곳”이 됩니다.',
  'help.guide.place-status.step.2': '다시 클릭하면 “방문함”이 되고, 한 번 더 클릭하면 “아이디어”로 돌아갑니다.',
  'help.guide.place-status.result': '알약과 그 색이 바로 바뀌고, 목록 위의 상태 필터 개수도 함께 바뀝니다.',
  'help.guide.place-status.tip.1': '상태는 Collections만의 것입니다. 장소를 여행에 복사해도 상태는 따라가지 않습니다.',
  'help.guide.place-status.tip.2':
    '여행에서는 “컬렉션에 저장”이 그 장소가 속한 목록마다 상태 알약을 보여주고, 장소 패널에는 선택한 장소에 대한 “방문함으로 표시” 동작이 있습니다.',
  // place-detail
  'help.guide.place-detail.title': '저장한 장소 열기',
  'help.guide.place-detail.goal': '장소에 대한 모든 것을 보고 작업합니다. 편집, 여행에 복사, 제거.',
  'help.guide.place-detail.step.1': '장소 행을 클릭합니다. 상세 시트가 목록 옆에 열리고 지도가 그 장소로 이동합니다.',
  'help.guide.place-detail.step.2':
    '아래쪽에 “편집”, “여행에 복사”, “목록에서 제거”가 있고, 커버의 카메라로 자동 사진을 내 사진으로 바꿀 수 있습니다.',
  'help.guide.place-detail.result':
    '“편집”을 누르면 이름, 카테고리, 레이블, 주소, 좌표, 설명, 링크를 시트 안에서 바로 고칠 수 있습니다.',
  'help.guide.place-detail.tip.1':
    '장소에 고유한 사진이 없으면 커버는 자동으로 가져옵니다. 직접 올리는 파일은 JPG, PNG, GIF, WebP이며 최대 20MB입니다.',
  'help.guide.place-detail.tip.2':
    '공유 목록의 멤버는 여기서 별점도 남길 수 있고, 필터 행의 평점 필터는 그 평균을 사용합니다.',
  // labels
  'help.guide.labels.title': '레이블로 장소 묶기',
  'help.guide.labels.goal': '공통 카테고리와는 별개로, 지역이나 날짜 같은 목록만의 레이블을 붙입니다.',
  'help.guide.labels.step.1': '필터 행의 레이블 컨트롤에서 레이블 관리자를 엽니다.',
  'help.guide.labels.step.2':
    '이름을 입력하고 색을 고른 뒤 “레이블 추가”를 클릭합니다. 기존 레이블의 이름 변경, 색 변경, 삭제도 같은 대화 상자에서 합니다.',
  'help.guide.labels.step.3':
    '“선택”을 켜고 장소에 체크한 뒤 선택 바의 “레이블 지정”을 클릭합니다. 장소 하나라면 상세 시트의 “편집”으로도 레이블을 붙일 수 있습니다.',
  'help.guide.labels.step.4':
    '필터 행에서 레이블을 하나 이상 고르면 목록과 지도가 그중 하나라도 가진 장소로 좁혀집니다.',
  'help.guide.labels.result':
    '레이블이 붙은 장소는 행에 레이블을 보여줍니다. 레이블 필터는 뷰어를 포함한 모든 멤버에게 제공됩니다.',
  'help.guide.labels.tip.1': '레이블은 만들어진 그 목록에만 속합니다. 장소를 다른 목록으로 옮기면 레이블은 사라집니다.',
  'help.guide.labels.tip.2': '레이블을 관리하고 지정하려면 목록의 편집 권한이 필요합니다.',
  // filter-select
  'help.guide.filter-select.title': '장소 필터링하고 선택하기',
  'help.guide.filter-select.goal': '목록을 좁히고 여러 장소를 한 번에 처리합니다.',
  'help.guide.filter-select.step.1':
    '필터 행의 드롭다운을 사용합니다. 상태, 카테고리, 최소 평점, 정렬 순서입니다. 각각 남게 될 장소의 수를 보여줍니다.',
  'help.guide.filter-select.step.2': '“선택”을 클릭합니다. 모든 행에 체크박스가 생기고 선택 바가 나타납니다.',
  'help.guide.filter-select.step.3':
    '장소에 체크하거나 현재 필터된 전부를 대상으로 “모두 선택”을 쓴 뒤 “레이블 지정”, “목록으로 이동”, “목록에 복제”, “여행에 복사”, “삭제” 중 하나를 고릅니다.',
  'help.guide.filter-select.result': '동작은 선택 전체에 한 번에 적용됩니다. 오른쪽의 ×로 선택 모드를 나갑니다.',
  'help.guide.filter-select.tip.1':
    '“모두 선택”은 필터를 따르므로, “가고 싶은 곳”으로 필터한 뒤 모두 선택하는 것이 후보를 한 번에 처리하는 빠른 방법입니다.',
  // copy-to-trip
  'help.guide.copy-to-trip.title': '장소를 여행에 복사하기',
  'help.guide.copy-to-trip.goal': '저장한 장소를 내 여행의 경유지로 만듭니다.',
  'help.guide.copy-to-trip.step.1':
    '“선택”을 켜고 장소에 체크하거나, 장소 하나를 열어 상세 시트의 “여행에 복사”를 사용합니다.',
  'help.guide.copy-to-trip.step.2': '선택 바의 “여행에 복사”를 클릭합니다.',
  'help.guide.copy-to-trip.step.3': '여행을 고릅니다. 검색창으로 긴 목록을 좁힐 수 있습니다.',
  'help.guide.copy-to-trip.result':
    '장소가 이름, 설명, 카테고리, 메모, 가격, 좌표, 사진, 태그와 함께 그 여행의 장소 목록에 들어갑니다. 컬렉션에서는 아무것도 바뀌지 않습니다.',
  'help.guide.copy-to-trip.tip.1':
    '공유 목록의 뷰어도 이 작업을 할 수 있습니다. 목록에서 복사해 갈 뿐 목록을 바꾸지는 않습니다.',
  // share-list
  'help.guide.share-list.title': '목록을 누군가와 공유하기',
  'help.guide.share-list.goal': '이 TREK의 다른 사람들과 목록을 실시간으로 함께 계획합니다.',
  'help.guide.share-list.step.1': '내 목록의 헤더에서 “공유”를 클릭합니다.',
  'help.guide.share-list.step.2': '사용자와 역할을 고릅니다. “뷰어”, “편집자”, “관리자” 중 하나입니다.',
  'help.guide.share-list.step.3':
    '“초대 보내기”를 클릭합니다. 상대가 자신의 목록 레일에서 초대를 수락할 때까지 “대기 중인 초대”로 표시됩니다.',
  'help.guide.share-list.result':
    '수락되면 상대에게는 “공유됨” 아래에 목록이 나타나고 모든 변경이 실시간으로 동기화됩니다. 멤버와 역할은 같은 대화 상자에서 계속 바꿀 수 있습니다.',
  'help.guide.share-list.tip.1':
    '뷰어는 보고, 평가하고, 장소를 자기 여행에 복사할 수 있습니다. 편집자는 장소와 레이블을 추가하고 편집합니다. 관리자는 삭제도 할 수 있습니다.',
  'help.guide.share-list.tip.2':
    '사람을 초대하고 내보내는 것은 소유자만 할 수 있습니다. 멤버는 스스로 공유 목록에서 나갈 수 있습니다.',
  // export-list
  'help.guide.export-list.title': '목록을 파일로 내보내기',
  'help.guide.export-list.goal': '다른 TREK에 있는 사람에게 목록을 건네거나 지도 앱으로 가져갑니다.',
  'help.guide.export-list.step.1': '목록의 헤더에서 “내보내기”를 클릭합니다.',
  'help.guide.export-list.step.2':
    '다른 TREK용으로는 레이블과 상태가 담긴 “TREK 목록”을, OsmAnd, Organic Maps, Garmin 기기, 그 밖에 웨이포인트를 읽는 앱용으로는 GPX를 고릅니다.',
  'help.guide.export-list.result': '파일이 다운로드됩니다. 공유 목록의 멤버라면 누구나 내보낼 수 있습니다.',
  'help.guide.export-list.tip.1':
    '좌표가 없는 장소는 GPX 웨이포인트가 될 수 없어 제외되며, TREK이 몇 개가 제외되었는지 알려줍니다.',
  'help.guide.export-list.tip.2':
    '평점, 멤버, 올린 사진은 일부러 남겨 둡니다. 이것들은 목록이 아니라 이 TREK에 속하기 때문입니다.',
  // import-file
  'help.guide.import-file.title': '파일에서 목록 가져오기',
  'help.guide.import-file.goal': 'TREK 목록 파일이나 GPX 파일을 새 목록으로, 또는 가지고 있는 목록에 가져옵니다.',
  'help.guide.import-file.step.1': '목록 레일에서 “새 목록” 옆에 있는 업로드 화살표 가져오기 버튼을 클릭합니다.',
  'help.guide.import-file.step.2':
    '파일을 고릅니다. TREK은 무언가 일어나기 전에 파일의 내용을 보여줍니다. 이름, 장소와 레이블의 개수입니다.',
  'help.guide.import-file.step.3':
    '“새 리스트”를 그대로 두고 원하면 이름을 바꾸거나, “리스트에 추가”를 골라 편집할 수 있는 목록에 장소를 넣은 뒤 “가져오기”를 클릭합니다.',
  'help.guide.import-file.result':
    '가져온 장소가 있는 목록으로 이동합니다. 목록에 추가하는 것은 언제나 추가만 합니다. 이미 있던 장소는 상태, 메모, 레이블을 그대로 유지합니다.',
  'help.guide.import-file.tip.1':
    'GPX에서는 이름이 있는 모든 웨이포인트가 장소가 됩니다. 트랙은 선이라 제외되며, 미리보기에 그 점이 몇 개였는지 표시됩니다.',
  'help.guide.import-file.tip.2':
    'TREK 목록도 GPX도 아닌 파일은 이유와 함께 거부됩니다. 읽을 수 없는 장소 하나는 그 장소만 건너뛰고, 파일 전체를 거부하지는 않습니다.',
  // edit-list
  'help.guide.edit-list.title': '목록 편집하거나 삭제하기',
  'help.guide.edit-list.goal': '목록의 이름, 색, 커버, 설명, 링크를 바꾸거나 목록을 없앱니다.',
  'help.guide.edit-list.step.1': '목록의 헤더에서 “편집”을 클릭합니다. 소유자에게만 보입니다.',
  'help.guide.edit-list.step.2':
    '원하는 것을 바꾸고 “저장”을 클릭합니다. 왼쪽 아래의 “목록 삭제”는 확인을 거친 뒤 목록을 모든 장소와 함께 없앱니다.',
  'help.guide.edit-list.result': '헤더에 새 색, 커버, 설명이 바로 반영됩니다.',
  'help.guide.edit-list.tip.1': '목록 삭제는 되돌릴 수 없습니다. 사본을 남기고 싶다면 먼저 내보내세요.',
  // all-saved
  'help.guide.all-saved.title': '내 라이브러리 전체 검색하기',
  'help.guide.all-saved.goal': '내가 소유한 모든 목록을 한 번에 살펴봅니다.',
  'help.guide.all-saved.step.1':
    '목록 레일의 “모든 저장 항목”을 클릭합니다. 내가 소유하거나 공동 소유한 모든 목록의 장소를 합쳐서 보여줍니다.',
  'help.guide.all-saved.step.2':
    '다른 목록에서처럼 검색창과 필터를 사용합니다. “선택”도 여기서 여행에 복사하는 데 쓸 수 있습니다.',
  'help.guide.all-saved.result':
    '저장한 모든 장소를 한 화면에서 봅니다. 담을 목록이 하나로 정해지지 않으므로 추가나 가져오기는 없습니다.',
  'help.guide.all-saved.tip.1': '레이블은 목록별이므로 “모든 저장 항목”에서는 레이블 필터가 제공되지 않습니다.',

  // ── Screen: journey ───────────────────────────────────────────────────────────────────
  'help.ctx.journey.title': 'Journey',
  'help.ctx.journey.summary':
    'Journey는 사진이 중심인 여행 일기입니다. 모든 Journey는 하나 이상의 여행에 묶여 있고, 이야기, 사진, 기분, 날씨가 담긴 기록으로 하루하루 자라납니다. 이 화면에는 나의 Journey가 나열되며, 하나를 열면 쓸 수 있습니다.',
  'help.ctx.journey.bullet.1':
    '상단의 배너는 진행 중인 Journey, 없으면 가장 최근 Journey를 기록, 사진, 장소 수와 함께 보여줍니다. “계속 쓰기”는 그것을 오늘 날짜로 엽니다.',
  'help.ctx.journey.bullet.2':
    '그 아래에는 Journey마다 커버, 부제목, 날짜, 개수가 담긴 카드가 하나씩 있습니다. 카드를 클릭하면 열립니다.',
  'help.ctx.journey.bullet.3': '그리드의 마지막 카드인 “새 Journey 만들기”는 여행에서 Journey를 시작합니다.',
  // create-journey
  'help.guide.create-journey.title': 'Journey 만들기',
  'help.guide.create-journey.goal': '여행의 일기를 시작합니다. 그 여행의 장소들은 이미 제안으로 기다리고 있습니다.',
  'help.guide.create-journey.step.1': '그리드의 마지막 카드인 “새 Journey 만들기”를 클릭합니다.',
  'help.guide.create-journey.step.2':
    '이름을 붙이고, 원하면 부제목도 붙인 다음, 속하는 여행에 체크합니다. 카운터는 장소가 몇 개 들어올지 알려줍니다.',
  'help.guide.create-journey.step.3': '“Journey 만들기”를 클릭합니다.',
  'help.guide.create-journey.result':
    '일기가 열립니다. 연결된 여행의 모든 장소가 타임라인에 제안으로 놓이고, 장소가 걸쳐 있는 날마다 하나씩 생겨 바로 써 넣을 수 있습니다.',
  'help.guide.create-journey.tip.1': '여행은 나중에 “Journey 설정”에서 더 연결할 수 있습니다.',
  'help.guide.create-journey.tip.2': '여행이 없는 Journey도 됩니다. 그때는 기록을 직접 추가합니다.',
  // open-journey
  'help.guide.open-journey.title': 'Journey 열기',
  'help.guide.open-journey.goal': '일기 안으로 들어가고, 어디에서 열리는지 알아둡니다.',
  'help.guide.open-journey.step.1':
    '카드를 클릭합니다. 각 카드에는 커버, 날짜, 그리고 그 Journey에 담긴 기록, 사진, 장소의 수가 보입니다.',
  'help.guide.open-journey.result':
    '진행 중인 Journey는 오늘 날짜로 열리고, 아직 아무것도 쓰지 않았다면 오늘 이전의 마지막 기록에서 열립니다. 끝난 Journey는 처음에서 열립니다.',
  'help.guide.open-journey.tip.1': '커버는 “Journey 설정”에서 따로 정하지 않는 한 Journey의 첫 사진입니다.',
  // continue-writing
  'help.guide.continue-writing.title': '진행 중인 Journey 이어 쓰기',
  'help.guide.continue-writing.goal': '지금 하고 있는 Journey의 오늘 페이지로 곧장 들어갑니다.',
  'help.guide.continue-writing.step.1':
    '상단 배너의 “계속 쓰기”를 클릭합니다. 배너에는 진행 중인 Journey, 없으면 가장 최근 Journey가 보입니다.',
  'help.guide.continue-writing.result':
    '일기가 오늘 날짜로 열리고, 아직 아무것도 쓰지 않았다면 오늘 이전의 마지막 기록에서 열립니다.',
  'help.guide.continue-writing.tip.1':
    '배너는 아직 Journey가 없는 여행에 대한 제안도 보여줍니다. “닫기”는 그 제안을 숨깁니다.',

  // ── Screen: journey-detail ────────────────────────────────────────────────────────────
  'help.ctx.journey-detail.title': '일기',
  'help.ctx.journey-detail.summary':
    '열려 있는 하나의 Journey입니다. 왼쪽에는 하루하루의 타임라인이, 오른쪽에는 모든 기록과 연결된 여행의 장소가 담긴 지도가 있습니다. 일기에 무언가를 더하는 것은 모두 상단에 있고, 헤더에는 개수, “Studio”, 제안 스위치, “Journey 설정”이 있습니다.',
  'help.ctx.journey-detail.bullet.1':
    '헤더: 커버, 제목과 부제목, 일수, 장소, 기록, 사진 수, 그리고 오른쪽에 “Studio”, 제안 스위치, “Journey 설정”.',
  'help.ctx.journey-detail.bullet.2': '툴바: “타임라인”과 “갤러리” 탭, “이 여행에서 검색”, “항목 추가”.',
  'help.ctx.journey-detail.bullet.3':
    '타임라인: 날마다 섹션이 하나씩 있고, +로 그날에 기록을 추가합니다. 사진, 기분, 날씨, 이야기가 담긴 기록 카드와, 여행에서 온 제안이 “이 제안 넘기기”와 함께 더 옅은 모양으로 놓입니다.',
  'help.ctx.journey-detail.bullet.4':
    '지도: 기록은 핀으로 표시되어 날짜 순으로 점선으로 이어지고, 여행의 장소와 그 여행에 가져온 GPX 트랙도 보입니다.',
  'help.ctx.journey-detail.bullet.5':
    '“Journey 설정”: 커버, 이름과 부제목, 지도의 트랙, 기록 항목, 넘긴 제안, 연결된 여행, 기여자, 공개 공유, 보관과 삭제.',
  'help.ctx.journey-detail.bullet.6':
    '긴 타임라인 위에는 둥근 버튼 두 개가 떠 있습니다. 맨 위로, 그리고 마지막 기록으로.',
  // add-entry
  'help.guide.add-entry.title': '기록 쓰기',
  'help.guide.add-entry.goal': '제목, 본문, 기분, 날씨가 담긴 하루의 이야기를 추가합니다.',
  'help.guide.add-entry.step.1': '툴바의 “항목 추가”를 클릭하거나, 날짜 헤더의 +를 클릭해 그날에서 시작합니다.',
  'help.guide.add-entry.step.2':
    '그 순간에 이름을 붙이고 이야기를 씁니다. 본문 위의 툴바로 굵게, 기울임, 제목, 인용, 링크, 목록을 Markdown으로 넣을 수 있습니다.',
  'help.guide.add-entry.step.3':
    '기분과 날씨를 고르고, 날짜를 확인하고, 원하면 위치를 고정합니다. 장소를 검색하거나 현재 위치를 씁니다.',
  'help.guide.add-entry.step.4': '“저장”을 클릭합니다.',
  'help.guide.add-entry.result': '기록이 타임라인의 그날에, 그리고 지도에 핀으로 나타납니다. 헤더의 개수가 갱신됩니다.',
  'help.guide.add-entry.tip.1': '제안에 써 넣는 것도 같은 편집기이며, 장소가 이미 정해져 있습니다.',
  'help.guide.add-entry.tip.2':
    '아래의 태그는 “hidden gem”이나 “best meal” 같은 자유 텍스트이고, 검색으로 찾을 수 있습니다.',
  // entry-photos
  'help.guide.entry-photos.title': '기록에 사진과 동영상 추가하기',
  'help.guide.entry-photos.goal': '하루에 사진을 올립니다. 첫 번째 사진이 기록의 커버가 됩니다.',
  'help.guide.entry-photos.step.1': '카드의 ⋯로 기록 메뉴를 열고 “편집”을 선택합니다.',
  'help.guide.entry-photos.step.2':
    '“사진 업로드”를 클릭해 파일을 고릅니다. “갤러리에서”는 이미 Journey의 갤러리에 있는 사진을 가져오고, “External photos”는 연결된 Immich나 Synology 라이브러리에서 그날의 사진을 찾습니다.',
  'help.guide.entry-photos.step.3':
    '사진에 마우스를 올리면 나오는 “1번째로 설정”으로 커버를 고른 뒤 “저장”을 클릭합니다.',
  'help.guide.entry-photos.result': '사진이 카드와 갤러리에 보입니다. 첫 번째 사진이 어디서나 썸네일이 됩니다.',
  'help.guide.entry-photos.tip.1':
    '동영상도 같은 방법으로 기록에 올립니다. mp4, m4v, webm, mov를 500MB까지, 업로드한 그대로 저장됩니다.',
  'help.guide.entry-photos.tip.2':
    'iPhone의 HEIC 파일은 업로드 시 JPEG로 변환되며, 이때 GPS와 카메라 메타데이터가 사라집니다.',
  // suggestions
  'help.guide.suggestions.title': '제안 활용하기 또는 넘기기',
  'help.guide.suggestions.goal': '여행의 장소를 기록으로 바꾸고, 쓰지 않을 것은 치웁니다.',
  'help.guide.suggestions.step.1':
    '제안은 장소 이름이 기울임꼴로 적힌 옅은 카드입니다. 클릭하면 장소와 날짜가 이미 정해진 편집기가 열립니다.',
  'help.guide.suggestions.step.2':
    '쓰지 않을 카드에서 “이 제안 넘기기”를 클릭합니다. 삭제되지 않고 타임라인에서만 사라지며, 여행 동기화가 다시 제안하지 않습니다.',
  'help.guide.suggestions.step.3':
    '마음이 바뀌었다면, “Journey 설정”에 넘긴 개수가 보이고 “넘긴 제안 되돌리기”가 모두 되돌립니다.',
  'help.guide.suggestions.result':
    '타임라인에는 쓰려는 것만 남습니다. 읽는 동안에는 헤더의 스위치가 모든 제안을 한 번에 숨깁니다.',
  'help.guide.suggestions.tip.1': '이틀에 걸친 장소는 각각의 날에 제안을 하나씩 만듭니다.',
  'help.guide.suggestions.tip.2': '제안은 통계에 절대 집계되지 않습니다. 쓴 기록만 집계됩니다.',
  // add-on-day
  'help.guide.add-on-day.title': '지난 날에 기록 추가하기',
  'help.guide.add-on-day.goal': '이미 지나간 날에 대해, 나중에 날짜를 고치지 않고 씁니다.',
  'help.guide.add-on-day.step.1': '그날의 헤더에 있는 +를 클릭합니다.',
  'help.guide.add-on-day.step.2': '그 날짜가 정해진 채로 편집기가 열립니다. 평소처럼 쓰고 “저장”합니다.',
  'help.guide.add-on-day.result': '기록이 바로 맞는 날에 들어갑니다.',
  'help.guide.add-on-day.tip.1': '하루 안에서는 기록 메뉴의 화살표로 앞이나 뒤로 옮길 수 있습니다.',
  // pros-cons
  'help.guide.pros-cons.title': '총평 추가하기',
  'help.guide.pros-cons.goal': '무엇이 좋았고 무엇이 아니었는지로 하루를 정리합니다.',
  'help.guide.pros-cons.step.1':
    '편집기에서 이야기 아래의 “장단점”을 찾습니다. “장점”이나 “단점”에 한 가지를 적고, 다음 것은 “하나 더 추가”로 넣습니다.',
  'help.guide.pros-cons.step.2': '저장합니다. 총평이 카드에 두 개의 짧은 목록으로 보입니다.',
  'help.guide.pros-cons.result': '이야기 아래에서 좋았던 점과 아쉬웠던 점이 한눈에 들어옵니다.',
  'help.guide.pros-cons.tip.1': '총평을 쓰지 않는 Journey는 “Journey 설정”의 “기록 항목”에서 이 섹션을 끌 수 있습니다.',
  // search-journey
  'help.guide.search-journey.title': '긴 일기에서 찾기',
  'help.guide.search-journey.goal': '몇 주치를 스크롤하지 않고 원하는 기록으로 갑니다.',
  'help.guide.search-journey.step.1':
    '툴바의 “이 여행에서 검색”에 입력합니다. 입력하는 대로 타임라인이 제목, 이야기, 장소, 태그를 대상으로 걸러집니다. 악센트와 대소문자는 상관없습니다.',
  'help.guide.search-journey.step.2':
    '헤더의 제안 스위치는 읽는 동안 아직 쓰지 않은 카드를 숨깁니다. 타임라인이 길어지면 아래쪽 가장자리 위에 둥근 버튼 두 개가 떠 있습니다. 맨 위로, 그리고 마지막 기록으로.',
  'help.guide.search-journey.result': '일치하는 기록만 남습니다. 검색창을 비우면 다시 전부 보입니다.',
  'help.guide.search-journey.tip.1':
    '진행 중인 Journey는 오늘 날짜로 열리므로, 현재 페이지는 보통 이미 보이는 상태입니다.',
  'help.guide.search-journey.tip.2': '태그도 포함됩니다. “hidden gem”을 검색하면 그 태그가 달린 모든 기록이 나옵니다.',
  // gallery-map
  'help.guide.gallery-map.title': '갤러리와 지도 둘러보기',
  'help.guide.gallery-map.goal': 'Journey 전체를 사진으로, 그리고 지도 위의 장소로 봅니다.',
  'help.guide.gallery-map.step.1':
    '툴바에서 “갤러리”로 전환합니다. 모든 기록의 모든 사진과, 갤러리에 직접 업로드한 사진이 있습니다. 하나를 클릭하면 라이트박스로 열립니다.',
  'help.guide.gallery-map.step.2':
    '오른쪽 지도는 기록을 날짜 순의 핀으로, 연결된 여행의 장소를, 그리고 그 여행에 가져온 GPX 트랙을 플래너에서의 색 그대로 보여줍니다.',
  'help.guide.gallery-map.result':
    '트랙에 마우스를 올리면 이름이 보입니다. 기록 사이의 점선은 TREK이 그린 것이고, 트랙은 실제로 기록한 경로입니다.',
  'help.guide.gallery-map.tip.1': '트랙은 “Journey 설정”에서 Journey별로 끌 수 있습니다.',
  'help.guide.gallery-map.tip.2':
    '위치가 있는 갤러리 사진은 “갤러리”와 “지도”가 모두 공유될 때 공개 지도에도 나타납니다.',
  // entry-fields
  'help.guide.entry-fields.title': '기록 항목 끄기',
  'help.guide.entry-fields.goal': '편집기를 이 Journey에서 쓰는 것만으로 줄입니다.',
  'help.guide.entry-fields.step.1': '헤더에서 “Journey 설정”을 엽니다.',
  'help.guide.entry-fields.step.2': '“기록 항목”에서 “기분”, “날씨”, “좋은 점과 아쉬운 점”을 끕니다.',
  'help.guide.entry-fields.result':
    '편집기가 더 이상 그것을 묻지 않습니다. 쓴 내용은 사라지지 않습니다. 항목을 다시 켜면 저장된 값이 다시 보이고, 공유된 Journey에서도 같은 항목이 숨겨집니다.',
  'help.guide.entry-fields.tip.1': '스위치는 Journey별이므로 출장과 휴가를 다르게 둘 수 있습니다.',
  // link-trip
  'help.guide.link-trip.title': '다른 여행 연결하기',
  'help.guide.link-trip.goal': '두 번째 여행의 장소를 제안으로 일기에 가져옵니다.',
  'help.guide.link-trip.step.1': '헤더에서 “Journey 설정”을 엽니다.',
  'help.guide.link-trip.step.2': '연결된 여행 아래의 “여행 추가”를 클릭합니다.',
  'help.guide.link-trip.step.3': '여행을 고릅니다.',
  'help.guide.link-trip.result':
    '그 여행의 장소가 각자의 날에 제안으로 타임라인에 들어오고, GPX 트랙이 지도에 더해집니다.',
  'help.guide.link-trip.tip.1': '연결된 여행 옆의 ×는 연결을 다시 해제합니다. 쓴 기록은 남습니다.',
  'help.guide.link-trip.tip.2': '어떤 날의 기록은 그날을 몇 개의 여행이 덮고 있든 한 번만 집계됩니다.',
  // share-public
  'help.guide.share-public.title': 'Journey 공개로 공유하기',
  'help.guide.share-public.goal': 'TREK 계정이 없는 사람에게 읽기 전용 링크를 줍니다.',
  'help.guide.share-public.step.1': '“Journey 설정”을 열고 “공개 공유”를 찾습니다.',
  'help.guide.share-public.step.2': '“공유 링크 만들기”를 클릭합니다.',
  'help.guide.share-public.step.3':
    '방문자에게 보일 것을 고릅니다. “타임라인”, “갤러리”, “지도”는 각각 별도의 스위치입니다. “복사”는 링크를 클립보드에 넣습니다.',
  'help.guide.share-public.result':
    '링크가 있는 사람은 켜진 섹션만 보고 그 밖에는 아무것도 보지 못합니다. “기록 항목”에서 끈 항목은 거기서도 숨겨진 채입니다.',
  'help.guide.share-public.tip.1':
    '사진은 “갤러리”와 “지도”가 모두 켜져 있을 때만 공개 지도에 나타납니다. “지도”가 꺼져 있으면 좌표는 서버를 떠나기 전에 제거됩니다.',
  'help.guide.share-public.tip.2': '공유를 끝내려면 같은 자리에서 링크를 삭제합니다.',
  // contributors
  'help.guide.contributors.title': '함께 쓰기',
  'help.guide.contributors.goal': '여행 동행자가 자기 기록과 사진을 추가하게 합니다.',
  'help.guide.contributors.step.1': '“Journey 설정”을 열고 기여자까지 스크롤합니다.',
  'help.guide.contributors.step.2': '“기여자 초대”를 클릭하고 이름이나 이메일로 사용자를 검색합니다.',
  'help.guide.contributors.step.3': '역할을 고르고 확인합니다.',
  'help.guide.contributors.result':
    'Journey가 그 사람의 목록에 나타나고, 그 사람의 기록에는 그 사람의 이름이 붙습니다. 기여자를 빼려면 옆의 ×를 씁니다.',
  'help.guide.contributors.tip.1':
    '기여자는 이 TREK에 있는 사람을 위한 것입니다. 그 밖의 모든 사람에게는 공개 링크가 있습니다.',
  // studio
  'help.guide.studio.title': 'Journey를 포토북으로 꾸미기',
  'help.guide.studio.goal': '일기를 인쇄할 수 있는 페이지로 만듭니다.',
  'help.guide.studio.step.1': '헤더의 “Studio”를 클릭합니다. 디자이너가 Journey 위에 열립니다.',
  'help.guide.studio.step.2': '상단 바 왼쪽의 Journey 이름이 돌아가는 길입니다. 있던 자리로 데려다줍니다.',
  'help.guide.studio.result':
    '왼쪽에 페이지 레일, 작업대에 펼침면, 오른쪽에 속성이 있습니다. “Auto layout”은 기록으로 책을 만들고, “Export”는 인쇄용 PDF를 만듭니다.',
  'help.guide.studio.tip.1': 'Studio는 너비 1024px 이상의 창이 필요하며 휴대폰에서는 제공되지 않습니다.',
  'help.guide.studio.tip.2':
    '책은 Journey의 접근 권한을 물려받습니다. Journey를 읽을 수 있는 사람은 열 수 있고, 편집할 수 있는 사람은 저장할 수 있습니다.',
  // archive-journey
  'help.guide.archive-journey.title': 'Journey 보관하기 또는 삭제하기',
  'help.guide.archive-journey.goal': '끝난 Journey를 닫거나, 하나를 영구히 없앱니다.',
  'help.guide.archive-journey.step.1': '“Journey 설정”을 엽니다.',
  'help.guide.archive-journey.step.2':
    '맨 아래의 “Journey 보관”은 Journey를 끝내고 보관됨으로 표시하며, “Journey 복원”은 되돌립니다. “삭제”는 확인 후 모든 기록과 사진과 함께 없앱니다.',
  'help.guide.archive-journey.result':
    '보관된 Journey는 계속 읽고 공유할 수 있습니다. 다만 더 이상 오늘 날짜로 열리지 않을 뿐입니다.',
  'help.guide.archive-journey.tip.1': '삭제는 되돌릴 수 없으며, Journey가 연결되어 있던 여행에는 손대지 않습니다.',
  'help.guide.archive-journey.tip.2': '커버, 이름, 부제목은 같은 대화상자의 맨 위에 있습니다.',

  // ── Screen: journey-studio ────────────────────────────────────────────────────────────
  'help.ctx.journey-studio.title': 'Studio',
  'help.ctx.journey-studio.summary':
    'TREK Studio는 여행을 인쇄할 수 있는 포토북으로 배치합니다. 일기 위에 열리며, 왼쪽에 페이지 사이드바와 콘텐츠, 가운데에 작업 중인 펼침면, 오른쪽에 그 속성이 있습니다. Auto layout이 항목에서 첫 초안을 만들고, 그다음부터는 옮기고 자르고 스타일을 바꾸는 모든 것이 내 몫이며, 모든 단계를 되돌릴 수 있습니다.',
  'help.ctx.journey-studio.bullet.1':
    '상단 바: Back to the journey, Book view, Undo와 Redo, Page format, Auto layout, Export. 제목 옆의 “저장됨” 표시로 책이 저장된 시점을 알 수 있습니다.',
  'help.ctx.journey-studio.bullet.2':
    '왼쪽 사이드바에는 다섯 섹션이 있습니다. Pages, Content(여행의 사진과 항목), Elements(텍스트, 도형, 선, 그리드, 프레임, 아이콘), “여행”(여행에서 만들어지는 지도, 국가, 국기, 표시), Layouts입니다.',
  'help.ctx.journey-studio.bullet.3':
    '작업 영역: 도련과 안전 영역이 표시된 현재 펼침면, 그 아래의 확대 바, Fit to view, 오른쪽의 “이 펼침면 내려받기”.',
  'help.ctx.journey-studio.bullet.4':
    '오른쪽의 Properties: 선택한 것의 위치와 크기, 자르기와 초점, Fill 또는 Fit, 모양, 모서리, 프레임, 쌓임 순서, 잠금. 아무것도 선택하지 않으면 쪽 번호와 문서입니다.',
  'help.ctx.journey-studio.bullet.5':
    '책은 제본된 책의 형태를 갖습니다. 표지, 낱장인 첫 페이지, 펼침면들, 낱장인 마지막 페이지, 뒤표지입니다. 쪽 번호는 첫 페이지부터 세고 보이는 그대로 인쇄됩니다.',
  'help.ctx.journey-studio.bullet.6':
    '여러 사람이 동시에 디자인할 수 있습니다. 모두가 다른 사람의 포인터를 이름과 함께 보고, 다른 사람이 바꾼 버전에 저장하면 그 작업을 덮어쓰는 대신 충돌로 돌아옵니다.',
  // studio-auto-layout
  'help.guide.studio-auto-layout.title': '책을 자동으로 만들기',
  'help.guide.studio-auto-layout.goal': '일기의 항목과 사진으로 완전한 첫 초안을 한 번의 클릭으로 얻습니다.',
  'help.guide.studio-auto-layout.step.1': '상단 바에서 Auto layout을 클릭합니다.',
  'help.guide.studio-auto-layout.step.2':
    '“책 전체”를 고릅니다. 제목과 페이지 설정은 유지한 채 모든 페이지를 교체합니다. “이 페이지”는 화면에 있는 펼침면만 다시 만들며, 항목에서 만들어진 펼침면에서만 제공됩니다.',
  'help.guide.studio-auto-layout.step.3':
    'Pages 사이드바를 훑어봅니다. 이전 상태가 더 좋았다면 Undo가 레이아웃 전체를 되돌립니다.',
  'help.guide.studio-auto-layout.result':
    '항목마다 펼침면 하나가 순서대로 만들어지고, 사진, 제목, 이야기가 배치됩니다. 각 요소는 편집하기 전까지 항목을 계속 따라갑니다.',
  'help.guide.studio-auto-layout.tip.1': '두 항목 모두 일반적인 되돌리기 단계이므로 자유롭게 시도해 보세요.',
  'help.guide.studio-auto-layout.tip.2':
    'Auto layout이 항목에 묶어 둔 요소는 Properties에서 손대기 전까지 그 항목의 편집을 따라갑니다. 손대면 연결이 끊어집니다.',
  // studio-pages
  'help.guide.studio-pages.title': '펼침면 추가, 이동, 삭제하기',
  'help.guide.studio-pages.goal': '책을 페이지 단위로 만들어 갑니다.',
  'help.guide.studio-pages.step.1':
    '사이드바에서 Pages를 엽니다. 썸네일은 책의 순서 그대로입니다. 표지, 첫 페이지, 펼침면들, 마지막 페이지, 뒤표지.',
  'help.guide.studio-pages.step.2':
    '맨 아래의 “페이지 추가”는 마지막 페이지 앞에 새 펼침면을 놓습니다. 두 썸네일 사이의 +는 바로 그 자리에 삽입합니다.',
  'help.guide.studio-pages.step.3':
    '썸네일에 마우스를 올리면 동작이 나타납니다. “앞으로 이동”, “뒤로 이동”, “페이지 복제”, “페이지 삭제”입니다. 썸네일을 클릭하면 그 펼침면이 작업 영역에 열립니다.',
  'help.guide.studio-pages.result':
    '표지, 첫 페이지와 마지막 페이지, 뒤표지는 제자리에 남습니다. 새 펼침면은 항상 그 사이에 들어갑니다.',
  'help.guide.studio-pages.tip.1': '상단 바의 Book view는 제본될 모습 그대로 책 전체를 낱장으로 보여줍니다.',
  'help.guide.studio-pages.tip.2': '쪽 번호는 아무것도 선택하지 않은 상태에서 Properties의 “문서” 아래에서 켭니다.',
  // studio-layouts
  'help.guide.studio-layouts.title': '펼침면에 레이아웃 적용하기',
  'help.guide.studio-layouts.goal': '펼침면에 사진과 텍스트 프레임이 미리 짜인 배치를 입힙니다.',
  'help.guide.studio-layouts.step.1':
    '사이드바에서 Layouts를 엽니다. 펼침면 레이아웃 13개와, 표지, 뒤표지, 낱쪽을 위한 별도 세트가 있습니다.',
  'help.guide.studio-layouts.step.2':
    '하나를 클릭합니다. 작업 영역의 펼침면이 그 프레임을 받고, 이미 있던 사진과 텍스트가 그 안에 채워집니다.',
  'help.guide.studio-layouts.result':
    '빈 프레임은 콘텐츠를 기다립니다. Content에서 사진을 끌어다 놓거나 Add to this page를 사용합니다.',
  'help.guide.studio-layouts.tip.1': '레이아웃도 다른 것과 같은 되돌리기 단계입니다.',
  // studio-content
  'help.guide.studio-content.title': '사진과 항목을 페이지에 놓기',
  'help.guide.studio-content.goal': '여행 자체의 재료를 펼침면으로 가져옵니다.',
  'help.guide.studio-content.step.1':
    '사이드바에서 Content를 엽니다. Photos에는 여행의 모든 사진이, Entries에는 텍스트가 있는 항목이 나열됩니다.',
  'help.guide.studio-content.step.2':
    '사진을 펼침면이나 빈 프레임으로 끌어다 놓거나, 그 아래의 Add to this page를 클릭합니다. “사진 업로드”는 아직 여행에 없는 사진을 추가합니다.',
  'help.guide.studio-content.step.3':
    '항목 아래의 Title, Story, Place는 그 텍스트를 텍스트 요소로 페이지에 놓습니다. 날짜와 좌표는 표시로 들어오고, 항목의 사진은 바로 거기에 나열됩니다.',
  'help.guide.studio-content.result':
    '끌어다 놓은 사진은 사진 요소가 됩니다. 텍스트는 편집하기 전까지 항목을 계속 따라갑니다.',
  'help.guide.studio-content.tip.1': 'Content 상단의 검색창은 두 목록을 모두 거릅니다.',
  'help.guide.studio-content.tip.2': '바탕화면의 파일을 작업 영역에 끌어다 놓으면 업로드와 배치가 한 번에 됩니다.',
  // studio-elements
  'help.guide.studio-elements.title': '텍스트, 도형, 아이콘 추가하기',
  'help.guide.studio-elements.goal': '사진과 이야기 너머로 펼침면을 꾸밉니다.',
  'help.guide.studio-elements.step.1': '사이드바에서 Elements를 엽니다.',
  'help.guide.studio-elements.step.2':
    '제목이나 캡션용 텍스트 스타일, 도형, 선, 그리드, 프레임 스타일이 있는 빈 프레임, 검색 가능한 라이브러리의 아이콘 중 하나를 클릭합니다. 각각 펼침면 가운데에 놓여 바로 옮길 수 있습니다.',
  'help.guide.studio-elements.result':
    '텍스트 요소를 더블클릭하면 입력할 수 있습니다. Properties에 글꼴, 굵기, 크기, 간격, 정렬이 있습니다.',
  'help.guide.studio-elements.tip.1': '프레임은 빈 사진 자리입니다. 사진은 나중에 끌어다 놓으면 됩니다.',
  // studio-travel
  'help.guide.studio-travel.title': '지도, 국기, 수치 추가하기',
  'help.guide.studio-travel.goal': '여행 자체를 페이지 위의 수치로 바꿉니다.',
  'help.guide.studio-travel.step.1': '사이드바에서 “여행”을 엽니다.',
  'help.guide.studio-travel.step.2':
    '추가할 것을 고릅니다. 항목의 경로 지도, 국가 윤곽, 국가 목록이나 그리드, 국기, 날짜·일수·거리 표시, 여행 전체 요약. 각각 여행의 데이터로 만들어지고 데이터와 함께 갱신됩니다.',
  'help.guide.studio-travel.result': '요소가 펼침면에 나타납니다. Properties로 스타일을, 지도는 범위를 조정합니다.',
  'help.guide.studio-travel.tip.1':
    '표시는 펼침면의 바탕이 된 항목을 따르므로, 자동 배치된 펼침면의 날짜 표시는 이미 그날을 보여줍니다.',
  // studio-properties
  'help.guide.studio-properties.title': '선택한 것 편집하기',
  'help.guide.studio-properties.goal': '인스펙터로 요소를 옮기고, 자르고, 꾸미고, 쌓습니다.',
  'help.guide.studio-properties.step.1':
    '펼침면의 요소를 클릭합니다. 크기와 회전을 위한 핸들이 나타나고, 끌면 옮겨집니다.',
  'help.guide.studio-properties.step.2':
    '오른쪽의 Properties는 선택을 따라갑니다. 위치와 크기, 프레임 안에 남길 부분을 정하는 초점이 있는 Crop, Fill 또는 Fit, Look 필터, Corner 반경, “프레임” 스타일, 쌓임 순서, Lock입니다.',
  'help.guide.studio-properties.step.3':
    '“복제”와 Delete는 인스펙터 맨 위에 있습니다. 상단 바의 Undo로 무엇이든 되돌릴 수 있습니다.',
  'help.guide.studio-properties.result':
    '잠긴 요소는 더 이상 페이지에서 잡히지 않으므로, 주변을 작업하는 동안 완성된 레이아웃이 안전하게 유지됩니다.',
  'help.guide.studio-properties.tip.1':
    'Shift를 누른 채 클릭하면 여러 요소가 선택되고, 인스펙터가 이들을 함께 편집합니다.',
  'help.guide.studio-properties.tip.2':
    'Auto layout이 놓은 요소를 편집하면 항목과의 연결이 끊어져, 그 항목의 이후 변경을 더 이상 따르지 않습니다.',
  // studio-format
  'help.guide.studio-format.title': '페이지 형식 고르기',
  'help.guide.studio-format.goal': '레이아웃이 크기에 좌우되기 전에, 책이 인쇄될 크기를 정합니다.',
  'help.guide.studio-format.step.1': '상단 바에서 Page format을 클릭합니다.',
  'help.guide.studio-format.step.2':
    'Square 21 × 21 cm, Square 30 × 30 cm, A4 또는 A5의 가로나 세로를 고르거나, 너비와 높이를 밀리미터로 직접 입력합니다. 도련과 안전 영역은 그 아래에 있습니다.',
  'help.guide.studio-format.result': '모든 펼침면이 그 크기로 그려지며, 기본값은 도련 3 mm, 안전 영역 5 mm입니다.',
  'help.guide.studio-format.tip.1':
    '형식을 먼저 바꾼 다음 Auto layout을 실행하세요. 레이아웃은 그때의 크기에 맞춰 만들어집니다.',
  'help.guide.studio-format.tip.2': '인쇄소에 도련과 안전 영역 값을 물어보고 그 값을 입력하세요.',
  // studio-export
  'help.guide.studio-export.title': '책을 PDF로 내보내기',
  'help.guide.studio-export.goal': '인쇄용 파일이나 화면에서 읽을 파일을 얻습니다.',
  'help.guide.studio-export.step.1': '상단 바에서 Export를 클릭합니다.',
  'help.guide.studio-export.step.2':
    '“낱쪽”(한 장에 한 페이지씩 읽는 순서대로, 인쇄소가 원하는 형태) 또는 “펼침면”(책을 펼친 것처럼 두 페이지씩)을 고릅니다. “재단선”은 모든 가장자리에 도련을 더하고 자를 위치를 표시합니다.',
  'help.guide.studio-export.step.3':
    '“인쇄 화면”을 클릭합니다. 브라우저가 페이지를 열고, “PDF로 저장”이 이를 파일로 만듭니다.',
  'help.guide.studio-export.result': '대화 상자가 알린 만큼의 장수로, 설정한 페이지 형식의 PDF가 만들어집니다.',
  'help.guide.studio-export.tip.1': 'PDF 만들기는 Studio 자체와 마찬가지로 데스크톱에서만 됩니다.',
  'help.guide.studio-export.tip.2':
    '교정용으로는 재단선 없이 “펼침면”을, 인쇄소용으로는 재단선을 넣어 “낱쪽”을 내보냅니다.',
  // studio-spread-file
  'help.guide.studio-spread-file.title': '펼침면을 다른 책에서 다시 쓰기',
  'help.guide.studio-spread-file.goal': '마음에 드는 디자인을 한 여행의 책에서 다른 여행의 책으로 옮깁니다.',
  'help.guide.studio-spread-file.step.1':
    '펼침면을 작업 영역에 연 상태에서, 확대 바 오른쪽 끝의 “이 펼침면 내려받기”를 클릭합니다. 파일에는 디자인만 담기고 사진은 담기지 않습니다.',
  'help.guide.studio-spread-file.step.2':
    '다른 책에서 Pages를 열고 “페이지 추가” 옆의 “가져오기”를 클릭한 다음 파일을 고릅니다.',
  'help.guide.studio-spread-file.result':
    '펼침면이 프레임과 텍스트 스타일과 함께 도착합니다. 새 여행의 사진을 프레임에 끌어다 놓으세요.',
  'help.guide.studio-spread-file.tip.1': '펼침면 디자인이 아닌 파일은 이유와 함께 거부됩니다.',

  // ── Screen: settings (all tabs) ───────────────────────────────────────────────────────
  'help.ctx.settings.title': '설정',
  'help.ctx.settings.summary':
    '나의 개인 설정으로, 왼쪽 사이드바에 주제별 탭이 하나씩 있습니다. 대부분의 스위치는 바꾸는 순간 적용됩니다. 아래에 “저장” 버튼이 있는 양식은 그 버튼을 누를 때까지 기다립니다. 여기서 바꾼 것이 다른 사람의 TREK을 바꾸는 일은 없습니다.',
  'help.ctx.settings.bullet.1':
    '왼쪽 사이드바: “화면”, “Appearance”, “지도”, “알림”, “통합”, “오프라인”, “계정”. “플러그인”은 플러그인이 하나라도 설치되면 나타나고, “정보”는 운영자가 없애지 않은 곳이라면 어디서나 나타납니다.',
  'help.ctx.settings.bullet.2':
    '“화면”은 언어, 단위, 통화, 앱이 처음 여는 화면이고, “Appearance”는 테마, 색상, 글자 크기, 대시보드 위젯입니다.',
  'help.ctx.settings.bullet.3':
    '“지도”는 렌더러와 스타일을, “알림”은 나에게 닿는 채널을, “통합”은 사진 라이브러리, API 키, MCP를, “오프라인”은 앱이 이 기기에 보관하는 것을 정합니다.',
  'help.ctx.settings.bullet.4': '“계정”에는 프로필, 비밀번호, 2단계 인증, 패스키, 그리고 계정 삭제가 있습니다.',
  'help.ctx.settings-display.title': '화면',
  'help.ctx.settings-display.summary':
    '언어, 단위, 통화, 지도와 예약이 동작하는 방식, 그리고 TREK이 처음 여는 화면. 여기서의 모든 변경은 즉시 적용됩니다.',
  'help.ctx.settings-display.bullet.1':
    '“Language & region”: 인터페이스 언어, 시간 형식, 한 주의 첫 요일, 표시 통화, 거리 및 온도 단위.',
  'help.ctx.settings-display.bullet.2':
    '“Travel & map”: 예약 경로를 항상 지도에 표시, 장소 탐색 알약 버튼, 숙소 기준 경로 최적화, 예약 코드 흐리게, 예약 경로에 이름 표시.',
  'help.ctx.settings-display.bullet.3':
    '“시작”: TREK이 대시보드에서 열릴지 진행 중인 여행에서 열릴지, 그리고 여행의 어느 탭이 먼저 나올지.',
  'help.ctx.settings-appearance.title': 'Appearance',
  'help.ctx.settings-appearance.summary':
    '이 계정에서 TREK이 보이는 방식: 라이트 또는 다크, 강조 색상, 유리 효과와 움직임, 글자 크기, 대시보드에 보일 위젯. 모두 즉시 적용되며 로그인한 모든 기기에 반영됩니다.',
  'help.ctx.settings-appearance.bullet.1':
    '“Theme”: “라이트”, “다크” 또는 “자동”, 그리고 직접 고르는 “Custom accent”가 있는 “Color scheme”.',
  'help.ctx.settings-appearance.bullet.2':
    '“Readability”: “Transparency”, “Reduce motion”, “Density”, “Text size”, 그리고 단계별 고급 크기.',
  'help.ctx.settings-appearance.bullet.3':
    '“Dashboard widgets”: 위젯마다 스위치 하나씩, “Desktop”과 “Mobile”을 따로 설정합니다.',
  'help.ctx.settings-appearance.bullet.4': '맨 아래 “Reset to defaults”가 모든 것을 되돌립니다.',
  'help.ctx.settings-map.title': '지도',
  'help.ctx.settings-map.summary':
    '어떤 엔진이 어떤 스타일로 지도를 그리는지. Leaflet은 고전적인 래스터 지도, MapLibre는 토큰 없이 벡터 타일을 그리고, Mapbox는 내 토큰으로 3D 건물과 지형을 더합니다.',
  'help.ctx.settings-map.bullet.1':
    '“지도 공급자”: Leaflet, MapLibre 또는 Mapbox, 각각 무엇이 필요한지 한 줄로 안내합니다.',
  'help.ctx.settings-map.bullet.2': '“지도 스타일”과 “지도 템플릿”: 타일의 모양, 그리고 공급자가 요구하는 토큰이나 키.',
  'help.ctx.settings-map.bullet.3': '안티앨리어싱과 지구본 투영을 위한 “고품질 모드”. “지도 저장”이 선택을 기록합니다.',
  'help.ctx.settings-notifications.title': '알림',
  'help.ctx.settings-notifications.summary':
    '앱 밖에서 TREK이 나에게 닿는 곳: 이 기기의 푸시 알림, ntfy 토픽, 웹훅, 또는 플러그인이 제공하는 채널. 채널 아래에서는 이벤트마다 한 줄씩 무엇을 어디로 보낼지 정합니다.',
  'help.ctx.settings-notifications.bullet.1':
    'ntfy: 토픽, 선택 사항인 내 서버, 선택 사항인 액세스 토큰. “테스트”로 바로 하나 보낼 수 있습니다.',
  'help.ctx.settings-notifications.bullet.2': '웹훅: 모든 이벤트를 JSON으로 받는 URL 하나. “테스트”가 있습니다.',
  'help.ctx.settings-notifications.bullet.3':
    '이 기기의 푸시 알림: “이 기기에서 켜기”는 지금 쓰는 브라우저에만 적용되므로 휴대폰이나 컴퓨터마다 따로 켜야 합니다. “테스트 전송”은 켜 둔 모든 기기로 보냅니다.',
  'help.ctx.settings-notifications.bullet.4':
    '환경설정 행: 이벤트마다 어느 채널이 켜져 있는지. 플러그인 채널은 설정이 끝날 때까지 “설정하기”를 표시합니다.',
  'help.ctx.settings-integrations.title': '통합',
  'help.ctx.settings-integrations.summary':
    '밖에서 TREK에 연결되는 모든 것: 일기를 위한 사진 라이브러리, 스크립트를 위한 API 키, 그리고 AI 어시스턴트를 위한 MCP 엔드포인트와 그 토큰 및 OAuth 클라이언트.',
  'help.ctx.settings-integrations.bullet.1':
    '사진 공급자: Immich와 Synology Photos, 각각 URL과 키, “연결 테스트”와 “저장”이 있습니다.',
  'help.ctx.settings-integrations.bullet.2':
    '“API 키”: 내 이름으로 TREK API를 호출하는 스크립트와 다른 도구를 위한 개인 키.',
  'help.ctx.settings-integrations.bullet.3': '“MCP 설정”: 엔드포인트, 복사해 쓰는 클라이언트 설정, 그리고 API 토큰.',
  'help.ctx.settings-integrations.bullet.4':
    '“OAuth 2.1 클라이언트”: TREK을 통해 로그인하는 앱. 리디렉션 URI, 허용 권한 범위, 머신 클라이언트, 활성 세션이 있습니다.',
  'help.ctx.settings-offline.title': '오프라인',
  'help.ctx.settings-offline.summary':
    '연결이 없어도 여행이 열리도록 TREK이 이 기기에 보관하는 것, 그리고 오프라인에서 한 변경이 다른 곳에서 한 변경과 충돌할 때 일어나는 일.',
  'help.ctx.settings-offline.bullet.1':
    '“오프라인 모드”: “오프라인 모드 강제 사용”은 네트워크가 끊긴 것처럼 앱을 동작시킵니다. 테스트나 데이터 요금제 연결에 씁니다.',
  'help.ctx.settings-offline.bullet.2':
    '“오프라인 준비”: “오프라인 사용을 위해 다운로드”가 여행과 그 지도 타일을 지금 가져옵니다.',
  'help.ctx.settings-offline.bullet.3': '“오프라인에 저장할 항목”: 지도 타일 켜기 또는 끄기, 그리고 여행별 스위치.',
  'help.ctx.settings-offline.bullet.4':
    '“동기화 충돌”과 “오프라인 캐시”: 충돌 전략, 대기 중 및 실패한 변경 수, “지금 다시 동기화”와 “캐시 지우기”.',
  'help.ctx.settings-account.title': '계정',
  'help.ctx.settings-account.summary':
    '이 TREK에서 내가 누구이고 어떻게 로그인하는지: 프로필과 아바타, 비밀번호, 2단계 인증, 패스키, 그리고 맨 아래에 계정 삭제.',
  'help.ctx.settings-account.bullet.1': '프로필: 사용자 이름, 이메일, 아바타. “프로필 저장”으로 저장합니다.',
  'help.ctx.settings-account.bullet.2': '“비밀번호 변경”: 현재 비밀번호, 새 비밀번호 두 번, “비밀번호 업데이트”.',
  'help.ctx.settings-account.bullet.3':
    '인증 앱과 백업 코드를 쓰는 “2단계 인증 (2FA)”. 비밀번호 없이 로그인하는 “패스키”.',
  'help.ctx.settings-account.bullet.4':
    '맨 아래의 “계정 삭제”는 확인 뒤에 있습니다. 마지막 관리자는 자신을 삭제할 수 없습니다.',
  // language-region
  'help.guide.language-region.title': '언어, 단위, 통화 설정하기',
  'help.guide.language-region.goal': 'TREK이 내 언어로 말하고 내 방식으로 세게 합니다.',
  'help.guide.language-region.step.1':
    '“Language & region”에서 인터페이스 언어를 고릅니다. TREK은 즉시 바뀌며 로그인한 모든 기기에 반영됩니다.',
  'help.guide.language-region.step.2':
    '그 아래에서 시간 형식, 모든 날짜 선택기에서 한 주가 시작되는 요일, 표시 통화, 거리 및 온도 단위를 고릅니다.',
  'help.guide.language-region.result':
    '날짜, 거리, 금액이 기대한 대로 읽힙니다. 여행 자체의 통화는 환산된 금액 옆에 계속 표시됩니다.',
  'help.guide.language-region.tip.1':
    '표시 통화는 여행을 아우르는 합계를 위한 것입니다. 각 여행은 지정해 둔 통화를 유지합니다.',
  'help.guide.language-region.tip.2': '언어는 Vacay와 일기의 요일 및 월 이름도 정합니다.',
  // travel-map-prefs
  'help.guide.travel-map-prefs.title': '지도와 예약의 동작 조정하기',
  'help.guide.travel-map-prefs.goal': '여행 지도가 기본으로 무엇을 보여줄지 정합니다.',
  'help.guide.travel-map-prefs.step.1':
    '“Travel & map”에서 “예약 경로 항상 표시”는 해당 날짜를 열지 않아도 항공편과 기차를 지도에 남기고, “지도에서 장소 탐색”은 장소를 찾는 알약 버튼을 보여주며, “숙소 기준으로 경로 최적화”는 묵는 곳에서 경로를 시작합니다.',
  'help.guide.travel-map-prefs.step.2':
    '“예약 코드 흐리게”는 마우스를 올릴 때까지 확인 번호를 숨기고, “예약 경로 레이블”은 예약 이름을 경로를 따라 적습니다.',
  'help.guide.travel-map-prefs.result': '여행 지도는 다시 바꿀 때까지 모든 여행에서 이 설정을 따릅니다.',
  'help.guide.travel-map-prefs.tip.1':
    '이 설정은 여행별이 아니라 계정별입니다. 공유 여행의 멤버는 각자 자신의 선택을 봅니다.',
  // startup
  'help.guide.startup.title': 'TREK이 처음 여는 화면 고르기',
  'help.guide.startup.goal': '매번 대시보드가 아니라 가장 많이 작업하는 곳에서 시작합니다.',
  'help.guide.startup.step.1': '“시작”에서 “시작 화면”을 “대시보드” 또는 “진행 중인 여행”으로 설정합니다.',
  'help.guide.startup.step.2': '“시작 탭”은 여행을 열 때 어느 탭이 먼저 나올지 고릅니다.',
  'help.guide.startup.result': '다음 로그인과 로고를 다음에 탭할 때 곧바로 그곳으로 갑니다.',
  'help.guide.startup.tip.1': '“진행 중인 여행”은 오늘 진행 중인 여행을, 없으면 다음 여행을 뜻합니다.',
  // theme-scheme
  'help.guide.theme-scheme.title': '테마와 강조 색상 설정하기',
  'help.guide.theme-scheme.goal': 'TREK을 라이트, 다크 또는 기기 설정에 맞추고, 좋아하는 색으로 꾸밉니다.',
  'help.guide.theme-scheme.step.1':
    '“Theme”에서 “라이트”, “다크” 또는 “자동”을 고릅니다. “자동”은 기기 설정을 따릅니다.',
  'help.guide.theme-scheme.step.2':
    '“Color scheme”을 고릅니다: “Default”, “High contrast”, “Indigo”, “Teal”, “Rose”, “Amber”, “Violet” 또는 “Custom”.',
  'help.guide.theme-scheme.step.3':
    '“Custom”에서는 프리셋에서 강조 색상을 고르거나 직접 입력합니다. 옆의 대비 검사가 그 위에서 글자가 잘 읽히는지 알려줍니다.',
  'help.guide.theme-scheme.result': '버튼, 링크, 강조 표시가 어디서나 그 색을 쓰며 로그인한 모든 기기에 반영됩니다.',
  'help.guide.theme-scheme.tip.1':
    '내비게이션 바에도 라이트와 다크를 빠르게 바꾸는 스위치가 있습니다. 같은 테마를 설정합니다.',
  'help.guide.theme-scheme.tip.2': '“High contrast”는 기본이 너무 흐릿하게 읽힐 때 고르는 스킴입니다.',
  // readability
  'help.guide.readability.title': '가독성과 글자 크기 조정하기',
  'help.guide.readability.goal': '유리 효과와 움직임은 줄이고, 여백은 늘리거나 글자는 키웁니다.',
  'help.guide.readability.step.1':
    '“Readability”에서 “Transparency”는 유리 패널을 불투명한 면으로 바꾸고, “Reduce motion”은 애니메이션을 최소화하며, “Density”는 “Comfortable” 또는 “Compact”를 고릅니다.',
  'help.guide.readability.step.2':
    '“Text size”는 “Everything”을 한 번에 조절하고, “Advanced text sizes”는 제목, 부제목, 본문, 캡션을 따로 정하게 해 줍니다.',
  'help.guide.readability.result': '지도 패널과 일기를 포함해 앱 전체가 즉시 따릅니다.',
  'help.guide.readability.tip.1': '“Reduce motion”은 건드리지 않으면 시스템 설정도 따릅니다.',
  'help.guide.readability.tip.2':
    '글자 크기는 타이포그래피 단계를 통해 적용되므로 잘리는 것이 없습니다. 더 이상 들어가지 않는 크기는 줄이 바뀝니다.',
  // dashboard-widgets
  'help.guide.dashboard-widgets.title': '대시보드 위젯 고르기',
  'help.guide.dashboard-widgets.goal': '쓰는 위젯만, 데스크톱과 휴대폰에서 따로 보여줍니다.',
  'help.guide.dashboard-widgets.step.1':
    '“Dashboard widgets”에서 각 위젯을 “Desktop”과 “Mobile”에 대해 켜거나 끕니다: 오른쪽 사이드바 전체, 통화, Collections, 시간대, 다가오는 예약, Atlas 국가, 여행 수치.',
  'help.guide.dashboard-widgets.step.2': '맨 아래 “Reset to defaults”가 탭 전체를 출고 상태로 되돌립니다.',
  'help.guide.dashboard-widgets.result': '대시보드는 즉시 다시 배치됩니다. 오른쪽 사이드바를 끄면 가운데 정렬됩니다.',
  'help.guide.dashboard-widgets.tip.1': '애드온의 위젯은 관리자가 그 애드온을 켜 둔 동안에만 나타납니다.',
  'help.guide.dashboard-widgets.tip.2': '대시보드 자체는 격자 또는 목록 보기와 정렬 순서를 기기별로 기억합니다.',
  // map-provider
  'help.guide.map-provider.title': '지도 엔진과 스타일 고르기',
  'help.guide.map-provider.goal': '고전적인 지도, 벡터 타일, Mapbox의 3D 지도 사이를 오갑니다.',
  'help.guide.map-provider.step.1':
    '“지도 공급자”에서 어떤 래스터 타일이든 쓰는 고전적인 2D 지도는 Leaflet, 토큰 없는 OpenFreeMap 벡터 타일은 MapLibre, 3D 건물과 지형이 있는 벡터 타일은 Mapbox를 고릅니다.',
  'help.guide.map-provider.step.2':
    '모양을 위해 “지도 스타일” 또는 “지도 템플릿”을 고릅니다. Mapbox에는 “Mapbox 액세스 토큰”이, 일부 래스터 스타일에는 “CARTO API 키”가 필요합니다. 입력란 옆의 링크가 발급받는 곳으로 안내합니다.',
  'help.guide.map-provider.step.3': '“고품질 모드”는 안티앨리어싱과 지구본 투영을 더합니다. “지도 저장”을 클릭합니다.',
  'help.guide.map-provider.result': '여행, Atlas, Collections, 일기 등 TREK의 모든 지도가 고른 엔진으로 그려집니다.',
  'help.guide.map-provider.tip.1': '토큰이 없으면 Mapbox는 아무것도 보여주지 않는 대신 기본 지도로 돌아갑니다.',
  'help.guide.map-provider.tip.2': '오프라인에 저장하는 지도 타일은 다운로드할 때 활성화된 공급자에서 가져옵니다.',
  // notification-channels
  'help.guide.notification-channels.title': '알림이 닿는 곳 설정하기',
  'help.guide.notification-channels.goal': '여행 리마인더와 협업 이벤트를 휴대폰이나 다른 도구에서 받습니다.',
  'help.guide.notification-channels.step.1':
    '“알림”에서 “Ntfy 토픽”을 채웁니다. 직접 운영한다면 내 “Ntfy 서버 URL”과 “액세스 토큰”을 더합니다. “테스트”가 바로 메시지를 보냅니다.',
  'help.guide.notification-channels.step.2':
    '또는 모든 이벤트를 JSON으로 받는 “웹훅 URL”을 주고 같은 방식으로 “테스트”합니다.',
  'help.guide.notification-channels.step.3':
    '아래 행에서 이벤트마다 채널별로 켜거나 끕니다. 플러그인 채널은 플러그인 설정에서 준비될 때까지 “설정하기”라고 표시되고, “테스트 전송”이 하나 보내 봅니다.',
  'help.guide.notification-channels.result':
    '이벤트는 켜진 채널을 통해 나갑니다. 내비게이션 바의 종은 그와 상관없이 앱 안에서 계속 보여줍니다.',
  'help.guide.notification-channels.tip.1': '여행별 환경설정은 여행 자체의 알림 설정에 있습니다.',
  'help.guide.notification-channels.tip.2':
    '관리자는 모두를 위한 기본 ntfy 서버를 미리 채워 둘 수 있습니다. 토픽은 여전히 직접 고릅니다.',
  // photo-providers
  'help.guide.photo-providers.title': '사진 라이브러리 연결하기',
  'help.guide.photo-providers.goal': '일기가 그날의 사진을 Immich나 Synology Photos에서 가져오게 합니다.',
  'help.guide.photo-providers.step.1':
    '“통합”에서 공급자 섹션을 찾아 URL과 API 키를 입력합니다. Immich는 Journey 업로드를 라이브러리로 되돌려 미러링하는 것도 제안합니다.',
  'help.guide.photo-providers.step.2': '“연결 테스트”를 클릭한 다음 “저장”을 클릭합니다.',
  'help.guide.photo-providers.result':
    '기록 편집기의 “External photos” 탭이 연결된 라이브러리에서 그 기록의 날짜를 검색하며, 기록의 위치에 가장 가까운 것부터 보여줍니다.',
  'help.guide.photo-providers.tip.1': '연결은 내 것입니다. Journey의 다른 멤버는 각자 자신의 라이브러리를 연결합니다.',
  'help.guide.photo-providers.tip.2': '사진에 GPS 데이터가 없는 공급자도 동작합니다. 그때는 목록이 시간순입니다.',
  // api-keys
  'help.guide.api-keys.title': 'API 키 만들기',
  'help.guide.api-keys.goal': '스크립트나 다른 도구가 나로서 TREK API를 호출하게 합니다.',
  'help.guide.api-keys.step.1': '“API 키”에서 “키 만들기”를 클릭하고 어디에 쓸지 알 수 있는 이름을 붙입니다.',
  'help.guide.api-keys.step.2':
    '대화 상자에서 키를 복사합니다. 한 번만 표시됩니다. 도구가 더 이상 필요 없으면 목록에서 키를 삭제합니다.',
  'help.guide.api-keys.result':
    '그 키로 보낸 요청은 내 권한으로 동작합니다. 목록에는 각 키가 언제 만들어지고 마지막으로 쓰였는지 표시됩니다.',
  'help.guide.api-keys.tip.1': '도구마다 키 하나씩이면 취소가 수월합니다.',
  'help.guide.api-keys.tip.2':
    'AI 어시스턴트에는 대신 OAuth가 있는 MCP를 씁니다. API 키는 단순한 HTTP 클라이언트용입니다.',
  // mcp-oauth
  'help.guide.mcp-oauth.title': 'MCP로 AI 어시스턴트 연결하기',
  'help.guide.mcp-oauth.goal': 'Claude, IDE 또는 다른 MCP 클라이언트에 내 여행에 대한 접근을 줍니다.',
  'help.guide.mcp-oauth.step.1':
    '“MCP 설정”에서 “MCP 엔드포인트”를 복사하거나, JSON 조각을 받는 클라이언트라면 “클라이언트 설정” 전체를 복사합니다.',
  'help.guide.mcp-oauth.step.2':
    '브라우저로 로그인하는 클라이언트는 OAuth 2.1을 씁니다: “OAuth 2.1 클라이언트” 아래 “새 클라이언트”에서 “리디렉션 URI”, “허용 권한 범위”, 그리고 브라우저가 없는 서버라면 “머신 클라이언트”를 설정합니다.',
  'help.guide.mcp-oauth.step.3':
    '“시크릿 교체”와 “클라이언트 삭제”는 각 클라이언트에 있습니다. “활성 OAuth 세션”은 로그인된 것을 나열하고 취소하게 해 줍니다. “API 토큰”과 “새 토큰 만들기”는 예전 방식의 입구입니다.',
  'help.guide.mcp-oauth.result':
    '클라이언트는 권한 범위가 허용하는 것을 나로서 읽고 바꿀 수 있으며, 모든 작업은 내 이름으로 표시됩니다.',
  'help.guide.mcp-oauth.tip.1': '권한 범위는 안전망입니다. 더 필요해질 때까지 클라이언트에 읽기 범위만 줍니다.',
  'help.guide.mcp-oauth.tip.2': '관리자는 인스턴스 전체에서 MCP를 끌 수 있습니다. 그러면 이 섹션이 없습니다.',
  // offline-prepare
  'help.guide.offline-prepare.title': '여행을 오프라인으로 가져가기',
  'help.guide.offline-prepare.goal': '연결이 끊기기 전에 여행과 지도를 이 기기에 갖춥니다.',
  'help.guide.offline-prepare.step.1':
    '“오프라인에 저장할 항목”에서 “지도 타일을 오프라인에 저장”을 켜 두고, 이 기기에 두고 싶은 여행을 켭니다.',
  'help.guide.offline-prepare.step.2':
    '“오프라인 준비” 아래의 “오프라인 사용을 위해 다운로드”를 클릭합니다. 여행과 그 장소 주변의 타일을 가져옵니다.',
  'help.guide.offline-prepare.step.3':
    '“오프라인 모드” 아래의 “오프라인 모드 강제 사용”으로 떠나기 전에 모든 것이 있는지 확인할 수 있습니다.',
  'help.guide.offline-prepare.result':
    '여행이 연결 없이 열립니다. 변경 사항은 대기열에서 기다리다가 다시 연결되면 전송됩니다.',
  'help.guide.offline-prepare.tip.1':
    '타일이 공간을 가장 많이 차지합니다. “오프라인 캐시” 섹션에 여행별로 무엇이 저장됐는지 보입니다.',
  'help.guide.offline-prepare.tip.2': '가장 매끄러운 오프라인 시작을 위해 브라우저에서 TREK을 앱으로 설치합니다.',
  // offline-conflicts
  'help.guide.offline-conflicts.title': '동기화 충돌 시 무엇이 이길지 정하기',
  'help.guide.offline-conflicts.goal': '오프라인에서 한 변경과 다른 곳에서 한 변경을 TREK이 어떻게 정리할지 고릅니다.',
  'help.guide.offline-conflicts.step.1':
    '“동기화 충돌”에서 “매번 묻기”, “항상 내 버전 유지” 또는 “항상 서버 버전 유지”를 고릅니다.',
  'help.guide.offline-conflicts.step.2':
    '“오프라인 캐시”에는 여행, 대기 중 및 실패한 변경, 충돌이 보입니다. “지금 다시 동기화”는 대기열을 보내고, “캐시 지우기”는 기기를 비웁니다.',
  'help.guide.offline-conflicts.result':
    '“매번 묻기”에서는 충돌이 두 버전을 보여주고 고르게 합니다. 다른 둘에서는 조용히 정리됩니다.',
  'help.guide.offline-conflicts.tip.1': '“캐시 지우기”는 이 기기의 사본만 지웁니다. 서버의 것은 건드리지 않습니다.',
  // profile
  'help.guide.profile.title': '프로필 바꾸기',
  'help.guide.profile.goal': '이름, 이메일, 사진을 업데이트합니다.',
  'help.guide.profile.step.1':
    '“계정”에서 “사용자 이름”과 “이메일”을 편집합니다. 아바타에는 내 이미지를 업로드할 수 있고, 지우면 이니셜로 돌아갑니다.',
  'help.guide.profile.step.2': '“프로필 저장”을 클릭합니다.',
  'help.guide.profile.result': '이름과 사진이 공유하는 여행을 포함해 어디서나 즉시 업데이트됩니다.',
  'help.guide.profile.tip.1': 'OIDC로 로그인하는 계정은 여기에 그렇게 표시되며, 이메일은 공급자에서 옵니다.',
  // password
  'help.guide.password.title': '비밀번호 바꾸기',
  'help.guide.password.goal': '새 비밀번호를 설정합니다.',
  'help.guide.password.step.1': '“비밀번호 변경”에서 현재 비밀번호를 입력한 다음 새 비밀번호를 두 번 입력합니다.',
  'help.guide.password.step.2': '“비밀번호 업데이트”를 클릭합니다.',
  'help.guide.password.result': '새 비밀번호는 다음 로그인부터 적용됩니다. 다른 세션은 로그인 상태를 유지합니다.',
  'help.guide.password.tip.1': 'OIDC로 로그인하는 계정에는 바꿀 TREK 비밀번호가 없습니다.',
  // mfa
  'help.guide.mfa.title': '2단계 인증 켜기',
  'help.guide.mfa.goal': '인증 앱의 코드로 계정을 보호합니다.',
  'help.guide.mfa.step.1': '“2단계 인증 (2FA)”에서 “인증 앱 설정”을 클릭합니다.',
  'help.guide.mfa.step.2':
    '앱으로 QR 코드를 스캔하거나 시크릿을 직접 입력한 다음, 앱에 보이는 6자리 코드를 입력하고 “2FA 활성화”를 클릭합니다.',
  'help.guide.mfa.step.3':
    '백업 코드를 저장합니다: 복사, 다운로드 또는 인쇄. 휴대폰이 손에 없을 때 각각 한 번씩 쓸 수 있습니다.',
  'help.guide.mfa.result': '로그인할 때마다 비밀번호 뒤에 코드를 묻습니다.',
  'help.guide.mfa.tip.1': '“2FA 비활성화”에는 비밀번호와 현재 코드가 필요합니다.',
  'help.guide.mfa.tip.2': '관리자는 모두에게 2FA를 필수로 할 수 있습니다. 그러면 여기서 끌 수 없습니다.',
  // passkeys
  'help.guide.passkeys.title': '패스키로 로그인하기',
  'help.guide.passkeys.goal': '비밀번호 대신 기기의 지문, 얼굴 또는 PIN을 씁니다.',
  'help.guide.passkeys.step.1':
    '“패스키”에서 “패스키 추가”를 클릭하고 기기에서 확인합니다. 어느 기기인지 알 수 있는 이름을 붙입니다.',
  'help.guide.passkeys.step.2':
    '목록에는 모든 패스키가 이름과 마지막 사용 시각과 함께 보입니다. 삭제 버튼이 하나를 지웁니다.',
  'help.guide.passkeys.result': '로그인 페이지에서 패스키를 제안합니다. 비밀번호는 대비책으로 남습니다.',
  'help.guide.passkeys.tip.1': '패스키는 기기나 그 비밀번호 관리자에 있으므로 기기마다 하나씩 추가합니다.',
  'help.guide.passkeys.tip.2':
    '패스키에는 HTTPS가 필요합니다. 일반 HTTP 인스턴스에서는 섹션이 왜 쓸 수 없는지 설명합니다.',
  // delete-account
  'help.guide.delete-account.title': '계정 삭제하기',
  'help.guide.delete-account.goal': '내 계정과 나에게만 속한 데이터를 없앱니다.',
  'help.guide.delete-account.step.1': '“계정”의 맨 아래에서 “계정 삭제”를 클릭하고 확인합니다.',
  'help.guide.delete-account.result':
    '내 계정, 내 여행, 내 Journey가 사라집니다. 다른 사람과 공유한 여행은 그들에게 남습니다.',
  'help.guide.delete-account.tip.1':
    '인스턴스의 마지막 관리자는 자신을 삭제할 수 없습니다. 먼저 다른 사람을 관리자로 만드세요.',
  'help.guide.delete-account.tip.2': '되돌릴 수 없습니다. 확인하기 전에 남기고 싶은 것을 내보내세요.',

  // ── Screen: admin (all tabs) ──────────────────────────────────────────────────────────
  'help.ctx.admin.title': '관리자',
  'help.ctx.admin.summary':
    '모두의 TREK을 떠받치는 인스턴스입니다. 누가 어떻게 로그인할 수 있는지, 무엇이 켜져 있는지, 파일이 어디에 있는지, 서버가 사람들에게 어떻게 연락하는지, 어떻게 백업되는지를 정합니다. 이 페이지는 관리자만 볼 수 있고, 각 탭은 사이드바에서 별도의 화면입니다.',
  'help.ctx.admin.bullet.1':
    '상단의 카드 네 개는 사용자, 여행, 장소, 파일의 수를 세고, 그 위의 배너는 새 TREK 릴리스를 알립니다.',
  'help.ctx.admin.bullet.2': '“사용자”와 “기본값”: 계정, 초대 링크, 그리고 새 계정이 처음 갖는 지도 설정.',
  'help.ctx.admin.bullet.3':
    '“개인 설정”, “설정”, “애드온”, “플러그인”: 차례로 짐 목록 템플릿, 카테고리, 학교 방학; 로그인 방법과 API 키; 기능 모듈; 서드파티 플러그인입니다.',
  'help.ctx.admin.bullet.4':
    '“스토리지”, “알림”, “MCP 접근”, “GitHub”: 차례로 업로드가 저장되는 곳, 인스턴스 전체의 채널, AI 클라이언트의 토큰과 세션, 릴리스 히스토리입니다.',
  'help.ctx.admin.bullet.5': '“백업”과 “감사”: 수동 및 예약 백업, 그리고 보안 관련 이벤트의 로그.',
  'help.ctx.admin-users.title': '사용자',
  'help.ctx.admin-users.summary':
    '이 TREK의 모든 계정을 역할, 이메일, 마지막 로그인과 함께 보여주고, 닫힌 인스턴스에서 사람들이 가입할 수 있게 해 주는 초대 링크를 관리합니다.',
  'help.ctx.admin-users.bullet.1':
    '표: 사용자 이름, 이메일, 역할, 생성일, 마지막 로그인, 그리고 행별 작업. 나 자신에게는 표시가 붙습니다.',
  'help.ctx.admin-users.bullet.2': '상단의 “사용자 만들기”는 내가 전달할 비밀번호와 함께 계정을 직접 추가합니다.',
  'help.ctx.admin-users.bullet.3':
    '아래의 “초대 링크”: 사용 횟수 제한과 만료 기간이 있는 일회용 가입 링크로, 원하면 새 사용자가 도착하자마자 참여할 여행도 정할 수 있습니다.',
  'help.ctx.admin-users.bullet.4':
    '맨 아래의 “권한 설정”: 작업별로 누가 할 수 있는지를 “모든 사람”, “여행 멤버”, “여행 소유자”, “관리자만” 중에서 정합니다.',
  'help.ctx.admin-defaults.title': '기본값',
  'help.ctx.admin-defaults.summary':
    '새 계정이 처음 갖는 설정입니다. 아무도 지도 탭부터 찾을 필요가 없도록 지도 제공자, 스타일, 토큰, 품질을 미리 정합니다.',
  'help.ctx.admin-defaults.bullet.1':
    '지도 제공자, Mapbox 스타일과 토큰, CARTO 키, Mapbox 품질. 사용자가 “설정”의 “지도”에서 정하는 것과 똑같은 항목입니다.',
  'help.ctx.admin-defaults.bullet.2':
    '항목별 “초기화”는 TREK 자체의 기본값으로 되돌립니다. 사용자 자신의 설정이 언제나 이 값보다 우선합니다.',
  'help.ctx.admin-config.title': '개인 설정',
  'help.ctx.admin-config.summary':
    '인스턴스의 모든 여행이 공유하는 것: 짐 목록 템플릿, 장소와 컬렉션에 쓰는 카테고리 모음, 그리고 Vacay가 참조하는 학교 방학 카탈로그입니다.',
  'help.ctx.admin-config.bullet.1':
    '“짐 목록 템플릿”: 여행의 짐 목록이 출발점으로 삼을 수 있는, 이름이 붙은 카테고리와 항목의 목록.',
  'help.ctx.admin-config.bullet.2':
    '“카테고리”: 장소 인스펙터부터 컬렉션까지 TREK 전체에서 쓰이는 카테고리의 이름, 아이콘, 색상.',
  'help.ctx.admin-config.bullet.3': '“학교 방학”: 내장 피드가 다루지 않는 곳을 위한 국가와 지역의 카탈로그.',
  'help.ctx.admin-settings.title': '설정',
  'help.ctx.admin-settings.summary':
    '사람들이 어떻게 들어오고 서버가 무엇과 통신해도 되는지: 로그인과 가입 방법, SSO, 패스키, 2단계 인증 정책, 지도·장소·이미지용 API 키, 검색과 대중교통 제공자, 그리고 업로드에 허용되는 파일 형식.',
  'help.ctx.admin-settings.bullet.1':
    '“인증 방법”: “비밀번호 로그인”, “비밀번호 회원가입”, “SSO 로그인”, “SSO 자동 프로비저닝”, “2단계 인증 (2FA) 요구”.',
  'help.ctx.admin-settings.bullet.2':
    '“Single Sign-On (OIDC)”에는 발급자, 클라이언트, 표시 이름을; “패스키 로그인”에는 Relying Party ID와 오리진을 넣습니다.',
  'help.ctx.admin-settings.bullet.3':
    '“API 키”: Google Maps, Unsplash, Amap 각각에 “테스트”가 있습니다. “키의 사용 범위”로 Google 키를 비용을 낼 기능에만 한정합니다.',
  'help.ctx.admin-settings.bullet.4':
    '“장소 검색 제공자”와 “대중교통 제공자”는 누가 검색과 경로에 답할지 고릅니다. “허용된 파일 형식”은 업로드를 제한합니다.',
  'help.ctx.admin-addons.title': '애드온',
  'help.ctx.admin-addons.summary':
    'TREK의 기능 모듈이며 각각 스위치가 있습니다: 목록, 비용, 문서, Vacay, Atlas, Collab, Journey, 컬렉션, 로드트립, MCP, AirTrail, Dawarich, 그리고 AI 파싱. 끄면 내비게이션 항목, 라우트, API가 모두에게서 사라집니다.',
  'help.ctx.admin-addons.bullet.1': '애드온마다 스위치가 있는 타일 하나, 옵션이 있으면 그 하위 행.',
  'help.ctx.admin-addons.bullet.2':
    '사진 제공자와 문서 제공자도 여기에 타일로 나타나므로 Immich나 Synology를 사용자에게 제공할 수 있습니다.',
  'help.ctx.admin-addons.bullet.3': '“가방 추적”은 타일 아래에 자체 스위치가 있습니다.',
  'help.ctx.admin-plugins.title': '플러그인',
  'help.ctx.admin-plugins.summary':
    'TREK 옆에서 자체 프로세스로 실행되는 서드파티 플러그인으로, 각각 설치 시 요청한 권한을 갖습니다. 카탈로그에서 설치하거나, 패키지를 업로드하거나, 개발 중에는 폴더를 연결합니다.',
  'help.ctx.admin-plugins.bullet.1':
    '목록: 설치된 모든 플러그인을 버전, 상태, 서명, 보유 권한과 함께 표시합니다. 행마다 활성화, 비활성화, 업데이트, 제거가 가능합니다.',
  'help.ctx.admin-plugins.bullet.2':
    '“플러그인 업로드”는 패키지 파일을 받고, “다시 스캔”은 개발용으로 연결한 플러그인 폴더를 불러옵니다.',
  'help.ctx.admin-plugins.bullet.3':
    '플러그인별 “허용된 호스트”: 플러그인이 호출해도 되는 주소입니다. 외부 통신은 기본적으로 차단됩니다.',
  'help.ctx.admin-storage.title': '스토리지',
  'help.ctx.admin-storage.summary':
    '업로드가 저장되는 곳: 로컬 디스크, S3 버킷, 또는 둘 다에 쓰는 미러. 업로드 카테고리마다 다른 백엔드로 보낼 수 있고, “상태”는 모든 백엔드가 응답하는지 알려줍니다.',
  'help.ctx.admin-storage.bullet.1':
    '“백엔드”: 각각의 이름과 유형에 “테스트”, “편집”, “제거”가 있습니다. 환경 변수로 설정된 것은 여기서 읽기 전용입니다.',
  'help.ctx.admin-storage.bullet.2':
    '“카테고리”: 커버, 문서, 여정 사진 등 각각을 백엔드에 배정합니다. 하나를 바꾸면 기존 파일을 옮길지 묻습니다.',
  'help.ctx.admin-storage.bullet.3': '“상태”: 백엔드별 점검과, 설정이 서버가 보는 것과 같음을 증명하는 시드 파일.',
  'help.ctx.admin-notifications.title': '알림',
  'help.ctx.admin-notifications.summary':
    '인스턴스가 사용자에게 제공하는 채널과, 관리자인 나에게 닿는 채널입니다. 사용자는 “설정”에서 자기 토픽과 URL을 고르고, 나는 무엇을 제공할지 정하고 이메일을 설정합니다.',
  'help.ctx.admin-notifications.bullet.1':
    '“앱 내”, “이메일 (SMTP)”, “Ntfy”, “웹훅”, “웹 푸시”: 패널 하나씩이며, 채널을 사용자에게 제공하는 스위치와 필요한 서버 측 설정이 있습니다.',
  'help.ctx.admin-notifications.bullet.2': '“여행 리마인더”: 여행 시작 전에 서버가 리마인더를 보낼지 여부.',
  'help.ctx.admin-notifications.bullet.3':
    '“관리자 Ntfy”와 “관리자 웹훅”: 실패한 백업이나 새 릴리스 같은 관리자 이벤트가 가는 곳이며, “테스트”가 있습니다.',
  'help.ctx.admin-mcp-tokens.title': 'MCP 접근',
  'help.ctx.admin-mcp-tokens.summary':
    'AI 클라이언트가 이 TREK에 대해 가진 모든 토큰과 OAuth 세션을 전체 사용자에 걸쳐 보여주며, 어느 것이든 취소할 수 있습니다.',
  'help.ctx.admin-mcp-tokens.bullet.1': '“API 토큰”: 누가 만들었는지, 언제 마지막으로 쓰였는지, 그리고 “삭제”.',
  'help.ctx.admin-mcp-tokens.bullet.2': '“OAuth 세션”: 클라이언트, 사용자, 부여된 스코프, 그리고 “취소”.',
  'help.ctx.admin-github.title': 'GitHub',
  'help.ctx.admin-github.summary':
    'TREK의 새 소식: GitHub의 릴리스 히스토리, 지금 실행 중인 버전, 그리고 새 버전이 나왔는지 여부. 업데이트 자체는 앱 밖의 호스트에서 이루어집니다.',
  'help.ctx.admin-github.bullet.1':
    '“릴리스 히스토리”는 릴리스를 노트와 함께 나열합니다. 가장 새것에는 “최신”이 붙고, 내 버전에는 표시가 있습니다.',
  'help.ctx.admin-github.bullet.2':
    '새 릴리스가 있으면 헤더에 “업데이트 사용 가능”이 나타나고, Docker와 그 밖의 설치 방식에 맞는 업데이트 방법을 알려줍니다.',
  'help.ctx.admin-backup.title': '백업',
  'help.ctx.admin-backup.summary':
    '데이터베이스와 업로드의 전체 백업입니다. 수동으로 또는 예약으로 만들고, 서버에 보관되며, 파일 하나로 다운로드할 수 있습니다. “복원”은 백업을 되돌립니다.',
  'help.ctx.admin-backup.bullet.1': '“데이터 백업”: “백업 만들기”와, 기존 백업 목록에 “다운로드”, “복원”, 삭제.',
  'help.ctx.admin-backup.bullet.2': '“백업 업로드”는 다른 인스턴스나 이전 날짜에 만든 파일을 가져옵니다.',
  'help.ctx.admin-backup.bullet.3': '“자동 백업”: 켜기 또는 끄기, 간격, 시간과 요일, 보관할 개수.',
  'help.ctx.admin-audit.title': '감사',
  'help.ctx.admin-audit.summary':
    '보안 및 관리 관련 이벤트의 로그: 로그인과 실패, MFA 변경, 사용자와 설정 변경, 백업과 복원. 읽기 전용이며 최신 순입니다.',
  'help.ctx.admin-audit.bullet.1': '이벤트마다 한 행에 시간, 사용자, 작업, 리소스, IP, 세부 정보.',
  'help.ctx.admin-audit.bullet.2': '“새로 고침”은 다시 불러오고, “더 불러오기”는 더 과거로 갑니다.',
  // create-user
  'help.guide.create-user.title': '사용자 만들기',
  'help.guide.create-user.goal': '초대 없이 계정을 직접 추가합니다.',
  'help.guide.create-user.step.1': '“사용자” 탭 상단의 “사용자 만들기”를 클릭합니다.',
  'help.guide.create-user.step.2':
    '“사용자 이름”, “이메일”, “비밀번호”를 입력하고 “역할”을 “사용자” 또는 “관리자” 중에서 고릅니다.',
  'help.guide.create-user.step.3': '“사용자 만들기”를 클릭합니다.',
  'help.guide.create-user.result':
    '계정이 표에 나타나고 바로 로그인할 수 있습니다. 비밀번호는 신뢰할 수 있는 경로로 전달합니다.',
  'help.guide.create-user.tip.1': '비밀번호를 스스로 정해야 할 사람에게는 초대 링크가 더 나은 방법입니다.',
  'help.guide.create-user.tip.2': '관리자는 이 페이지와 감사 로그를 봅니다. 그 외에는 두 역할이 같습니다.',
  // edit-user
  'help.guide.edit-user.title': '사용자의 역할이나 비밀번호 바꾸기',
  'help.guide.edit-user.goal': '누군가를 승격하거나 강등하거나, 비밀번호를 잃은 사람을 다시 들어오게 합니다.',
  'help.guide.edit-user.step.1': '사용자 행의 연필을 클릭합니다. 계정 정보와 함께 “사용자 편집”이 열립니다.',
  'help.guide.edit-user.step.2':
    '“역할”을 바꾸거나, “새 비밀번호”를 정하거나, 패스키가 있던 기기를 잃은 사람이면 “패스키 초기화”를 클릭한 다음 “저장”합니다.',
  'help.guide.edit-user.result': '변경은 다음 요청부터 적용됩니다. 새 비밀번호는 다음 로그인부터 동작합니다.',
  'help.guide.edit-user.tip.1': '내가 마지막 관리자인 동안에는 나 자신에게서 관리자 역할을 뺄 수 없습니다.',
  'help.guide.edit-user.tip.2':
    '패스키를 초기화해도 비밀번호는 유지됩니다. 본인이 “설정”의 “계정”에서 새 패스키를 추가합니다.',
  // invite-links
  'help.guide.invite-links.title': '링크로 초대하기',
  'help.guide.invite-links.goal': '닫힌 인스턴스에 사람이 가입하게 하고, 원하면 바로 여행에 들어가게 합니다.',
  'help.guide.invite-links.step.1': '“초대 링크” 아래에서 “링크 만들기”를 클릭합니다.',
  'help.guide.invite-links.step.2':
    '“최대 사용 횟수”와 “만료 기간”을 정하고, 필요하면 “여행에 추가 (선택 사항)”을 고른 뒤 “만들기 및 복사”를 클릭합니다.',
  'help.guide.invite-links.step.3':
    '링크를 보냅니다. 각 행은 사용 횟수와 만든 사람을 보여줍니다. “링크 복사”로 다시 복사할 수 있고, 다 쓴 링크나 만료된 링크에는 표시가 붙습니다.',
  'help.guide.invite-links.result':
    '링크를 여는 사람은 자기 비밀번호로 가입하고, 여행이 지정되어 있으면 곧바로 참여합니다.',
  'help.guide.invite-links.tip.1': '초대 링크는 “설정”에서 “비밀번호 회원가입”이 꺼져 있어도 동작합니다.',
  'help.guide.invite-links.tip.2': '한 사람에게는 사용 횟수 1회에 만료 기간이 짧은 링크가 가장 안전한 기본값입니다.',
  // delete-user
  'help.guide.delete-user.title': '사용자 삭제하기',
  'help.guide.delete-user.goal': '계정과 그 계정만 소유한 모든 것을 제거합니다.',
  'help.guide.delete-user.step.1': '사용자 행의 휴지통 아이콘을 클릭하고 “사용자 삭제”를 확인합니다.',
  'help.guide.delete-user.result':
    '계정, 그 사람 자신의 여행, 여정이 사라집니다. 다른 사람과 공유한 여행은 남은 멤버에게 남습니다.',
  'help.guide.delete-user.tip.1': '되돌릴 수 없습니다. 확신이 없다면 먼저 백업을 만듭니다.',
  'help.guide.delete-user.tip.2': '마지막 관리자는 삭제할 수 없습니다. 먼저 다른 사람을 관리자로 만듭니다.',
  // permissions
  'help.guide.permissions.title': '누가 무엇을 할 수 있는지 정하기',
  'help.guide.permissions.goal': '작업별로 이 TREK에서 어떤 역할에 허용할지 설정합니다.',
  'help.guide.permissions.step.1':
    '“권한 설정”에서 작업을 해당 그룹에서 찾습니다. 예를 들어 “여행 관리” 아래의 “여행 삭제”입니다. 수준을 “모든 사람”, “여행 멤버”, “여행 소유자”, “관리자만” 중에서 고릅니다. 바뀐 행에는 “맞춤 설정됨” 표시가 붙습니다.',
  'help.guide.permissions.step.2':
    '“저장”을 클릭합니다. “기본값으로 초기화”는 모든 행을 기본 제공 수준으로 되돌립니다.',
  'help.guide.permissions.result':
    '규칙은 모든 여행에 한꺼번에 적용됩니다. 수준에 못 미치는 사람의 버튼과 메뉴는 사라집니다.',
  'help.guide.permissions.tip.1':
    '“여행 소유자”는 여행을 만든 사람을 뜻합니다. 관리자는 언제나 모든 것을 할 수 있습니다.',
  'help.guide.permissions.tip.2':
    '멤버를 삭제하기보다 수준을 낮추세요. 편집할 수 없는 멤버도 읽고 댓글을 달 수는 있습니다.',
  // default-map
  'help.guide.default-map.title': '새 사용자의 지도 기본값 정하기',
  'help.guide.default-map.goal': '개인 토큰 없이도 모든 새 계정에 동작하는 지도를 줍니다.',
  'help.guide.default-map.step.1':
    '“지도” 아래에서 “지도 엔진”을 고르고, Mapbox나 MapLibre라면 “지도 스타일”, “공유 Mapbox 토큰”, “고품질 모드”를, 래스터 지도라면 “지도 템플릿”과 “공유 CARTO 키”를 정합니다.',
  'help.guide.default-map.step.2':
    '바꾼 항목 옆의 “초기화”는 TREK 자체의 기본값으로 되돌립니다. 왼쪽의 “기본 사용자 설정”은 “색상 모드”, 단위, 통화에 대해 같은 일을 합니다.',
  'help.guide.default-map.result':
    '새 계정은 이 설정으로 시작합니다. “설정”에서 자기 지도를 정한 사람은 자기 것을 유지합니다.',
  'help.guide.default-map.tip.1': '여기에 넣은 토큰은 자기 토큰이 없는 모두가 공유하므로 할당량에 주의합니다.',
  'help.guide.default-map.tip.2': '지도 탭을 한 번도 건드리지 않은 기존 계정도 이 기본값을 따릅니다.',
  // packing-templates
  'help.guide.packing-templates.title': '짐 목록 템플릿 만들기',
  'help.guide.packing-templates.goal': '빈 목록 대신 출발점이 될 짐 목록을 여행에 줍니다.',
  'help.guide.packing-templates.step.1': '“새 템플릿”을 클릭하고 이름을 입력한 뒤 체크 표시로 확정합니다.',
  'help.guide.packing-templates.step.2':
    '템플릿을 열고 “카테고리 추가”를 클릭합니다. 각 카테고리 아래의 +가 항목을 추가하며, 항목에는 이름만 있으면 됩니다.',
  'help.guide.packing-templates.step.3':
    '모든 것이 그때그때 저장됩니다. 연필은 템플릿, 카테고리, 항목의 이름을 바꾸고 휴지통은 삭제합니다.',
  'help.guide.packing-templates.result':
    '템플릿은 모든 여행의 짐 목록에서 제안됩니다. 적용하면 항목이 복사되므로 여행마다 자유롭게 바꿀 수 있습니다.',
  'help.guide.packing-templates.tip.1': '해변, 도시, 하이킹처럼 여행 종류별 템플릿이 하나의 거대한 목록보다 낫습니다.',
  'help.guide.packing-templates.tip.2': '템플릿을 삭제해도 이미 적용한 여행에는 영향이 없습니다.',
  // categories
  'help.guide.categories.title': '카테고리 모음 관리하기',
  'help.guide.categories.goal': '장소와 컬렉션이 가질 수 있는 카테고리와 그 모양을 정합니다.',
  'help.guide.categories.step.1':
    '“새 카테고리”를 클릭하고 이름을 붙이고 아이콘과 색상을 고릅니다. “미리보기”가 결과를 보여줍니다. “생성”을 클릭합니다.',
  'help.guide.categories.step.2':
    '목록의 카테고리에 마우스를 올리면 편집하거나 삭제할 수 있습니다. 삭제는 확인을 요청합니다.',
  'help.guide.categories.result': '모음은 어디에나 한 번에 적용됩니다: 장소 인스펙터, 지도 핀, 컬렉션, 필터.',
  'help.guide.categories.tip.1':
    '장소는 카테고리 ID를 유지하므로, 카테고리 이름을 바꾸면 모든 장소에서 이름이 바뀝니다.',
  'help.guide.categories.tip.2':
    '삭제된 카테고리의 장소는 카테고리가 없어집니다. 그것이 문제라면 먼저 다시 배정합니다.',
  // school-holiday-catalog
  'help.guide.school-holiday-catalog.title': '학교 방학 직접 관리하기',
  'help.guide.school-holiday-catalog.goal': '내장 방학 피드가 다루지 않는 국가나 지역을 채웁니다.',
  'help.guide.school-holiday-catalog.step.1':
    '“학교 방학” 아래에서 “국가 추가”를 클릭하고 “국가”와 “국가 코드(예: US)”를 입력한 뒤 “저장”합니다. 그다음 다른 부분마다 “지역 추가”를 합니다.',
  'help.guide.school-holiday-catalog.step.2':
    '지역을 클릭해 “지역 또는 학군”을 엽니다. “방학 기간 추가”로 각각에 “방학 이름”, “시작일”, “종료일”을 주고 “저장”합니다. 휴지통은 기간, 지역, 그리고 지역이 하나도 남지 않은 국가를 제거합니다.',
  'help.guide.school-holiday-catalog.result':
    '사용자는 Vacay의 “설정”에서 그 국가와 지역을 찾고, 연간 그리드에서 기간을 봅니다.',
  'help.guide.school-holiday-catalog.tip.1':
    '내장 피드의 지역은 여기서 편집할 수 없습니다. 날짜가 틀리면 수동 지역을 나란히 추가합니다.',
  // auth-methods
  'help.guide.auth-methods.title': '로그인 방법 정하기',
  'help.guide.auth-methods.goal': '비밀번호 로그인, SSO, 가입을 열거나 닫고 2FA를 요구합니다.',
  'help.guide.auth-methods.step.1':
    '“인증 방법” 아래에서 “비밀번호 로그인”과 “비밀번호 회원가입”을 켜거나 끕니다. 가입이 꺼져 있으면 새 계정은 초대 링크, SSO, 직접 만들기로만 생깁니다.',
  'help.guide.auth-methods.step.2':
    '“SSO 로그인”과 “SSO 자동 프로비저닝”은 아래의 “Single Sign-On (OIDC)” 설정이 필요합니다. 자동 프로비저닝은 누군가 SSO로 처음 로그인할 때 계정을 만듭니다.',
  'help.guide.auth-methods.step.3':
    '“2단계 인증 (2FA) 요구”는 비밀번호로 로그인하는 모두가 다음 로그인 때 인증 앱을 설정하게 합니다. “패스키 로그인”에는 Relying Party ID와 내 TREK에 접속하는 오리진이 필요합니다.',
  'help.guide.auth-methods.result': '로그인 페이지에는 켜 둔 방법만 정확히 나타납니다.',
  'help.guide.auth-methods.tip.1':
    '스스로를 잠그기 전에 경고가 나타납니다. 관리자를 위한 입구 하나는 언제나 켜진 채로 남습니다.',
  'help.guide.auth-methods.tip.2': '환경 변수로 정한 값은 여기서 읽기 전용으로 보입니다.',
  // oidc
  'help.guide.oidc.title': 'Single Sign-On 연결하기',
  'help.guide.oidc.goal': '사람들이 내 ID 제공자로 로그인하게 합니다.',
  'help.guide.oidc.step.1':
    '“Single Sign-On (OIDC)” 아래에서 버튼에 쓸 “표시 이름”과, 제공자에게서 받은 “발급자 URL”, “Client ID”, “Client Secret”을 입력하고 “저장”합니다.',
  'help.guide.oidc.step.2': '“인증 방법” 아래에서 “SSO 로그인”을 켭니다.',
  'help.guide.oidc.result':
    '로그인 페이지에 SSO 버튼이 나타납니다. “SSO 자동 프로비저닝”이 켜져 있으면 처음 오는 사용자는 자동으로 계정을 받습니다.',
  'help.guide.oidc.tip.1':
    '제공자에게 필요한 리디렉션 URI는 내 TREK 주소에 문서에 있는 OIDC 콜백 경로를 붙인 것입니다.',
  'help.guide.oidc.tip.2': '어떤 SSO 그룹이 관리자가 되는지는 클레임 매핑이 정합니다. 문서의 OIDC 페이지를 참고합니다.',
  // instance-keys
  'help.guide.instance-keys.title': 'API 키 입력하기',
  'help.guide.instance-keys.goal': '인스턴스 전체에서 Google 장소 검색, Unsplash 커버, Amap을 씁니다.',
  'help.guide.instance-keys.step.1':
    '“API 키” 아래에서 “Google Maps API 키”를 붙여 넣고 “테스트”를 클릭합니다. 키가 응답하는지 필드가 알려줍니다.',
  'help.guide.instance-keys.step.2':
    '“키의 사용 범위” 아래에서 그 키로 과금해도 되는 기능만 켭니다: 자동완성, 상세 정보, 사진, 정보 보강, 장소 검색 기록.',
  'help.guide.instance-keys.step.3':
    '“Unsplash API 키”는 커버 검색을, “Amap(高德地图) API 키”는 중국 내 장소 검색을 맡습니다. 각각 같은 방식으로 테스트합니다.',
  'help.guide.instance-keys.result':
    '사용자는 자기 키 없이 기능을 씁니다. Google 키가 없으면 TREK은 무료 OpenStreetMap 스택과 TREK Places API로 검색합니다.',
  'help.guide.instance-keys.tip.1': '사용자가 “설정”에 넣은 개인 키는 그 사용자에게는 인스턴스 키보다 우선합니다.',
  'help.guide.instance-keys.tip.2': '키는 환경 변수로도 올 수 있으며, 그런 키는 여기서 읽기 전용으로 보입니다.',
  // places-transit
  'help.guide.places-transit.title': '검색과 대중교통 제공자 고르기',
  'help.guide.places-transit.goal': '장소 검색과 대중교통 경로에 누가 답할지 정합니다.',
  'help.guide.places-transit.step.1':
    '“장소 검색 제공자” 아래에서 “자동”, “Google Places”, “Amap(高德地图)”, “OpenStreetMap” 중에서 고릅니다. “자동”은 존재하는 가장 좋은 키를 씁니다.',
  'help.guide.places-transit.step.2':
    '“대중교통 제공자” 아래에서 전 세계를 키 없이 다루는 “Transitous (무료)” 또는 Google 키가 필요한 “Google”을 고릅니다.',
  'help.guide.places-transit.result': 'TREK의 모든 검색창과 모든 대중교통 경로가 이 선택을 따릅니다.',
  'help.guide.places-transit.tip.1': '키가 없는 제공자는 여기에 경고를 표시하고 OpenStreetMap으로 대체됩니다.',
  'help.guide.places-transit.tip.2': 'Google 대중교통 경로는 요청마다 과금되고, Transitous는 그렇지 않습니다.',
  // file-types
  'help.guide.file-types.title': '파일 형식 제한하기',
  'help.guide.file-types.goal': '업로드에 허용할 파일 확장자를 정합니다.',
  'help.guide.file-types.step.1': '“허용된 파일 형식” 아래에서 쉼표로 구분된 확장자 목록을 편집하고 저장합니다.',
  'help.guide.file-types.result': '그 밖의 형식은 문서, 여정, 커버 어디서든 명확한 메시지와 함께 거부됩니다.',
  'help.guide.file-types.tip.1': '이미지 형식은 목록에 남겨 둡니다. 커버와 여정 사진도 같은 검사를 거칩니다.',
  // toggle-addon
  'help.guide.toggle-addon.title': '애드온 켜거나 끄기',
  'help.guide.toggle-addon.goal': '기능 모듈을 모두에게 제공하거나 거둬들입니다.',
  'help.guide.toggle-addon.step.1':
    '애드온 타일의 스위치를 넘깁니다. 내비게이션 항목이 모두에게 한꺼번에 나타나거나 사라집니다.',
  'help.guide.toggle-addon.step.2':
    '일부 타일에는 옵션용 하위 행이 있습니다. 예를 들어 “목록” 아래의 “가방 추적”이나 “Journey” 아래의 사진 제공자입니다. 이들은 애드온이 켜져 있는 동안에만 보입니다.',
  'help.guide.toggle-addon.result': '꺼진 애드온의 데이터는 보존됩니다. 다시 켜면 다시 보입니다.',
  'help.guide.toggle-addon.tip.1': 'MCP를 끄면 엔드포인트와 그것에 의존하는 “통합” 섹션이 사라집니다.',
  'help.guide.toggle-addon.tip.2':
    'Vacay, Atlas, Journey는 사용자가 가장 많이 찾는 애드온입니다. 문서는 업로드용 스토리지가 필요합니다.',
  // install-plugin
  'help.guide.install-plugin.title': '플러그인 설치하기',
  'help.guide.install-plugin.goal': '서드파티 플러그인을 추가하고 요청한 권한만 정확히 줍니다.',
  'help.guide.install-plugin.step.1':
    '“둘러보기”를 열어 플러그인을 고르고 “설치”를 클릭하거나, “플러그인 업로드”를 클릭해 .zip 또는 .tar.gz 패키지를 고릅니다.',
  'help.guide.install-plugin.step.2':
    '“설치됨”으로 돌아가 행을 읽습니다: 플러그인이 읽거나 쓸 수 있는 것, 호출하는 호스트, 서명 여부. “플러그인 활성화”를 켭니다.',
  'help.guide.install-plugin.step.3':
    '행의 메뉴에는 “다시 시작”, “오류 로그 보기”, “허용된 호스트”, “버전 변경…”이 있고 “삭제”는 제거합니다. 새 버전이 있으면 행에서 업데이트를 제안하며, 새 권한을 요청하는 업데이트는 내가 승인할 때까지 꺼진 채로 남습니다.',
  'help.guide.install-plugin.result':
    '플러그인은 자체 프로세스로 실행됩니다. 플러그인이 추가하는 위젯, 지도 레이어, 도구는 플러그인이 선언한 곳에 나타납니다.',
  'help.guide.install-plugin.tip.1': '“다시 스캔”은 패키지 없이 개발용으로 연결한 플러그인 폴더를 불러옵니다.',
  'help.guide.install-plugin.tip.2': '서명되지 않은 플러그인에는 그렇게 표시됩니다. 출처를 신뢰할 때만 설치합니다.',
  // storage-backends
  'help.guide.storage-backends.title': '업로드를 S3나 미러로 옮기기',
  'help.guide.storage-backends.goal': '파일을 오브젝트 스토리지에, 또는 디스크와 버킷 양쪽에 보관합니다.',
  'help.guide.storage-backends.step.1':
    '“백엔드” 아래에서 “백엔드 추가”를 클릭하고 “이름”을 붙이고 “유형”을 “로컬”, “S3”, “미러” 중에서 고른 뒤 필드를 채우고 “적용”합니다. “테스트”는 연결을 확인하고 “변경 사항 저장”은 기록합니다.',
  'help.guide.storage-backends.step.2':
    '“카테고리” 아래에서 각 업로드 카테고리를 백엔드에 배정합니다. 하나를 바꾸면 “기존 객체 이동”인지 “새 쓰기만 전환”인지 묻습니다.',
  'help.guide.storage-backends.step.3':
    '상단의 “상태”가 모든 백엔드를 점검합니다. 빨간 항목은 무엇이 실패했는지 알려줍니다.',
  'help.guide.storage-backends.result': '새 업로드는 배정된 백엔드로 갑니다. 옮긴 파일은 그곳에서 제공됩니다.',
  'help.guide.storage-backends.tip.1': '환경 변수로 설정된 백엔드는 표시되지만 여기서 편집할 수 없습니다.',
  'help.guide.storage-backends.tip.2': '미러는 양쪽에 쓰고 첫 번째에서 읽습니다. 중단 없이 이전하는 데 씁니다.',
  // channels-instance
  'help.guide.channels-instance.title': '알림 채널 설정하기',
  'help.guide.channels-instance.goal': '사용자가 고를 수 있는 채널을 정하고 이메일을 설정합니다.',
  'help.guide.channels-instance.step.1':
    '“이메일 (SMTP)” 아래에서 SMTP Host, SMTP Port, SMTP User, SMTP Password, From Address를 입력합니다. “테스트 이메일 전송”은 나에게 메일을 보냅니다.',
  'help.guide.channels-instance.step.2':
    '“웹 푸시”, “Ntfy”, “웹훅”을 켜서 제공합니다. 그러면 사용자는 “설정”의 “알림”에서 기기별로 푸시를 켜거나 자기 토픽이나 URL을 입력합니다.',
  'help.guide.channels-instance.step.3':
    '“여행 리마인더”는 여행 시작 전 리마인더를 켜고 끕니다. “앱 내”는 언제나 켜져 있고 여기서는 설명만 합니다.',
  'help.guide.channels-instance.result': '모든 사용자의 “알림” 탭에 내가 켠 채널이 나타납니다.',
  'help.guide.channels-instance.tip.1':
    '여기에 넣은 기본 ntfy 서버는 사용자에게 미리 채워집니다. 사용자는 여전히 자기 서버를 지정할 수 있습니다.',
  'help.guide.channels-instance.tip.2': '플러그인 채널은 그 기능을 가진 플러그인이 활성화되면 저절로 나타납니다.',
  // admin-channels
  'help.guide.admin-channels.title': '관리자 이벤트를 휴대폰으로 받기',
  'help.guide.admin-channels.goal': '실패한 백업, 새 릴리스, 그 밖의 인스턴스 이벤트를 알림으로 받습니다.',
  'help.guide.admin-channels.step.1':
    '“관리자 Ntfy” 아래에서 토픽과, 필요하면 서버와 토큰을 입력합니다. “관리자 웹훅” 아래에는 URL을 입력합니다.',
  'help.guide.admin-channels.step.2': '“테스트 ntfy 전송” 또는 “테스트 웹훅 전송”을 클릭해 메시지가 도착하는지 봅니다.',
  'help.guide.admin-channels.result': '관리자 이벤트는 모든 관리자의 앱 내 벨에 더해 그곳으로도 갑니다.',
  'help.guide.admin-channels.tip.1':
    '관리자 토픽은 개인 토픽과 분리해 둡니다. 장애 알림이 여행 알림에 묻히지 않게 하기 위해서입니다.',
  // mcp-tokens-admin
  'help.guide.mcp-tokens-admin.title': 'AI 접근 취소하기',
  'help.guide.mcp-tokens-admin.goal': '어느 사용자든 AI 클라이언트가 가진 모든 토큰과 세션을 보고 끊습니다.',
  'help.guide.mcp-tokens-admin.step.1':
    '“API 토큰” 아래에서 사용자와 이름으로 토큰을 찾습니다. 휴지통이 삭제하며 클라이언트는 즉시 멈춥니다.',
  'help.guide.mcp-tokens-admin.step.2':
    '“OAuth 세션” 아래에서는 브라우저 기반 클라이언트에 대해 같은 일을 합니다: 클라이언트, 사용자, 날짜가 있고 휴지통이 세션을 취소합니다.',
  'help.guide.mcp-tokens-admin.result':
    '클라이언트는 그 사용자가 다시 연결해야 합니다. 그 밖에는 아무것도 바뀌지 않습니다.',
  'help.guide.mcp-tokens-admin.tip.1':
    '스코프는 클라이언트가 무엇을 할 수 있었는지 알려줍니다. 읽기 전용 스코프는 남겨 두어도 무해합니다.',
  'help.guide.mcp-tokens-admin.tip.2': 'MCP 애드온을 끄면 모든 것이 한꺼번에 취소됩니다.',
  // release-history
  'help.guide.release-history.title': '새 릴리스 확인하기',
  'help.guide.release-history.goal': '내 TREK이 최신인지, 다음 버전이 무엇을 가져오는지 압니다.',
  'help.guide.release-history.step.1':
    '새 릴리스가 있으면 관리자 페이지 상단에 “업데이트 사용 가능”이 보입니다. “GitHub에서 보기”가 그것을 열고, “업데이트 방법”이 Docker와 그 밖의 설치 방식의 업데이트를 설명합니다.',
  'help.guide.release-history.step.2':
    '“릴리스 히스토리”는 모든 릴리스를 노트와 함께 나열합니다. “상세 보기”가 펼치고, 가장 새것에는 “최신”이 붙으며, “더 불러오기”는 더 과거로 갑니다.',
  'help.guide.release-history.result':
    '업데이트는 호스트에서 새 이미지를 받거나 새 태그를 빌드해 이루어집니다. 데이터 디렉터리는 그대로 남습니다.',
  'help.guide.release-history.tip.1': '업데이트 전에 백업을 만듭니다. “백업” 탭이 바로 옆에 있습니다.',
  'help.guide.release-history.tip.2':
    '프리릴리스는 표시되지만, 내가 프리릴리스를 쓰고 있지 않는 한 업데이트로 알리지 않습니다.',
  // create-backup
  'help.guide.create-backup.title': '백업 만들고 복원하기',
  'help.guide.create-backup.goal': '인스턴스 전체의 스냅샷을 만들고, 사본을 다른 곳에 두고, 되돌릴 수 있게 합니다.',
  'help.guide.create-backup.step.1':
    '“데이터 백업” 아래에서 “백업 만들기”를 클릭합니다. 데이터베이스와 업로드를 서버의 파일 하나로 묶습니다.',
  'help.guide.create-backup.step.2':
    '“다운로드”는 사본을 이 기기 밖에 보관합니다. 휴지통은 오래된 것을 삭제해 공간을 확보합니다.',
  'help.guide.create-backup.step.3':
    '백업의 “복원”이나 파일을 이용한 “백업 업로드”는 “백업을 복원할까요?”가 한 번 확인한 뒤 현재 데이터를 대체합니다.',
  'help.guide.create-backup.result':
    '복원은 사용자, 여행, 파일, 설정을 그 백업 시점으로 되돌리며, 모두가 로그아웃됩니다.',
  'help.guide.create-backup.tip.1': '복원은 여기서 유일하게 되돌릴 수 없는 작업입니다. 먼저 새 백업을 만듭니다.',
  'help.guide.create-backup.tip.2': '백업은 데이터 디렉터리에 있습니다. 다른 기기에 사본이 있어야 비로소 백업입니다.',
  // auto-backup
  'help.guide.auto-backup.title': '백업 예약하기',
  'help.guide.auto-backup.goal': '서버가 스스로 백업하고 최근 몇 개만 남기게 합니다.',
  'help.guide.auto-backup.step.1':
    '“자동 백업” 아래에서 “자동 백업 활성화”를 켜고 “간격”, “실행 시간”, 그리고 주간이나 월간이면 “요일” 또는 “매월 몇 일”을 고릅니다.',
  'help.guide.auto-backup.step.2':
    '“이후 오래된 백업 삭제”는 백업을 얼마나 오래 보관할지 정합니다. 새 백업이 만들어지면 더 오래된 것은 사라집니다.',
  'help.guide.auto-backup.result': '백업이 예약대로 목록에 나타납니다. 실패는 관리자 채널로 전달됩니다.',
  'help.guide.auto-backup.tip.1': '시간은 서버의 시간대를 따르며, “감사” 탭에 표시됩니다.',
  'help.guide.auto-backup.tip.2': '서버의 저장 공간은 유한합니다. 세 개에서 다섯 개를 보관하면 보통 충분합니다.',
  // audit-log
  'help.guide.audit-log.title': '감사 로그 읽기',
  'help.guide.audit-log.goal': '누가 무엇을 언제 했는지 알아냅니다.',
  'help.guide.audit-log.step.1':
    '행을 읽습니다: 시간, 사용자, 작업, 리소스, IP, 세부 정보, 최신 순. 작업은 로그인 실패, MFA 변경, 복원처럼 일어난 일로 이름이 붙습니다.',
  'help.guide.audit-log.step.2': '“새로 고침”은 맨 위를 다시 불러오고, “더 불러오기”는 더 과거로 갑니다.',
  'help.guide.audit-log.result': '왜 무언가가 바뀌었는지 묻는 사람에게 건넬 수 있는 기록입니다.',
  'help.guide.audit-log.tip.1': '시간은 서버의 시간대로 표시되며, 표 위에 그 이름이 있습니다.',
  'help.guide.audit-log.tip.2': '로그는 추가 전용입니다. 여기의 어떤 것도 앱에서 편집하거나 삭제할 수 없습니다.',
  // document-providers
  'help.guide.document-providers.title': '문서 저장소 제공하기',
  'help.guide.document-providers.goal': '여행이 어떤 저장소와 문서를 맞춰 둘 수 있는지 정합니다.',
  'help.guide.document-providers.step.1':
    '“문서” 타일은 선반에 저장소를 행으로 담고 있습니다. Paperless-ngx, Papra, Nextcloud, OpenCloud, Synology Drive입니다. 다섯 모두 처음에는 꺼져 있고, 선반은 “문서” 자체가 켜져 있는 동안에만 있습니다.',
  'help.guide.document-providers.step.2':
    'Nextcloud 행의 스위치를 넘깁니다. 메시지는 “애드온이 업데이트되었습니다”라고 적히고, 이제부터 여행 소유자는 자기 여행의 “파일” 탭에서 “문서 동기화”를 찾고, “저장소 연결” 아래에 Nextcloud가 있습니다.',
  'help.guide.document-providers.result':
    '그 저장소는 이 TREK의 모든 여행에 제공됩니다. 여행 소유자가 연결하기 전까지는 아무것도 연결되지 않습니다.',
  'help.guide.document-providers.tip.1':
    '여기서 정하는 것은 저장소를 제공해도 되는지뿐입니다. 주소와 자격 증명은 여행에 속하며, 그 “파일” 탭에서 여행 소유자가 입력합니다. 관리자 패널에서는 절대 입력하지 않습니다.',
  'help.guide.document-providers.tip.2':
    '“문서”를 끄면 모든 저장소가 함께 꺼지고, “문서”가 꺼져 있는 동안에는 저장소를 켤 수 없습니다. 서버는 “Enable the Documents addon first”라고 답합니다. 자체 네트워크의 저장소에는 서버에 ALLOW_INTERNAL_NETWORK=true도 필요합니다.',

  // ── Screen: trip ──────────────────────────────────────────────────────────────────────
  'help.ctx.trip.title': '여행',
  'help.ctx.trip.summary':
    '여행 하나의 모든 것: 일자, 지도, 장소가 있는 계획과 교통, 예약, 목록, 비용, 파일, 협업 탭입니다. 각각은 이 화면 아래에 자기만의 도움말 화면이 있습니다.',
  'help.ctx.trip.bullet.1':
    '탭 바: “계획”, “교통”, “예약”, “목록”, “비용”, “파일”, “Collab”. 어떤 탭이 있는지는 나의 TREK에 있는 애드온과 플러그인이 정합니다.',
  'help.ctx.trip.bullet.2':
    '“계획”은 세 개의 열입니다. 왼쪽에 일자, 가운데에 지도, 오른쪽에 장소. 예약과 교통은 계획 안에, 즉 경유지와 경유지 사이에 있고, 탭은 그것들을 목록으로 보여줍니다.',
  'help.ctx.trip.bullet.3':
    '오른쪽 위의 “공유”는 여행의 사람들을 엽니다. 멤버, 게스트, 초대 링크, 그리고 읽기 전용 공개 링크입니다.',
  'help.ctx.trip.bullet.4': '제목, 날짜, 커버, 통화는 “내 여행”에서 여행 카드의 연필로 편집합니다.',
  'help.ctx.trip.bullet.5':
    '열의 안쪽 가장자리에 있는 셰브론은 열을 접고, 지도가 그 자리를 차지합니다. 열 옆의 얇은 구분선은 열의 너비를 바꿉니다.',
  'help.ctx.trip.bullet.6': '일자 도구 모음의 실행 취소 화살표는 계획에 대한 마지막 변경을 되돌립니다.',
  // add-member
  'help.guide.add-member.title': '멤버 추가하기',
  'help.guide.add-member.goal': 'TREK 계정이 있는 사람에게 이 여행에 대한 접근 권한을 줍니다.',
  'help.guide.add-member.step.1': '오른쪽 위의 “공유”를 클릭합니다.',
  'help.guide.add-member.step.2': '“사용자 초대” 아래에서 목록에서 그 사람을 고르고 “초대”를 클릭합니다.',
  'help.guide.add-member.step.3':
    '이제 그 사람이 “접근” 아래에 나타납니다. 왕관은 소유자를 표시하고, 행 끝의 아이콘은 접근 권한을 다시 제거합니다.',
  'help.guide.add-member.result':
    '멤버는 나와 똑같이 여행을 보고 편집합니다. 관리자가 “권한 설정”에서 정한 수준 안에서입니다.',
  'help.guide.add-member.tip.1':
    '목록에 없는 사람은 아직 TREK 계정이 없습니다. 게스트로 추가하거나 초대 링크로 가입하게 하세요.',
  'help.guide.add-member.tip.2': '“접근” 옆의 숫자는 여행에 있는 사람 수입니다. 게스트는 아래에 따로 나열됩니다.',
  // trip-invite-link
  'help.guide.trip-invite-link.title': '링크로 초대하기',
  'help.guide.trip-invite-link.goal': '사람들이 스스로 여행에 참여하게 합니다.',
  'help.guide.trip-invite-link.step.1':
    '“공유”를 클릭한 다음 “여행 초대 링크” 아래에서 “초대 링크 만들기”를 클릭합니다.',
  'help.guide.trip-invite-link.step.2':
    '“복사”를 클릭하고 링크를 보냅니다. TREK 계정이 있는 사람이 링크를 열면 멤버로 참여합니다.',
  'help.guide.trip-invite-link.step.3':
    '“다시 생성”은 링크를 교체하고 이전 링크를 쓸 수 없게 합니다. “비활성화”는 링크를 끕니다.',
  'help.guide.trip-invite-link.result': '링크를 연 사람은 여행에 들어와 “접근” 아래에 나타납니다.',
  'help.guide.trip-invite-link.tip.1':
    '계정이 없는 사람은 쓸 수 없습니다. 관리자는 “관리자”, “사용자”에서 가입 링크를 나눠 주며, 링크 하나를 이 여행에 묶을 수 있습니다.',
  'help.guide.trip-invite-link.tip.2':
    '링크가 엉뚱한 채팅방으로 갔다면 다시 생성하세요. 이전 링크는 즉시 작동을 멈춥니다.',
  // add-guest
  'help.guide.add-guest.title': '계정 없는 게스트 추가하기',
  'help.guide.add-guest.goal': 'TREK을 쓰지 않는 사람을 여행에 포함합니다.',
  'help.guide.add-guest.step.1': '“공유”를 클릭하고 “게스트”까지 스크롤합니다.',
  'help.guide.add-guest.step.2': '“게스트 이름”에 이름을 입력하고 “게스트 추가”를 클릭합니다.',
  'help.guide.add-guest.result': '게스트는 비용, 짐 항목, 할 일에 배정할 수 있지만 로그인할 수는 없습니다.',
  'help.guide.add-guest.tip.1':
    '연필은 게스트의 이름을 바꾸고, 행 끝의 아이콘은 게스트를 분담과 배정과 함께 제거합니다.',
  'help.guide.add-guest.tip.2': '그 사람이 나중에 계정을 만들면 멤버로 초대하고 게스트를 제거하세요.',
  // public-link
  'help.guide.public-link.title': '읽기 전용 링크 게시하기',
  'help.guide.public-link.goal': '편집하면 안 되는 사람에게 여행을 보여 줍니다.',
  'help.guide.public-link.step.1':
    '“공유”를 클릭합니다. 오른쪽의 “공개 링크” 아래에서 링크가 보여 줄 수 있는 항목에 체크합니다. “지도 및 계획”은 항상 켜져 있고, “예약”, “짐 목록”, “비용”, “채팅”은 내가 고릅니다.',
  'help.guide.public-link.step.2': '“링크 만들기”를 클릭한 다음 “복사”를 클릭합니다.',
  'help.guide.public-link.step.3': '체크는 링크가 있는 동안 바꿀 수 있습니다. “링크 삭제”는 링크를 멈춥니다.',
  'help.guide.public-link.result': '링크가 있는 사람은 로그인 없이 선택된 부분을 보지만 아무것도 바꿀 수 없습니다.',
  'help.guide.public-link.tip.1':
    '이 링크는 어디에도 나열되지 않습니다. 가진 사람은 누구나 열 수 있으니 비밀번호처럼 다루세요.',
  'help.guide.public-link.tip.2': '편집 권한이 필요하면 대신 그 사람을 멤버로 추가하세요.',
  // transfer-ownership
  'help.guide.transfer-ownership.title': '여행을 넘기거나 떠나기',
  'help.guide.transfer-ownership.goal': '다른 사람을 소유자로 만들거나, 내 것이 아닌 여행에서 빠져나옵니다.',
  'help.guide.transfer-ownership.step.1':
    '“공유”를 클릭합니다. “접근” 아래에서 멤버 행의 왕관을 누르면 그 사람이 소유자가 됩니다. 확인 질문에 답합니다.',
  'help.guide.transfer-ownership.step.2': '내 행의 “여행 떠나기”는 나를 여행에서 내보냅니다. 소유자라면 먼저 넘기세요.',
  'help.guide.transfer-ownership.result':
    '새 소유자가 멤버를 관리하고 여행을 삭제할 수 있습니다. 나는 일반 멤버로 남습니다.',
  'help.guide.transfer-ownership.tip.1':
    '넘기기 전까지는 여행을 만든 사람이 소유자입니다. 여행 삭제는 소유자만 할 수 있습니다.',
  'help.guide.transfer-ownership.tip.2':
    '다른 사람 행의 “접근 권한 제거”는 같은 버튼의 반대 방향입니다. 소유자가 멤버를 내보냅니다.',
  // collapse-columns
  'help.guide.collapse-columns.title': '지도에 공간 내주기',
  'help.guide.collapse-columns.goal': '열을 접거나 더 넓게 만듭니다.',
  'help.guide.collapse-columns.step.1':
    '일자 열의 안쪽 가장자리에 있는 셰브론을 클릭해 접습니다. 지도가 그 공간을 차지합니다. 장소 열에도 같은 셰브론이 있습니다.',
  'help.guide.collapse-columns.step.2': '셰브론을 다시 클릭하면 열이 돌아옵니다.',
  'help.guide.collapse-columns.step.3': '열과 지도 사이의 얇은 구분선을 끌어 열의 너비를 바꿉니다.',
  'help.guide.collapse-columns.result': '너비는 기억됩니다. 다음에 열면 열은 펼쳐진 상태로 돌아옵니다.',
  'help.guide.collapse-columns.tip.1': '두 열을 한꺼번에 접으면 지도만 보이는 화면이 됩니다.',
  'help.guide.collapse-columns.tip.2': '휴대전화에는 열이 없습니다. “계획”과 “장소”가 지도 아래쪽의 두 버튼입니다.',
  // undo-change
  'help.guide.undo-change.title': '마지막 변경 실행 취소하기',
  'help.guide.undo-change.goal': '방금 계획에 한 일을 되돌립니다.',
  'help.guide.undo-change.step.1':
    '일자 위의 도구 모음에서 실행 취소 화살표를 클릭합니다. 툴팁에 되돌릴 변경이 표시됩니다.',
  'help.guide.undo-change.result': '계획은 원래대로 돌아가고, 화살표는 다음 변경 때까지 회색이 됩니다.',
  'help.guide.undo-change.tip.1':
    '실행 취소는 계획을 다룹니다. 장소 배정, 제거, 순서 변경, 이동, 경로 최적화, 장소 삭제, 카테고리 변경, 가져오기입니다.',
  'help.guide.undo-change.tip.2':
    '깊이는 한 단계입니다. 최근 변경만 되돌릴 수 있고, 새 변경이 생기면 그것으로 대체됩니다.',

  // ── Screen: trip-places ───────────────────────────────────────────────────────────────
  'help.ctx.trip-places.title': '장소',
  'help.ctx.trip-places.summary':
    '계획의 오른쪽 열입니다. 계획된 것이든 아니든 여행의 모든 장소가 검색과 필터와 함께 있고, 장소를 들여오는 방법도 여기에 있습니다. 손으로, 파일에서, 또는 공유된 목록에서.',
  'help.ctx.trip-places.bullet.1':
    '맨 위의 “장소/활동 추가”는 직접 입력하거나 검색한 장소의 양식을 엽니다. 날짜가 열려 있는 동안에는 버튼이 “새 장소”가 되고, 그 옆의 “해당 날짜로”는 장소를 바로 그 날짜에 만듭니다.',
  'help.ctx.trip-places.bullet.2':
    '“파일 가져오기”는 .gpx, .kml, .kmz 파일을 받습니다. “목록 가져오기”는 공유된 Google Maps 또는 Naver Maps 목록을 받습니다. 파일은 그냥 이 열에 끌어다 놓아도 됩니다.',
  'help.ctx.trip-places.bullet.3':
    '드롭다운은 “전체”, “미계획”, “계획됨” 사이를 전환하고, 트랙을 가져오고 나면 “트랙”도 생깁니다. 그 아래에 검색, 카테고리 필터, 최소 평점을 위한 별이 있습니다.',
  'help.ctx.trip-places.bullet.4':
    '행에는 사진, 이름, 그리고 설명이나 주소가 나옵니다. 클릭하면 장소 세부정보가 열리고, 날짜로 끌어다 놓을 수 있으며, 오른쪽 클릭하면 “편집”, “+ 날에 추가”, “웹사이트 열기”, “Google Maps”, “컬렉션에 저장”, “삭제”가 나옵니다.',
  'help.ctx.trip-places.bullet.5':
    '날짜가 열려 있으면 미계획 행 끝의 +가 그 장소를 그 날짜에 넣고, “계획됨”은 그 날짜만 보여 줍니다. “전체 여행 보기”로 다시 넓힐 수 있습니다.',
  'help.ctx.trip-places.bullet.6':
    '필터 행 오른쪽 끝의 체크 표시는 선택을 시작합니다. 여러 행이 한 번에 새 카테고리를 받거나, 컬렉션에 들어가거나, 삭제됩니다.',
  // create-place
  'help.guide.create-place.title': '장소 만들기',
  'help.guide.create-place.goal': '계획이 알아야 할 것을 모두 담아 장소나 활동을 손으로 추가합니다.',
  'help.guide.create-place.step.1':
    '장소 열 맨 위의 “장소/활동 추가”를 클릭합니다(날짜가 열려 있으면 “새 장소”). 양식이 열립니다.',
  'help.guide.create-place.step.2':
    '맨 위의 “장소 검색...”에 장소를 입력하고 결과를 고릅니다. “이름”, “주소”, “위도”, “경도”, “웹사이트”가 채워지고, 왼쪽의 “장소 세부정보”에 사진과 영업시간, 설명이 나옵니다. Google 키가 있는 TREK에서는 “찾는 장소가 아닌가요? Google에서 검색”이 목록 아래에 있어, 같은 검색을 Google로 실행합니다.',
  'help.guide.create-place.step.3':
    '“장소 세부정보”에서 “사진 선택” 아래의 사진을 클릭하면 그것이 장소의 이미지가 됩니다. “이 텍스트 사용”은 설명을 양식으로 옮깁니다.',
  'help.guide.create-place.step.4':
    '항목을 확인합니다. “이름”은 필수입니다. “설명”과 “메모”는 직접 적는 칸입니다. “주소”, “위도”, “경도”는 검색에서 오거나 직접 입력합니다. “카테고리”는 여행의 카테고리 중 하나를 고르고, 그 옆의 +는 그 자리에서 새 카테고리를 만듭니다. “웹사이트”에는 링크를 넣습니다.',
  'help.guide.create-place.step.5':
    '“추가”를 클릭합니다. 같은 이름의 장소가 이미 여행에 있으면 양식이 그렇게 알려 주고 버튼이 “그래도 추가”로 바뀝니다.',
  'help.guide.create-place.result': '장소가 목록과 지도에 있습니다. 날짜에 놓이기 전까지는 “미계획” 아래에 있습니다.',
  'help.guide.create-place.tip.1':
    '양식 아래의 “파일”과 “비용”은 장소에 문서를 첨부하거나, 저장한 직후 그 지출의 “비용” 편집기를 엽니다.',
  'help.guide.create-place.tip.2':
    '어느 TREK에서나 검색에 답하는 것은 TREK 색인과 OpenStreetMap이고, “장소 세부정보”는 Wikipedia, Wikivoyage, Wikimedia에서 스스로를 채웁니다. Google은 둘 다 아무것도 찾지 못한 곳에서만 쓰이고, 평점을 가져오는 것은 Google뿐입니다.',
  'help.guide.create-place.tip.3':
    '장소는 지도에서 시작할 수도 있습니다. 그 지점을 오른쪽 클릭하면 좌표와 주소가 채워진 양식이 열립니다.',
  // place-to-open-day
  'help.guide.place-to-open-day.title': '열린 날짜에 장소를 바로 추가하기',
  'help.guide.place-to-open-day.goal': '두 번째 단계를 건너뜁니다. 장소를 만들거나 고르면 바로 그 날짜에 들어갑니다.',
  'help.guide.place-to-open-day.step.1':
    '일자 열에서 날짜의 머리글을 클릭합니다. 그 날짜가 열립니다. 카드가 강조되고, 장소 열에 “해당 날짜로” 버튼이 생깁니다.',
  'help.guide.place-to-open-day.step.2':
    '“해당 날짜로”는 “새 장소”와 같은 양식을 열지만, “추가”를 클릭하는 순간 장소가 열린 날짜에 놓입니다.',
  'help.guide.place-to-open-day.step.3':
    '이미 있는 장소는 행 끝의 +로, 또는 오른쪽 클릭 후 “+ 날에 추가”로 열린 날짜에 들어갑니다.',
  'help.guide.place-to-open-day.step.4':
    '반대 방향도 됩니다. 게다가 날짜를 먼저 열어 둘 필요도 없습니다. 장소의 행을 열에서 끌어내 날짜 카드 위에 놓으세요. 두 경유지 사이에 놓으면 정확히 그 자리에 들어갑니다.',
  'help.guide.place-to-open-day.result': '장소가 그 날짜 아래 맨 끝에 나열됩니다. 위아래로 끌어 제자리로 옮기세요.',
  'help.guide.place-to-open-day.tip.1':
    '열어 둔 날짜는 검색에도 반영됩니다. 날짜가 열려 있으면 지도와 주변 검색이 그날이 이미 향하는 곳에서 시작합니다.',
  'help.guide.place-to-open-day.tip.2': '일자 위의 도구 모음에 있는 “실행 취소”가 이 배정을 되돌립니다.',
  // filter-places
  'help.guide.filter-places.title': '목록에서 장소 찾기',
  'help.guide.filter-places.goal': '찾는 장소만 남도록 열을 좁힙니다.',
  'help.guide.filter-places.step.1':
    '맨 위의 드롭다운은 “전체”, “미계획”(아직 어느 날짜에도 없음), “계획됨”(어느 날짜에 있음), “트랙”(가져온 GPX 트랙) 사이를 전환하고, 각각 개수가 붙습니다.',
  'help.guide.filter-places.step.2': '“장소 검색...”에 입력합니다. 입력할수록 목록이 좁아집니다.',
  'help.guide.filter-places.step.3':
    '“모든 카테고리”는 카테고리를 하나 이상 체크하는 목록을 엽니다. 그중에 “카테고리 없음”도 있습니다. 맨 아래의 “필터 지우기”가 되돌립니다.',
  'help.guide.filter-places.step.4':
    '그 옆의 별은 최소 평점을 정합니다. 5+, 4+ 같은 식으로, 그만큼 이상으로 평가한 장소만 보여 줍니다.',
  'help.guide.filter-places.result': '행 위의 숫자가 몇 개의 장소가 맞는지 알려 줍니다. 필터는 서로 겹쳐서 적용됩니다.',
  'help.guide.filter-places.tip.1':
    '날짜가 열려 있으면 “계획됨”은 그 날짜만 보여 주고 그렇게 알려 줍니다. “열린 날짜만 표시 중”, 그 옆에 “전체 여행 보기”입니다.',
  'help.guide.filter-places.tip.2':
    '지도도 열린 날짜로 좁혀집니다. 목록의 “전체”는 여전히 여행의 모든 장소를 보여 줍니다.',
  // edit-place
  'help.guide.edit-place.title': '장소 바꾸기',
  'help.guide.edit-place.goal': '이름을 고치고, 핀을 옮기고, 웹사이트를 넣고, 카테고리를 바꿉니다.',
  'help.guide.edit-place.step.1':
    '행을 오른쪽 클릭하고 “편집”을 고르거나, 장소를 열어 세부정보에서 “편집”을 클릭합니다.',
  'help.guide.edit-place.step.2':
    '필요한 것을 바꿉니다. “이름”, “설명”, “메모”, “주소”, “위도”와 “경도”, “카테고리”, “웹사이트”. 날짜에서 열면 양식에 그 날짜를 위한 “이 날의 메모”와 “시작”, “종료”도 있습니다.',
  'help.guide.edit-place.step.3': '“업데이트”를 클릭합니다.',
  'help.guide.edit-place.result':
    '변경은 그 장소가 나오는 모든 곳에 적용됩니다. 목록, 지도, 그리고 그 장소가 있는 모든 날짜입니다.',
  'help.guide.edit-place.tip.1': '“이 날의 메모”는 그 하루의 장소에 속하고, “메모”는 장소 자체에 속합니다.',
  'help.guide.edit-place.tip.2':
    '“시작”보다 앞선 “종료”는 “업데이트”를 막습니다. “시간 겹침:”은 그 날의 다른 경유지가 같은 시간이라는 것을 알릴 뿐입니다.',
  // delete-place
  'help.guide.delete-place.title': '장소 삭제하기',
  'help.guide.delete-place.goal': '장소를 여행에서 완전히 빼냅니다.',
  'help.guide.delete-place.step.1': '행을 오른쪽 클릭하고 “삭제”를 고르거나, 장소 세부정보에서 “삭제”를 클릭합니다.',
  'help.guide.delete-place.step.2':
    '확인합니다. 그 장소에 숙박이 예약되어 있거나 예약이 연결되어 있으면, 무엇이 함께 사라지는지 질문이 알려 줍니다.',
  'help.guide.delete-place.result':
    '장소가 목록, 지도, 모든 날짜에서 사라집니다. 일자 위의 도구 모음에 있는 “실행 취소”가 되돌립니다.',
  'help.guide.delete-place.tip.1': '하루에서만 장소를 빼려면 삭제 대신 그 경유지에서 “날에서 제거”를 쓰세요.',
  'help.guide.delete-place.tip.2': '여러 장소를 한 번에: 필터 옆의 체크 표시가 선택을 시작합니다.',
  // select-places
  'help.guide.select-places.title': '여러 장소를 한 번에 바꾸거나 삭제하기',
  'help.guide.select-places.goal': '하나씩이 아니라 한 번에 목록을 정리합니다.',
  'help.guide.select-places.step.1':
    '필터 행 오른쪽 끝의 체크 표시를 클릭합니다. 행에 체크박스가 생기고 동작이 담긴 바가 나타납니다.',
  'help.guide.select-places.step.2': '행을 체크하거나 바의 “전체 선택”을 씁니다. 바가 선택된 수를 셉니다.',
  'help.guide.select-places.step.3':
    '“Change category”는 모두에게 하나의 카테고리를 줍니다. “컬렉션에 저장”은 그것들을 내 컬렉션 중 하나로 복사합니다. “선택 항목 삭제”는 확인 후 그것들을 지웁니다.',
  'help.guide.select-places.step.4': '체크 표시를 다시 클릭하면 선택에서 빠져나옵니다.',
  'help.guide.select-places.result':
    '변경은 선택된 모든 장소에 적용됩니다. 삭제는 일자 위의 도구 모음에서 되돌릴 수 있습니다.',
  'help.guide.select-places.tip.1':
    '선택하는 동안에도 필터는 그대로 작동합니다. 먼저 “미계획”으로 거른 다음 “전체 선택”을 하면 정확히 그것들만 잡힙니다.',
  'help.guide.select-places.tip.2':
    '컬렉션 애드온이 켜져 있으면 바에 “내 목록에서 방문함으로 표시”가 나타납니다. 그 장소들이 저장된 컬렉션에서 방문 표시를 해 줍니다.',
  // import-places-file
  'help.guide.import-places-file.title': 'GPX, KML, KMZ 파일에서 장소 가져오기',
  'help.guide.import-places-file.goal': 'Google My Maps, Google Earth 또는 GPS 추적기가 내보낸 것을 들여옵니다.',
  'help.guide.import-places-file.step.1': '“파일 가져오기”를 클릭하거나, 장소 열 아무 데나 파일을 끌어다 놓습니다.',
  'help.guide.import-places-file.step.2':
    '파일을 고르거나 상자로 끌어다 놓습니다. GPX는 무엇을 가져올지 체크합니다. “웨이포인트”, “경로”, “트랙 (경로 형상 포함)”입니다. KML과 KMZ는 “포인트 (Placemarks)”와 “경로 (LineStrings)”입니다.',
  'help.guide.import-places-file.step.3':
    '상자는 여러 파일을 한 번에 받고, .gpx, .kml, .kmz만 받습니다. 다른 종류의 파일이나 10 MB가 넘는 파일은 대화 상자에서 거부되고 가져오지 않습니다.',
  'help.guide.import-places-file.step.4':
    '“가져오기”를 클릭합니다. 장소가 몇 개 들어왔는지 메시지로 알려 줍니다. KML이나 KMZ 파일이면 무엇이 만들어지고 무엇이 건너뛰어졌는지 요약과 함께 대화 상자가 열린 채로 남습니다.',
  'help.guide.import-places-file.result':
    '장소들이 목록에 있습니다. 트랙은 행에 경로 표시가 붙고, 지도에 그려지며, 자기만의 “트랙” 필터를 얻습니다.',
  'help.guide.import-places-file.tip.1':
    '너무 큰 파일은 크기 제한과 함께 거부됩니다. 사진 없이 다시 내보내거나 나누세요.',
  'help.guide.import-places-file.tip.2': '가져오기는 일자 위의 도구 모음에서 통째로 되돌릴 수 있습니다.',
  // import-places-list
  'help.guide.import-places-list.title': '공유된 Google Maps 또는 Naver Maps 목록 가져오기',
  'help.guide.import-places-list.goal': '공유된 목록 링크를 장소로 바꿉니다.',
  'help.guide.import-places-list.step.1': '“목록 가져오기”를 클릭하고 “Google 목록”이나 “네이버 목록”을 고릅니다.',
  'help.guide.import-places-list.step.2':
    '목록의 공유 링크를 붙여 넣습니다. Google Maps 길찾기 링크도 됩니다. 그 경유지들이 주행 순서대로 장소가 됩니다.',
  'help.guide.import-places-list.step.3': '“가져오기”를 클릭합니다.',
  'help.guide.import-places-list.result':
    '목록의 모든 장소가 여행에 들어오고, 이름은 목록에 있던 그대로입니다. 이미 여행에 있는 장소는 건너뜁니다.',
  'help.guide.import-places-list.tip.1':
    '목록은 공개로 공유되어 있어야 합니다. 비공개 목록의 링크는 아무것도 가져오지 않습니다.',
  'help.guide.import-places-list.tip.2':
    '“Google로 장소 정보 보강”은 내 TREK에 Google 키가 있을 때 대화 상자에 나타납니다. 가져온 장소를 하나씩 찾아 사진, 주소, 세부정보를 채웁니다.',

  // ── Screen: trip-days ─────────────────────────────────────────────────────────────────
  'help.ctx.trip-days.title': '일',
  'help.ctx.trip-days.summary':
    '계획의 왼쪽 열입니다. 하루에 카드 하나씩, 그날의 방문지가 순서대로, 메모, 그날의 예약과 교통편, 그리고 방문지 사이의 경로가 들어 있습니다. 여행이 실제로 계획되는 곳입니다.',
  'help.ctx.trip-days.bullet.1':
    '맨 위의 도구 모음: “내보내기”(PDF, 캘린더, GPX), “모든 날 펼치기” / “모든 날 접기”, 실행 취소 화살표, “날짜 순서 변경”, “모든 예약 경로 표시”.',
  'help.ctx.trip-days.bullet.2':
    '날짜 카드: 머리글에 날짜 번호, 날씨, 제목, 날짜, 그날의 비용이 있습니다. 머리글을 클릭하면 그날이 열리고, 꺾쇠가 카드를 접습니다. “대중교통”, “교통 추가”, “메모 추가”도 머리글에 있습니다.',
  'help.ctx.trip-days.bullet.3':
    '날짜 안에는 순서대로 놓인 방문지가 있고, 각각 사진, 이름, 시간, 사진 위의 잠금이 있습니다. 그 밖에 메모, 그날에 속한 예약, 그리고 방문지 사이에는 각 구간의 이동 시간이 있습니다.',
  'help.ctx.trip-days.bullet.4':
    '방문지 아래는 경로 막대입니다. “경로”는 그날을 지도에 그리고, “최적화”는 방문지를 정렬하며, “자동차” / “도보”는 그날의 이동 수단을 정하고, “Google Maps에서 열기”와 “CoMaps에서 열기”는 그날을 넘겨줍니다.',
  'help.ctx.trip-days.bullet.5':
    '장소는 장소 열에서 행을 끌어다 놓거나, 그 행의 +로, 빈 날짜의 “이 날짜에 장소 추가”로, 또는 장소 세부정보에서 날짜에 올라옵니다.',
  'help.ctx.trip-days.bullet.6': '맨 아래의 “총 비용”은 가격이 있는 모든 방문지와 예약을 여행의 통화로 더합니다.',
  // read-day-plan
  'help.guide.read-day-plan.title': '하루 읽기',
  'help.guide.read-day-plan.goal': '무엇을 바꾸기 전에 날짜 카드의 각 부분이 무엇을 말하는지 압니다.',
  'help.guide.read-day-plan.step.1':
    '머리글: 날짜 번호, 그날의 예보, “1일차” 또는 직접 붙인 제목, 날짜, 그날의 비용입니다. 머리글을 클릭하면 그날이 열리고(“일별 상세” 패널이 지도 위에 열립니다), 오른쪽의 꺾쇠가 카드를 접고 폅니다.',
  'help.guide.read-day-plan.step.2':
    '방문지: 왼쪽의 손잡이로 끌고, 사진에는 경로 최적화를 위한 잠금이 있으며, 이어서 이름, 설명, 그리고 적어 두었다면 “이 날의 메모”가 나옵니다. 시간이 있는 방문지에는 “시작”과 “종료”를 보여 주는 시간 배지가 붙고, 오른쪽 끝에 나타나는 화살표가 그것을 위나 아래로 옮깁니다.',
  'help.guide.read-day-plan.step.3':
    '그날의 예약: 방문지에 묶인 예약은 그 방문지를 “예약 확정” 또는 “예약 대기 중”으로 표시하고, 교통편은 “출발” 또는 “도착”으로 시간과 경로와 함께 나오며, 작은 토글이 그 경로를 지도에 그려 줍니다.',
  'help.guide.read-day-plan.step.4':
    '두 방문지 사이의 연결선은 그날의 이동 수단으로 그 구간이 얼마나 걸리고 얼마나 먼지 알려 줍니다. 클릭하면 그 한 구간의 수단을 바꿀 수 있습니다.',
  'help.guide.read-day-plan.step.5':
    '끝의 경로 막대: “경로”는 그날의 길을 지도에 그리고, “최적화”는 방문지의 순서를 바꾸며, 수단 버튼은 “자동차”나 “도보”를 고르고, “Google Maps에서 열기”와 “CoMaps에서 열기”는 그날을 그 앱에서 엽니다.',
  'help.guide.read-day-plan.result': '카드의 모든 기호에는 뜻이 있습니다. 아래의 안내가 그 하나하나를 바꿉니다.',
  'help.guide.read-day-plan.tip.1':
    '방문지를 오른쪽 클릭하면 메뉴가 나옵니다. “편집”, “날에서 제거”, “웹사이트 열기”, 내비게이션 앱(Google Maps, Waze, Apple Maps, OpenStreetMap, CoMaps), “컬렉션에 저장”, “삭제”입니다.',
  'help.guide.read-day-plan.tip.2':
    '방문지에 마우스를 올리면 끝에 “예약 추가”가 나타납니다. 거기서 만든 예약은 이날의 이 방문지에 묶입니다.',
  // place-onto-day
  'help.guide.place-onto-day.title': '장소를 날짜에 올리기',
  'help.guide.place-onto-day.goal': '목록의 장소를 순서 안의 제자리에 놓인 그날의 방문지로 만듭니다.',
  'help.guide.place-onto-day.step.1':
    '장소 열에서 행을 날짜 카드로 끌어다 놓습니다. 두 방문지 사이에 놓으면 정확히 그 자리에 들어가고, 카드의 아무 곳에나 놓으면 뒤에 붙습니다.',
  'help.guide.place-onto-day.step.2':
    '끌지 않으려면 머리글을 클릭해 날짜를 연 다음, 장소 행 끝의 +를 클릭하거나 행을 오른쪽 클릭해 “+ 날에 추가”를 고릅니다.',
  'help.guide.place-onto-day.step.3':
    '빈 날짜에서는 “이 날짜에 장소 추가”가 장소 양식을 열고, 새 장소는 곧바로 그날에 놓입니다.',
  'help.guide.place-onto-day.step.4':
    '장소 세부정보에서는 “날에 추가”가 어느 날인지 묻습니다. 날짜가 열려 있으면 장소 열의 “해당 날짜로”가 열린 날짜에 새 장소를 만듭니다.',
  'help.guide.place-onto-day.result':
    '장소는 그날의 방문지가 되고, 지도에는 그날의 번호와 함께 나오며, 장소 열은 그것을 “계획됨”으로 셉니다.',
  'help.guide.place-onto-day.tip.1':
    '한 장소를 여러 날에 둘 수 있습니다. 둘째 날에는 장소 열에서 다시 놓으세요. 방문지를 한 날짜 카드에서 다른 카드로 끌면 그 대신 옮겨집니다.',
  'help.guide.place-onto-day.tip.2': '도구 모음의 실행 취소 화살표가 이 배정을 되돌립니다.',
  'help.guide.place-onto-day.tip.3':
    '시간이 고정된 두 항목 사이나, 이미 시간이 정해진 예약 앞에는 방문지를 놓을 수 없습니다. 계획은 시간 순서를 지킵니다.',
  // reorder-stops
  'help.guide.reorder-stops.title': '하루의 순서 바꾸기',
  'help.guide.reorder-stops.goal': '방문지를 위나 아래로, 또는 다른 날짜로 옮깁니다.',
  'help.guide.reorder-stops.step.1': '방문지를 손잡이로 잡아 카드 안의 새 자리로 끕니다.',
  'help.guide.reorder-stops.step.2':
    '또는 방문지 오른쪽 끝의 화살표를 씁니다. 클릭할 때마다 한 칸씩 위나 아래로 갑니다.',
  'help.guide.reorder-stops.step.3': '방문지를 다른 날짜 카드로 끌면 그쪽으로 옮겨지고 이전 날짜에서는 빠집니다.',
  'help.guide.reorder-stops.step.4':
    '시간이 고정된 방문지는 옮기면 그날의 순서가 깨질 때 “시간을 제거할까요?”라고 묻습니다. 그 자리를 정한 것이 시간이기 때문입니다. “확인”을 누르면 시간을 버리고 어디로든 갈 수 있게 됩니다.',
  'help.guide.reorder-stops.result': '경로와 이동 시간이 곧바로 새 순서를 따릅니다.',
  'help.guide.reorder-stops.tip.1':
    '고정된 시간이 있는 예약은 순서를 바꿀 수 없습니다. 그 시간이 정하는 자리에 머뭅니다.',
  'help.guide.reorder-stops.tip.2':
    '경로 막대의 “최적화”는 하루 전체를 가장 짧은 길로 정렬합니다. 그대로 두고 싶은 방문지는 먼저 잠그세요.',
  // set-stop-times
  'help.guide.set-stop-times.title': '방문지에 시간 주기',
  'help.guide.set-stop-times.goal': '방문지가 언제 시작하고 끝나는지 정해, 하루가 일정표처럼 읽히게 합니다.',
  'help.guide.set-stop-times.step.1':
    '방문지를 오른쪽 클릭해 “편집”을 고릅니다. 날짜에서 연 양식에는 아래에 “시작”과 “종료”가 있습니다.',
  'help.guide.set-stop-times.step.2':
    '“시작”을, 원하면 “종료”도 입력합니다. “시간 겹침:”은 그날의 다른 시간 있는 방문지와 겹친다고 알려 줍니다. “시작”보다 앞선 “종료”는 “업데이트”를 막습니다.',
  'help.guide.set-stop-times.step.3':
    '“업데이트”를 클릭합니다. 방문지에 시간 배지가 붙고, 그날에서 그 시간에 맞는 자리로 옮겨집니다.',
  'help.guide.set-stop-times.result':
    '시간이 있는 방문지는 순서 안의 자리를 지키고, 시간이 없는 방문지는 그 둘레에 정렬됩니다.',
  'help.guide.set-stop-times.tip.1':
    '시간은 그날의 그 방문지에 속합니다. 같은 장소라도 다른 날에는 다른 시간을 가질 수 있습니다.',
  'help.guide.set-stop-times.tip.2':
    '시간이 있는 방문지를 손으로 옮기려면 끌어 놓으세요. “확인”을 누르면 “시간을 제거할까요?”라는 물음이 그 과정에서 시간을 버립니다.',
  'help.guide.set-stop-times.tip.3':
    '같은 양식의 “이 날의 메모”에는 이날에만 해당하는 것, 예약한 자리, 표 번호 같은 것을 적습니다.',
  // remove-from-day
  'help.guide.remove-from-day.title': '방문지를 날짜에서 빼기',
  'help.guide.remove-from-day.goal': '여행에서 지우지 않고 장소의 계획만 해제합니다.',
  'help.guide.remove-from-day.step.1': '방문지를 오른쪽 클릭해 “날에서 제거”를 고릅니다.',
  'help.guide.remove-from-day.step.2':
    '방문지는 그날에서 사라집니다. 장소는 장소 열에 남고, 다른 날에도 없으면 “미계획” 아래로 갑니다.',
  'help.guide.remove-from-day.result': '그날과 경로와 비용이 갱신됩니다. 실행 취소 화살표가 방문지를 되돌립니다.',
  'help.guide.remove-from-day.tip.1': '같은 메뉴의 “삭제”는 모든 날짜를 포함해 여행 전체에서 그 장소를 지웁니다.',
  'help.guide.remove-from-day.tip.2': '“날에서 제거”는 장소 세부정보 패널에도 “날에 추가” 옆에 있습니다.',
  // lock-stop
  'help.guide.lock-stop.title': '방문지를 제자리에 잠그기',
  'help.guide.lock-stop.goal': '경로를 최적화해도 방문지를 그 자리에 둡니다.',
  'help.guide.lock-stop.step.1': '방문지의 사진에 마우스를 올리고 잠금을 클릭합니다. “경로 최적화 중 위치 유지”입니다.',
  'help.guide.lock-stop.step.2':
    '이제 “최적화”는 다른 방문지를 그 둘레에 정렬합니다. 잠금을 다시 클릭하면(“클릭하여 잠금 해제”) 풀립니다.',
  'help.guide.lock-stop.result': '잠금이 사진 위에 보입니다. 풀기 전까지 방문지는 자리를 지킵니다.',
  'help.guide.lock-stop.tip.1': '시간이 고정된 방문지는 그 시간으로 잠겨 있어, 최적화 중에도 절대 움직이지 않습니다.',
  'help.guide.lock-stop.tip.2':
    '잠금은 이번 방문 동안만 갑니다. 새로 고치고 나면 모든 방문지가 다시 자유로워지고, 시간이 있는 방문지만 고정된 채로 남습니다.',
  // day-note
  'help.guide.day-note.title': '날짜에 메모 추가하기',
  'help.guide.day-note.goal': '알림, 표 번호, 대안을 그날 안에 둡니다.',
  'help.guide.day-note.step.1': '날짜 머리글에서 “메모 추가”를 클릭합니다.',
  'help.guide.day-note.step.2':
    '“메모”에 이름을 적으세요. 날짜 카드에 보이는 것이 그것입니다. 나머지는 “일별 메모”에 씁니다. 그 위의 “서식” 도구 모음이 글의 모양을 잡고(“굵게”, “글머리 기호 목록”, “번호 매기기 목록”, “링크”, “인용”), 왼쪽의 “미리 보기”가 어떤 카드가 되는지 보여 줍니다.',
  'help.guide.day-note.step.3': '“아이콘”과 “색상”을 골라 메모가 방문지 사이에서 눈에 띄게 한 다음 “추가”합니다.',
  'help.guide.day-note.step.4':
    '메모는 방문지처럼 그날 안에 놓입니다. 끌어서 자리를 잡고, 오른쪽 클릭하면 “편집”과 “삭제”가 나옵니다.',
  'help.guide.day-note.result':
    '메모는 그날의 일부이고 PDF에도 들어갑니다. 시간이 있는 메모는 시간이 있는 방문지와 함께 정렬됩니다.',
  'help.guide.day-note.tip.1':
    '시간이 있는 메모는 예약이 없는 이동을 대신할 수 있습니다. 예를 들어 “08:15 중앙역에서 S3”입니다.',
  'help.guide.day-note.tip.2': '메모는 날짜별입니다. 여행 전체를 위한 메모는 Collab에 속합니다.',
  // day-route
  'help.guide.day-route.title': '그날의 경로 보기와 최적화',
  'help.guide.day-route.goal': '방문지 사이의 길을 보고, 어떻게 이동할지 고르고, 순서는 TREK에 맡깁니다.',
  'help.guide.day-route.step.1':
    '날짜를 열고 경로 막대의 “경로”를 클릭합니다. 방문지 사이의 길이 지도에 그려지고, 방문지 사이의 연결선이 각 구간의 시간과 거리를 보여 줍니다.',
  'help.guide.day-route.step.2':
    '그 옆의 “자동차”와 “도보”가 그날의 이동 수단을 정하고, 구간이 다시 계산됩니다. 플러그인이 자체 수단을 더할 수도 있습니다.',
  'help.guide.day-route.step.3':
    '연결선을 클릭하면 그 한 구간의 수단을 바꿉니다. 수단을 고르거나, “하루 기본값 사용”으로 그날의 수단으로 되돌립니다.',
  'help.guide.day-route.step.4':
    '“최적화”는 방문지를 가장 짧은 길로 다시 정렬합니다. 잠금이 있거나 시간이 고정된 방문지는 자리를 지킵니다. 그날에 숙박이 있으면 경로는 거기서 시작합니다.',
  'help.guide.day-route.step.5':
    '“Google Maps에서 열기”나 “CoMaps에서 열기”는 하루 전체를 하나의 경로로 그 앱에서 엽니다. 길에서 길찾기에 쓰라고 있는 것입니다.',
  'help.guide.day-route.result': '하루가 시간이 있는 경로가 됩니다. 순서가 바뀌면 “총 비용”과 구간이 갱신됩니다.',
  'help.guide.day-route.tip.1':
    '경로는 기본적으로 OSRM에서 옵니다. 관리자는 “기본값”에서 TREK을 다른 경로 엔진으로 돌릴 수 있습니다.',
  'help.guide.day-route.tip.2':
    '경로를 낼 수 없었던 구간에는 시간이 나오지 않습니다. 두 방문지 모두 좌표가 있는지 확인하세요.',
  'help.guide.day-route.tip.3': '실행 취소 화살표가 최적화를 되돌립니다.',
  // manage-days
  'help.guide.manage-days.title': '날짜 추가, 순서 변경, 이름 바꾸기',
  'help.guide.manage-days.goal': '날짜에 담긴 것뿐 아니라 날짜 자체를 만듭니다.',
  'help.guide.manage-days.step.1':
    '날짜는 여행의 기간에서 나옵니다. “대시보드”의 여행 카드에서 날짜를 바꾸면 양 끝에서 날이 더해지거나 빠집니다. 내용이 있는 날이 빠지기 전에, 어떤 날이 빠지고 그날에 무엇이 있는지 목록으로 알려 줍니다.',
  'help.guide.manage-days.step.2':
    '도구 모음의 “날짜 순서 변경”은 목록을 엽니다. “위로 이동”과 “아래로 이동”은 그날에 담긴 것까지 함께 옮기고, 옆의 휴지통 “날짜 삭제”는 그날을 없앱니다. 목록 아래에서는 다음 날짜가 적힌 버튼이 날짜가 있는 마지막 날 바로 뒤에 하루를 넣어 여행을 하루 늘리고, “날짜 없이”는 날짜 없는 날을 끝에 붙입니다.',
  'help.guide.manage-days.step.3':
    '“날짜 삭제”는 먼저 확인합니다. 목록에는 그날과 함께 사라지는 것(장소, 메모, 예약), 그날 체크인이나 체크아웃하는 숙소, 하루씩 앞당겨지는 날들이 나옵니다. “날짜 삭제”는 그날을 없애고 “취소”는 그대로 둡니다. 마지막 하루는 삭제할 수 없습니다.',
  'help.guide.manage-days.step.4':
    '날짜의 이름을 바꾸려면 그날을 열고 지도 위 “일별 상세” 패널에서 제목 옆의 연필을 클릭합니다. 그 이름이 카드와 PDF에서 “1일차”를 대신합니다.',
  'help.guide.manage-days.step.5':
    '도구 모음의 “모든 날 펼치기”와 “모든 날 접기”는 모든 카드를 한 번에 펴고 접습니다. 카드 하나는 꺾쇠로 접습니다.',
  'help.guide.manage-days.result':
    '날짜는 자리를 따라갑니다. 위로 옮긴 날은 앞선 날짜를 받고, 그 방문지와 메모와 예약이 함께 따라갑니다.',
  'help.guide.manage-days.tip.1': '날 이동은 도구 모음에서 되돌릴 수 있지만, 날 삭제는 되돌릴 수 없습니다.',
  'help.guide.manage-days.tip.2': '날짜 머리글의 비용은 그날의 방문지와 예약 가운데 가격이 있는 것을 더합니다.',
  // bookings-in-plan
  'help.guide.bookings-in-plan.title': '계획 속의 예약과 교통편 읽기',
  'help.guide.bookings-in-plan.goal': '예약이 생기면 어디에 나타나는지, 어느 화면이 그것을 만드는지 압니다.',
  'help.guide.bookings-in-plan.step.1':
    '교통편(항공, 기차, 페리, 버스, 차량)은 출발하는 날에 “출발”로, 도착하는 날에 “도착”으로 시간과 경로와 함께 나옵니다. 여러 날에 걸친 것은 그 사이의 날들을 가로지릅니다.',
  'help.guide.bookings-in-plan.step.2':
    '방문지에 묶인 예약(레스토랑, 투어)은 그 방문지를 “예약 확정” 또는 “예약 대기 중”으로 표시합니다. 날짜는 있지만 방문지가 없는 예약은 그날의 독립된 행이 됩니다.',
  'help.guide.bookings-in-plan.step.3':
    '호텔에서 보내는 밤은 숙박입니다. 그날의 “일별 상세” 패널에서 “숙박” 아래, “체크인”부터 “체크아웃”까지 놓이고, 그 날들 각각의 경로가 거기서 시작합니다.',
  'help.guide.bookings-in-plan.step.4':
    '지도에서는 교통편 행의 토글이 그 경로를 그립니다. 도구 모음의 “모든 예약 경로 표시”는 모두를 그립니다.',
  'help.guide.bookings-in-plan.step.5':
    '만드는 곳: 마우스를 올린 방문지의 “예약 추가”, 날짜 머리글의 “교통 추가”와 “대중교통”, 그리고 가져오기와 파일을 갖춘 전체 목록인 “예약”과 “교통” 탭입니다.',
  'help.guide.bookings-in-plan.result':
    '예약 하나는 계획 안의 한 자리에 있습니다. 탭은 같은 예약을 목록으로 보여 줍니다.',
  'help.guide.bookings-in-plan.tip.1':
    '“확정됨”과 “대기 중”은 예약에 직접 정하는 상태입니다. 계획은 그것을 방문지 위에 보여 주고, “예약” 탭은 둘 다 셉니다.',
  'help.guide.bookings-in-plan.tip.2': '시간이 고정된 교통편은 끌 수 없습니다. 대신 예약에서 시간을 바꾸세요.',
  // export-plan
  'help.guide.export-plan.title': '계획 내보내기',
  'help.guide.export-plan.goal': '계획을 문서로, 캘린더로, 또는 GPS로 가져갑니다.',
  'help.guide.export-plan.step.1': '날짜 위 도구 모음에서 “내보내기”를 클릭합니다.',
  'help.guide.export-plan.step.2':
    '“문서”: “PDF”는 모든 날을 방문지, 메모, 예약과 함께 인쇄 화면으로 엽니다. “날짜별 페이지 나누기”는 각 날을 새 쪽에서 시작하고, “PDF로 저장”이 그것을 내려받습니다.',
  'help.guide.export-plan.step.3':
    '“캘린더”: “.ics 다운로드”는 예약을 캘린더 파일로 저장합니다. “캘린더 구독”은 캘린더 앱이 스스로 새로 고치는 링크를 줍니다.',
  'help.guide.export-plan.step.4':
    '“지도 및 GPS · GPX”: “여행 전체”는 장소와 날짜별 경로와 트랙을 내보내고, “장소만”은 핀만, “날짜를 경로로”는 하루에 경로 하나를 내보냅니다. 오프라인 지도와 GPS 기기를 위한 것입니다.',
  'help.guide.export-plan.result': '파일이 내려받아집니다. 여행에서는 아무것도 바뀌지 않습니다.',
  'help.guide.export-plan.tip.1':
    '하루만 지도 앱으로 보내려면 그 경로 막대를 씁니다. “Google Maps에서 열기” 또는 “CoMaps에서 열기”입니다.',
  'help.guide.export-plan.tip.2':
    '“캘린더 구독”은 설정에서 캘린더 구독이 켜져 있어야 합니다. “대시보드”에 그 안내가 있습니다.',
  'help.guide.export-plan.tip.3': '내보내기는 읽기입니다. 여행의 모든 구성원이 할 수 있습니다.',

  // ── Screen: trip-place ────────────────────────────────────────────────────────────────
  'help.ctx.trip-place.title': '장소 세부정보',
  'help.ctx.trip-place.summary':
    '장소를 고르면 지도 위에 열리는 카드입니다. 여행이 그 장소에 대해 아는 모든 것, 모두가 준 별, 사진과 파일, 그리고 그 장소를 열린 날짜에 놓거나 목록에 넣거나 지도 앱으로 여는 버튼이 여기에 있습니다.',
  'help.ctx.trip-place.bullet.1':
    '장소 열의 행, 날짜 안의 정차지, 또는 지도의 마커를 클릭하면 카드가 지도 위에 열립니다. 날짜 안에서 고르면 어느 정차지를 뜻하는지 카드에 알려 주고, 그래야 그 정차지의 참가자와 예약이 함께 따라옵니다.',
  'help.ctx.trip-place.bullet.2':
    '머리 부분에는 둥근 사진, 이름, 카테고리, 주소, 좌표가 있습니다. 사진을 클릭하면 직접 고른 사진을 쓸 수 있고, 이름을 더블클릭하면 그 자리에서 장소 이름을 바꿀 수 있으며, 오른쪽의 X는 카드를 닫습니다.',
  'help.ctx.trip-place.bullet.3':
    '그 아래에는 값이 있으면 그 값, 여행자마다 장소에 준 별, 설명과 메모, 그리고 정차지가 가지고 있으면 “이 날의 메모”가 있습니다.',
  'help.ctx.trip-place.bullet.4':
    '이어서 “영업 시간”, “트랙 색상”, “트랙 통계”, “파일”이 해당되는 만큼 나옵니다. “파일”은 폴더에서 무엇이든 받고, 이 정차지의 예약에 달린 것도 함께 보여 줍니다.',
  'help.ctx.trip-place.bullet.5':
    '맨 아래 행에는 날짜가 열려 있는 동안 “날에 추가” 또는 “날에서 제거”가 있고, 그다음에 “컬렉션에 저장”, “내비게이션”, “웹사이트 열기”, “편집”, “삭제”가 있습니다.',
  'help.ctx.trip-place.bullet.6':
    '검색에서 고른 장소는 TREK 색인이나 OpenStreetMap이 아는 것을 함께 가져옵니다. 사진을 두른 초록 “영업 중” 또는 빨간 “영업 종료” 고리는 그 장소의 시계로 판단되고, 별 아래에 전화번호, 더 아래에 “영업 시간”이 있어 행에는 그날의 시간이, 클릭하면 한 주 전체가 나오며, 웹사이트는 “웹사이트 열기” 뒤에 있습니다. Google 평점은 Google 키가 있는 TREK에서 Google로 찾은 장소에만 보입니다.',
  // read-place
  'help.guide.read-place.title': '카드가 장소에 대해 알려 주는 것',
  'help.guide.read-place.goal': '여행이 한 장소에 대해 아는 모든 것을 카드 하나에서 읽습니다.',
  'help.guide.read-place.step.1':
    '일자 열에서 읽고 싶은 정차지를 클릭합니다. 카드가 지도 위에 열리고, 그 정차지는 자기 날짜 안에서 계속 표시된 채로 있습니다.',
  'help.guide.read-place.step.2':
    '머리 부분은 둥근 사진, 이름, 주소, 정확한 좌표입니다. 사진을 두른 “영업 중”의 초록 고리나 “영업 종료”의 빨간 고리는 TREK이 그 장소의 영업 시간을 알게 되면 그 장소의 시계로 지금 열려 있는지 알려 줍니다. 오른쪽의 X가 카드를 다시 닫습니다.',
  'help.guide.read-place.step.3':
    '그 아래에는 여행자마다 장소에 준 별이 평균과 투표한 사람 수와 함께 있습니다. 아무도 주지 않았으면 “아직 평점 없음”입니다. 바로 그 아래에는 장소에 전화번호가 있으면 전화번호가 있습니다. 클릭하면 번호가 전화 앱으로 넘어갑니다.',
  'help.guide.read-place.step.4':
    '그다음이 설명이고, 그 아래가 메모입니다. 둘 다 장소 양식에 쓴 글을 그려 낸 것이라 목록도 링크도 굵은 글씨도 모두 작동합니다.',
  'help.guide.read-place.step.5':
    '“참가자”는 이 정차지에 누가 가는지 말해 줍니다. 누군가를 빼기 전까지는 모두가 들어 있습니다.',
  'help.guide.read-place.step.6':
    '더 아래의 “영업 시간”: 행에는 지금 보고 있는 날의 시간이 있고, 클릭하면 그날을 굵게 표시한 채 한 주 전체가 펼쳐집니다. 그 옆에 “파일”이 있습니다.',
  'help.guide.read-place.result':
    '카드는 X로 닫거나 다른 장소를 고를 때까지 열린 채로 있고, 한 주의 영업 시간은 펼쳐진 채로 있으며, 그 카드가 속한 정차지는 일자 열에서 계속 표시된 채로 있습니다.',
  'help.guide.read-place.tip.1':
    '장소 열에서 고르면 카드는 장소는 알아도 정차지는 모르므로 참가자도 예약도 보여 주지 않습니다. 대신 날짜 안의 정차지를 고르면 둘 다 나옵니다.',
  'help.guide.read-place.tip.2':
    '이름을 더블클릭하면 양식을 열지 않고 장소 이름을 바꿀 수 있습니다. Enter가 저장하고, Escape는 변경을 버립니다.',
  'help.guide.read-place.tip.3':
    '손으로 입력한 장소는 그중 아무것도 보여 주지 않습니다. 카드는 양식에 담긴 것만 압니다. “편집”으로 열고, “장소 검색...” 아래의 제안에서 그 장소를 고른 뒤 “업데이트”를 클릭하면 영업 시간, 전화번호, 웹사이트가 함께 들어옵니다. Google 평점에는 Google 키가 필요합니다.',
  // rate-place
  'help.guide.rate-place.title': '장소에 평점 주기',
  'help.guide.rate-place.goal': '장소에 내 별을 주고, 다른 사람들이 준 별을 봅니다.',
  'help.guide.rate-place.step.1':
    '장소를 엽니다. 별 행은 머리 바로 아래에 있고, 지금까지의 투표 평균과 그 수를 괄호 안에 담고 있습니다.',
  'help.guide.rate-place.step.2':
    '주려는 별을 클릭합니다. 별 위를 지나가는 대로 별이 채워지므로, 무엇을 주려는지 보입니다.',
  'help.guide.rate-place.step.3':
    '내 표는 곧바로 평균에 들어가고, 그 옆의 얼굴들이 투표한 사람들입니다. 행에 마우스를 올리면 모두의 별이 보입니다.',
  'help.guide.rate-place.step.4': '같은 평균이 장소 열의 그 행에도 있어서, 좋은 장소가 목록에서 눈에 띕니다.',
  'help.guide.rate-place.result':
    '내 별은 여행 전체가 볼 수 있게 장소에 붙고, 목록 위 필터 행의 별은 이제 하한에 이르는 장소만 남길 수 있습니다.',
  'help.guide.rate-place.tip.1':
    '여행자는 누구나 평점을 줄 수 있습니다. 일부만 “장소 추가/편집/삭제”를 할 수 있는 여행에서도 그렇습니다.',
  'help.guide.rate-place.tip.2':
    '이미 준 별을 클릭하면 표를 거둘 수 있습니다. 투표한 사람이 아무도 남지 않으면 장소는 다시 “아직 평점 없음”이 됩니다.',
  'help.guide.rate-place.tip.3':
    '별 옆에 얼굴로 들어가는 투표자는 최대 여섯 명입니다. 툴팁은 모두의 이름을 대고, 내 표에는 표시를 합니다.',
  // place-image
  'help.guide.place-image.title': '장소에 내 사진 올리기',
  'help.guide.place-image.goal': '자동 썸네일을 내 사진으로 바꿉니다.',
  'help.guide.place-image.step.1': '장소 열에서 장소를 엽니다.',
  'help.guide.place-image.step.2':
    '머리의 둥근 사진에 마우스를 올립니다. 카메라가 나타나고 툴팁에 “이미지 업로드”가 뜹니다. 클릭해서 파일을 고릅니다.',
  'help.guide.place-image.step.3': '이제 머리에 내 사진이 보이고, 그 모서리에 작은 빨간 X가 있습니다.',
  'help.guide.place-image.step.4': '같은 사진이 장소 열의 그 행에도, 지도의 마커에도 있습니다.',
  'help.guide.place-image.result':
    '내 사진이 어디서나 그 장소의 사진이 됩니다. 카드, 장소 열, 날짜 안의 정차지, 지도의 마커, 그리고 공유한 여행에서도 그렇습니다.',
  'help.guide.place-image.tip.1': 'JPG, PNG, GIF, WebP를 받고, iPhone의 HEIC는 들어오는 길에 변환됩니다.',
  'help.guide.place-image.tip.2':
    '모서리의 X가 내 사진을 다시 지우면 자동 사진이 돌아옵니다. 장소 자체는 그대로입니다.',
  'help.guide.place-image.tip.3':
    '내 사진이 없으면 TREK이 장소의 좌표로 사진을 찾아보고, 없으면 카테고리의 아이콘으로 돌아갑니다.',
  // place-day-assign
  'help.guide.place-day-assign.title': '열린 날짜에 장소를 놓거나 빼기',
  'help.guide.place-day-assign.goal': '행을 플래너 너머로 끌지 말고 카드 자체의 버튼을 씁니다.',
  'help.guide.place-day-assign.step.1':
    '일자 열에서 날짜의 머리글을 클릭합니다. 이제 그 날짜가 열린 날짜이고, 카드는 그 날짜를 상대로 움직입니다.',
  'help.guide.place-day-assign.step.2':
    '장소 열에서 그 날짜에 없는 장소를 클릭합니다. 카드가 열리고 맨 아래 행이 “날에 추가”를 내놓습니다.',
  'help.guide.place-day-assign.step.3':
    '“날에 추가”를 클릭합니다. 정차지가 그 날짜의 끝에 놓이고 버튼은 “날에서 제거”로 바뀝니다.',
  'help.guide.place-day-assign.step.4':
    '정차지가 이제 그 날짜에 있고, 목록의 맨 끝입니다. 위로 끌어 제자리로 옮기세요.',
  'help.guide.place-day-assign.step.5':
    '“날에서 제거”는 그 정차지를 다시 날짜에서 빼고, 카드는 “날에 추가”를 한 번 더 내놓습니다.',
  'help.guide.place-day-assign.result':
    '그 날짜가 정차지를 갖거나 더는 갖지 않게 되고, 어느 쪽이든 장소 자체는 그대로입니다.',
  'help.guide.place-day-assign.tip.1':
    '이 버튼은 날짜가 열려 있는 동안에만 있습니다. 열린 날짜가 없으면 카드에는 장소를 더할 곳이 없습니다.',
  'help.guide.place-day-assign.tip.2':
    '정차지를 날짜에서 빼도 장소는 여행에도 장소 열에도 남습니다. 어디서나 없애는 것은 “삭제”입니다.',
  'help.guide.place-day-assign.tip.3':
    '숙소 예약이 날짜에 놓은 정차지에는 두 버튼 다 없습니다. 그 밤은 그 날짜의 “숙박” 블록에서 더하고 뺍니다.',
  // place-participants
  'help.guide.place-participants.title': '이 정차지에 누가 가는지 정하기',
  'help.guide.place-participants.goal': '여행을 나누지 않고 한 정차지에서만 일행을 나눕니다.',
  'help.guide.place-participants.step.1':
    '날짜 안의 정차지를 클릭합니다. 카드가 열리고 “참가자”가 여행의 모두를 보여 줍니다.',
  'help.guide.place-participants.step.2':
    '여행자의 칩을 클릭하면 그 사람을 이 정차지에서 뺍니다. 마우스를 올리면 이름에 줄이 그어집니다.',
  'help.guide.place-participants.step.3':
    '누군가 빠지는 순간 점선 +가 나타납니다. 클릭하면 정차지에 없는 사람이 보입니다.',
  'help.guide.place-participants.step.4':
    '이름을 클릭하면 다시 넣습니다. 모두가 돌아오면 정차지는 다시 일행 전체의 것이 됩니다.',
  'help.guide.place-participants.result':
    '정차지는 고른 여행자들을 데리고 있고, 나머지 일행은 그 오후를 자기들끼리 보냅니다.',
  'help.guide.place-participants.tip.1':
    '“참가자”는 정차지가 선택되어 있을 때만 나오므로, 장소 열이 아니라 날짜 안에서 장소를 고르세요. 그리고 여행자가 두 명 이상인 여행에서만 나옵니다.',
  'help.guide.place-participants.tip.2':
    '아무도 고르지 않으면 모두가 간다는 뜻이고, 그래서 정차지에 마지막으로 남은 한 사람은 뺄 수 없습니다.',
  'help.guide.place-participants.tip.3': '자기 계정이 없는 “게스트”도 다른 사람과 똑같이 참가자가 될 수 있습니다.',
  // place-booking
  'help.guide.place-booking.title': '정차지에 붙은 예약',
  'help.guide.place-booking.goal': '정차지에 속한 예약을 읽고, 열고, 새 예약을 붙입니다.',
  'help.guide.place-booking.step.1':
    '예약이 속한 정차지를 엽니다. 카드에 “확정됨” 또는 “대기 중”과 예약 이름이 담긴 띠가 보입니다.',
  'help.guide.place-booking.step.2': '그 띠에는 “날짜”, “시간”, “예약 코드”와 예약이 가진 메모가 담깁니다.',
  'help.guide.place-booking.step.3': '띠를 클릭합니다. 그 예약 자체의 양식이 그 위에 열립니다.',
  'help.guide.place-booking.step.4':
    '“날 배정에 연결”이 예약을 정차지에 붙이는 항목이고, 여기서는 이미 이 정차지를 가리키고 있습니다. 양식을 다시 닫습니다.',
  'help.guide.place-booking.step.5':
    '정차지의 새 예약은 일자 열에서 시작합니다. 정차지에 마우스를 올리고 그 끝의 +를 클릭하세요. 양식이 “새 예약”으로 열리고, 이미 그 정차지에 연결되어 있습니다.',
  'help.guide.place-booking.result':
    '예약은 정차지에 달립니다. 카드에도 있고, 날짜에도 있고, 그 파일은 여기 “파일” 아래에도 나옵니다.',
  'help.guide.place-booking.tip.1':
    '띠는 예약이 붙어 있는 정차지에서만 보입니다. 정차지가 없는 예약은 “예약” 탭에 있습니다.',
  'help.guide.place-booking.tip.2':
    '한 정차지를 여러 예약이 나눠 가질 수 있습니다. 점심과, 같은 문에서 출발하는 투어처럼.',
  'help.guide.place-booking.tip.3': '기차, 항공편, 페리는 대신 교통 양식을 엽니다. “교통” 탭이 쓰는 그 양식입니다.',
  // place-files
  'help.guide.place-files.title': '장소의 티켓을 장소와 함께 두기',
  'help.guide.place-files.goal': '장소의 티켓, 바우처, 지도를 나중에 찾게 될 곳에 둡니다.',
  'help.guide.place-files.step.1':
    '장소를 엽니다. “파일”은 카드 맨 아래에 있고, 장소에 파일이 하나도 없는 동안에는 “파일”이라고 적혀 있습니다.',
  'help.guide.place-files.step.2': '그 옆의 “업로드”를 클릭하고 파일을 고릅니다.',
  'help.guide.place-files.step.3': '버튼이 장소가 가진 개수를 세고, 목록은 스스로 열립니다.',
  'help.guide.place-files.step.4': '각 행은 파일의 이름과 크기입니다. 클릭하면 파일이 열립니다.',
  'help.guide.place-files.result': '파일이 장소에 놓이고 카드에서 세어지며, 여행의 “파일” 탭에도 있습니다.',
  'help.guide.place-files.tip.1': '“파일”은 이 정차지의 예약에 달린 것도 보여 주므로, 호텔 확인서가 호텔에 나타납니다.',
  'help.guide.place-files.tip.2': '“업로드”는 여러 파일을 한 번에 받습니다.',
  'help.guide.place-files.tip.3':
    '“파일 업로드” 권한이 없으면 “업로드” 버튼이 없습니다. 이미 장소에 있는 파일은 그대로 있습니다.',
  // place-navigation
  'help.guide.place-navigation.title': '장소를 지도 앱이나 웹사이트에서 열기',
  'help.guide.place-navigation.goal': '실제로 데려다줄 앱에 장소를 넘깁니다.',
  'help.guide.place-navigation.step.1': '장소를 열고 맨 아래 행의 “내비게이션”을 클릭합니다.',
  'help.guide.place-navigation.step.2':
    '목록은 이 장소에 맞는 지도 앱입니다. Google Maps, Waze, Apple Maps, OpenStreetMap, CoMaps.',
  'help.guide.place-navigation.step.3':
    '쓰는 앱을 클릭합니다. TREK은 가능한 곳에서는 좌표 한 쌍이 아니라 장소 자체를 넘기므로, 제대로 된 입구에 닿습니다.',
  'help.guide.place-navigation.step.4':
    '그 옆의 “웹사이트 열기”는 장소 자체의 페이지와 그 시간, 티켓을 새 탭에서 엽니다.',
  'help.guide.place-navigation.result':
    '지도 앱이 장소를 열고, 웹사이트는 따로 탭에서 열리며, 여행에서는 아무것도 바뀌지 않습니다.',
  'help.guide.place-navigation.tip.1':
    'Waze는 곧바로 길안내를 시작합니다. 나머지는 장소를 열어 주므로, 거기서 출발하려면 한 번 더 눌러야 합니다.',
  'help.guide.place-navigation.tip.2':
    '어떤 앱이 나오는지는 장소와 기기에 달려 있습니다. Android에서는 Apple Maps가 빠지고, 高德地图는 중국의 장소에서만 나오며, Waze와 Apple Maps, CoMaps는 장소의 좌표가 필요합니다.',
  'help.guide.place-navigation.tip.3': '해당하는 앱이 하나뿐이면 버튼이 그 앱의 이름을 달고 곧바로 그 앱을 엽니다.',
  // place-to-collection
  'help.guide.place-to-collection.title': '장소를 내 목록 중 하나에 저장하기',
  'help.guide.place-to-collection.goal': '이번 여행에서 찾은 장소를 다음 여행을 위해 남겨 둡니다.',
  'help.guide.place-to-collection.step.1': '장소를 열고 카드 아래의 “컬렉션에 저장”을 클릭합니다.',
  'help.guide.place-to-collection.step.2':
    '“목록에 저장”이 내가 가진 목록과 공유받은 목록을 모두 보여 줍니다. 이미 이 장소가 들어 있는 목록에는 체크 표시가 있습니다.',
  'help.guide.place-to-collection.step.3': '목록을 클릭합니다. 장소가 곧바로 그 안에 들어갑니다.',
  'help.guide.place-to-collection.step.4': '닫으면 카드의 버튼이 “저장됨”이 됩니다.',
  'help.guide.place-to-collection.result': '장소가 사진과 메모와 주소를 달고 내 목록에 들어가, 다음 여행을 기다립니다.',
  'help.guide.place-to-collection.tip.1':
    '이 버튼은 “컬렉션” 애드온이 켜져 있는 동안에만 있고, 그것은 관리자가 “애드온” 아래에서 켭니다.',
  'help.guide.place-to-collection.tip.2':
    '한 장소가 여러 목록에 한꺼번에 들어갈 수 있고, 목록마다 상태가 따로입니다. 한 곳에서는 “아이디어”, 다른 곳에서는 “방문함”처럼.',
  'help.guide.place-to-collection.tip.3':
    '선택 창에서 장소 이름 옆의 “방문함으로 표시”는 그 목록에서 장소에 표시를 해 줍니다. 장소가 내 목록 여러 개에 들어 있으면 그 알약 버튼은 “모든 목록에서 방문함”이 되어 한 번에 모두 처리합니다.',
  // place-track
  'help.guide.place-track.title': '트랙을 읽고 고유한 색 주기',
  'help.guide.place-track.goal': '가져온 걷기가 얼마나 긴지 보고, 그 선을 지도의 다른 선과 구별합니다.',
  'help.guide.place-track.step.1': '장소 열의 트랙 행에는 그 선이 그려지는 색의 짧은 선이 있습니다. 클릭하세요.',
  'help.guide.place-track.step.2': '“트랙 통계”가 설정한 “거리 단위”로 길의 길이를 알려 줍니다.',
  'help.guide.place-track.step.3': '그 위의 “트랙 색상”이 쓰이는 색을 보여 줍니다. 행을 클릭하면 색 견본이 열립니다.',
  'help.guide.place-track.step.4': '색을 고릅니다. 지도의 선과 행의 짧은 선이 함께 바뀝니다.',
  'help.guide.place-track.step.5':
    '왼쪽의 점선 칸 “자동 색상”은 트랙에 물려받은 색을 돌려주고, 오른쪽의 스포이트 “사용자 지정 색상 선택”은 그 밖의 색을 위해 시스템의 색 선택기를 엽니다.',
  'help.guide.place-track.result':
    '트랙이 고른 색으로 그려집니다. 카드에서도, 장소 열의 그 행에서도, 지도에서도 그렇습니다.',
  'help.guide.place-track.tip.1': 'GPX, KML, KMZ 파일에서 가져온 길을 가진 장소만 이 두 블록을 갖습니다.',
  'help.guide.place-track.tip.2':
    '고도와 함께 기록된 트랙은 가장 높은 지점과 낮은 지점, 오르내린 미터, 그리고 걷기의 단면도 보여 줍니다.',
  'help.guide.place-track.tip.3':
    '가져오기는 데려오는 트랙마다 고유한 색을 주므로, 두 걷기가 같은 색으로 도착하는 일은 없습니다.',
  // read-place
  'help.guide.read-place.step.7':
    '맨 아래 행은 여기서 할 수 있는 일입니다. 장소를 열린 날짜에서 빼거나 넣기, 목록에 저장하기, 지도 앱에서 열기, 편집하기, 삭제하기.',

  // ── Screen: trip-files ────────────────────────────────────────────────────────────────
  'help.ctx.trip-files.title': '파일',
  'help.ctx.trip-files.summary':
    '여행의 모든 문서가 한 목록에 있습니다. 티켓, 예약 확인서, 패스, 사진. 각각에 메모와, 그것이 속한 장소나 예약으로 가는 링크가 붙고, 휴지통에서 다시 꺼낼 수도 있습니다.',
  'help.ctx.trip-files.bullet.1':
    '맨 위의 “여기에 파일을 놓으세요”가 파일을 받습니다. 상자를 클릭하면 파일 선택 창이 열립니다. 그 아래 줄에는 이 TREK이 받는 파일 형식과 파일당 50 MB 제한이 적혀 있습니다.',
  'help.ctx.trip-files.bullet.2':
    '탭이 목록에 무엇을 보여 줄지 정합니다. “전체”, “PDF”, “이미지”, “문서”이고 각각에 개수가 붙습니다. 파일에 즐겨찾기를 달면 별 탭이, 메모에 첨부가 붙으면 “Collab 메모”가 함께 생깁니다.',
  'help.ctx.trip-files.bullet.3':
    '행에는 올린 사람, 이름, 그 아래의 메모, 크기와 날짜, 그리고 링크마다 배지 하나가 있습니다. “일별 계획”과 장소, “예약” 또는 “교통”과 그 예약, “Collab 메모에서”입니다.',
  'help.ctx.trip-files.bullet.4':
    '행 끝에는 “즐겨찾기”, “배정”, “열기”, “다운로드”, “삭제”가 있습니다. “삭제”는 묻지 않습니다. 파일은 휴지통으로 가고, 거기서 다시 꺼낼 수 있습니다.',
  'help.ctx.trip-files.bullet.5':
    '사진이나 영상은 전체 화면으로 열리며 화살표 키와 썸네일 띠로 넘깁니다. 그 밖의 문서는 페이지 위의 미리보기로 열리고 “새 탭에서 열기”와 “다운로드”가 함께 나옵니다. 월렛 패스는 곧바로 다운로드됩니다.',
  'help.ctx.trip-files.bullet.6':
    '오른쪽 끝의 “휴지통”은 목록을 삭제된 파일로 바꿉니다. 거기서 하나씩 복원하거나 영구 삭제할 수 있고, “휴지통 비우기”는 전부 지웁니다. 관리자가 문서 저장소를 연결해 둔 곳에서는 그 옆에 “문서 동기화”가 있습니다.',
  // files-upload
  'help.guide.files-upload.title': '문서를 여행에 넣기',
  'help.guide.files-upload.goal':
    '티켓이나 예약 확인서, 사진을 다운로드 폴더에서 여행으로 옮겨, 여행에 있는 모두가 닿을 수 있게 합니다.',
  'help.guide.files-upload.step.1':
    '여행을 열고 탭 바의 “파일”을 클릭합니다. 여행의 문서가 거기 나열되고, 그 위에 업로드 상자가 있습니다.',
  'help.guide.files-upload.step.2':
    '“여기에 파일을 놓으세요”를 클릭하고 파일을 하나 또는 여럿 고릅니다. 파일은 차례로 올라가고, 그동안 상자에는 “업로드 중...”이 나옵니다. 상자 아래 줄은 이 TREK이 받는 형식과, 파일 하나가 최대 50 MB라는 것을 알려 줍니다.',
  'help.guide.files-upload.step.3':
    '마지막 파일이 올라가면 그 파일의 “파일 배정”이 저절로 열립니다. “메모 추가...”는 파일에 한 줄을 붙이고, 그 아래 목록은 파일을 장소나 예약에 묶습니다. ×로 닫으면 되고, 닫아도 잃는 것은 없습니다.',
  'help.guide.files-upload.step.4':
    '새 파일은 목록 맨 위에 섭니다. 행에는 올린 사람, 이름, 크기, 날짜가 나오고, 사진에는 썸네일이, 그 밖의 파일에는 형식이 붙습니다.',
  'help.guide.files-upload.result': '문서가 여행 안에 있고, 여행을 볼 수 있는 모두가 열고 내려받을 수 있습니다.',
  'help.guide.files-upload.tip.1':
    '파일은 바탕화면에서 상자 위로 바로 끌어다 놓을 수도 있습니다. 파일이 위에 있는 동안 상자가 밝아집니다.',
  'help.guide.files-upload.tip.2':
    '클립보드의 사진은 Ctrl+V로 목록에 들어갑니다. 예약 화면을 찍은 것을 먼저 저장할 필요가 없습니다.',
  'help.guide.files-upload.tip.3':
    '업로드에는 “파일 업로드” 권한이 필요합니다. 권한이 없으면 상자 자체가 없습니다. 목록에 없는 형식은 메시지와 함께 거절되고 아무것도 올라가지 않습니다. 50 MB가 넘는 파일은 아무것도 보내지기 전에 상자가 스스로 떨어뜨립니다.',
  // files-link
  'help.guide.files-link.title': '문서를 장소나 예약에 묶기',
  'help.guide.files-link.goal': '티켓을 이 목록에서만이 아니라, 그것이 속한 날에서도 찾을 수 있게 합니다.',
  'help.guide.files-link.step.1': '행 끝의 연필, “배정”을 클릭합니다. 파일 이름을 단 “파일 배정”이 열립니다.',
  'help.guide.files-link.step.2':
    '“메모” 아래의 “메모 추가...”는 한 줄을 받고, 그 줄은 목록에서 파일 이름 아래에 섭니다. 상자를 벗어나는 순간 저장됩니다.',
  'help.guide.files-link.step.3':
    '“장소” 아래에는 여행의 장소가 각자 속한 날끼리 묶여 있고, 어느 날에도 없는 장소는 맨 끝의 “미배정”에 있습니다. 하나를 클릭하면 체크가 붙습니다.',
  'help.guide.files-link.step.4':
    '“예약”과 “교통” 아래에는 여행의 예약이 있습니다. 문서가 속한 것을 클릭하면 거기에도 체크가 붙습니다.',
  'help.guide.files-link.step.5':
    '×로 닫습니다. 여기에는 저장 버튼이 없습니다. 클릭할 때마다 그 자리에서 기록되었습니다.',
  'help.guide.files-link.result':
    '행에는 메모와 링크마다 배지 하나가 붙습니다. “일별 계획”과 장소 이름, “교통”과 항공편 이름입니다. 문서는 그 장소와 그 항공편에도 함께 걸립니다.',
  'help.guide.files-link.tip.1':
    '한 파일이 여러 링크를 동시에 가질 수 있습니다. 같은 예약 확인서가 호텔에도, 그것이 덮는 밤에도 속합니다.',
  'help.guide.files-link.tip.2': '체크된 항목을 다시 클릭하면 그 링크가 사라집니다. 파일 자체는 남습니다.',
  'help.guide.files-link.tip.3':
    '반대 방향도 됩니다. 장소나 예약에 붙인 문서는 이 목록에도 있고, 그 행에 같은 배지가 붙습니다.',
  // files-star
  'help.guide.files-star.title': '중요한 문서를 맨 위에 두기',
  'help.guide.files-star.goal': '여행 내내 불어나는 목록에서 정말 필요한 서류 두세 개를 끄집어냅니다.',
  'help.guide.files-star.step.1':
    '행 끝의 “즐겨찾기”를 클릭합니다. 별이 노랗게 차고, 파일 이름 앞에 별이 하나 더 나타나며, 버튼은 이제 “즐겨찾기 해제”가 됩니다.',
  'help.guide.files-star.step.2':
    '목록이 다시 정렬됩니다. 즐겨찾기한 파일이 나머지 모두의 위에 서고, 각 묶음 안에서는 최신순입니다.',
  'help.guide.files-star.step.3':
    '맨 위 탭에 별이 하나 생겼고, 그 뒤에 즐겨찾기한 파일 수가 있습니다. 클릭하면 그것만 보입니다.',
  'help.guide.files-star.result':
    '창구에서 필요한 서류가 목록 맨 위에 서고, 한 탭에는 그것 말고는 아무것도 나오지 않습니다.',
  'help.guide.files-star.tip.1':
    '별 탭은 무언가에 즐겨찾기가 달려 있는 동안에만 있습니다. 마지막 파일의 즐겨찾기를 풀면 탭도 함께 사라집니다.',
  'help.guide.files-star.tip.2':
    '즐겨찾기는 편집으로 칩니다. “파일 메타데이터 편집” 권한이 없어 여행의 파일을 읽기만 할 수 있는 구성원에게는 별이 보이지만 달 수는 없습니다.',
  // files-filter
  'help.guide.files-filter.title': '목록에서 문서 찾기',
  'help.guide.files-filter.goal': '모든 것이 든 목록을 찾고 있는 한 가지 서류까지 좁힙니다.',
  'help.guide.files-filter.step.1': '목록 위의 탭은 “전체”, “PDF”, “이미지”, “문서”이고, 각각 뒤에 파일 수가 붙습니다.',
  'help.guide.files-filter.step.2': '“PDF”를 클릭하면 목록에는 PDF 파일만 남습니다.',
  'help.guide.files-filter.step.3':
    '탭 두 개가 여행에 무엇이 있느냐에 따라 생겼다 사라집니다. Collab 탭의 메모에 첨부가 붙는 순간 생기는 “Collab 메모”를 클릭하면, 목록에는 그 파일들만 남고 다른 것은 남지 않습니다. 별도 같은 식으로, 파일에 즐겨찾기가 달리는 순간 줄에 끼어듭니다.',
  'help.guide.files-filter.step.4': '“전체”는 목록 전체를 되돌립니다.',
  'help.guide.files-filter.result': '목록에는 탭이 가리키는 것만 나오고, 각 탭의 숫자가 그것이 몇 개인지 알려 줍니다.',
  'help.guide.files-filter.tip.1':
    '여기에는 폴더도 이름 바꾸기도 없습니다. “파일 배정”의 메모, 장소와 예약으로 가는 링크, 그리고 즐겨찾기가 문서를 정리하는 수단입니다.',
  'help.guide.files-filter.tip.2':
    '목록 자체는 언제나 즐겨찾기가 먼저, 그다음이 최신순입니다. 오늘 올린 문서가 지난달 것보다 위에 섭니다.',
  // files-preview
  'help.guide.files-preview.title': 'TREK을 떠나지 않고 문서 읽기',
  'help.guide.files-preview.goal': '티켓이나 사진을 그 자리에서 보고, 필요할 때는 내 기기로 가져옵니다.',
  'help.guide.files-preview.step.1':
    '사진의 이름이나 썸네일을 클릭합니다. 전체 화면으로 열리고, 머리글에 파일 이름과 사진들 사이에서의 위치가 나옵니다.',
  'help.guide.files-preview.step.2':
    '양옆의 둥근 화살표, 왼쪽과 오른쪽 화살표 키, 그리고 아래의 썸네일 띠로 목록이 지금 보여 주는 모든 사진을 넘깁니다.',
  'help.guide.files-preview.step.3':
    '머리글에는 “새 탭에서 열기”와 “다운로드”가 있습니다. ×나 Escape로 사진이 다시 닫힙니다.',
  'help.guide.files-preview.step.4':
    '사진이 아닌 문서는 대신 페이지 위의 미리보기로 열리고, 머리글에 같은 버튼 두 개가 있습니다. 이것은 ×나 옆을 클릭하면 닫힙니다.',
  'help.guide.files-preview.step.5': '행 끝의 “다운로드”는 아무것도 열지 않고 파일을 바로 내 기기에 저장합니다.',
  'help.guide.files-preview.result': '문서가 화면에 있고, 같은 버튼 두 개가 그것을 브라우저 탭이나 디스크에 놓습니다.',
  'help.guide.files-preview.tip.1': '터치 화면에서는 화살표를 클릭하는 대신 사진을 쓸어 넘깁니다.',
  'help.guide.files-preview.tip.2':
    '월렛 패스는 미리보기를 열지 않습니다. 곧바로 내려받아, 휴대폰이 월렛 앱에 넘길 수 있게 합니다.',
  'help.guide.files-preview.tip.3':
    '“새 탭에서 열기”와 “다운로드”는 둘 다 내 세션으로 파일을 가져옵니다. 그래서 주소창에서 복사한 링크는 다른 사람에게는 쓸모가 없습니다.',
  // files-trash
  'help.guide.files-trash.title': '문서를 버리고, 다시 가져오기',
  'help.guide.files-trash.goal': '여행에 더 이상 필요 없는 것을 치우되, 알고 보니 필요했던 것은 잃지 않습니다.',
  'help.guide.files-trash.step.1':
    '행 끝의 “삭제”를 클릭합니다. 파일은 즉시 목록에서 사라지고 “휴지통으로 이동됨”이라는 메시지가 나옵니다. 미리 묻는 것은 없습니다.',
  'help.guide.files-trash.step.2':
    '도구 모음 오른쪽 끝의 “휴지통”은 목록을 버린 것들로 바꿉니다. 제목은 “휴지통”이 되고 필터 탭은 사라집니다.',
  'help.guide.files-trash.step.3':
    '버려진 행은 흐리게 표시되고 버튼이 둘만 남습니다. 파일을 되돌리는 “복원”과, 한 번 물은 뒤 영구히 지우는 “삭제”입니다.',
  'help.guide.files-trash.step.4':
    '“복원”을 클릭합니다. “파일이 복원되었습니다”라는 메시지가 나오고, 행은 메모와 링크를 그대로 단 채 휴지통을 떠납니다.',
  'help.guide.files-trash.step.5':
    '맨 위의 “휴지통 비우기”는 여기 남은 것을 모두 영구히 지우며, 그 전에 브라우저가 한 번 묻습니다. “휴지통”을 누르면 다시 파일 목록으로 돌아갑니다.',
  'help.guide.files-trash.result': '파일은 아무 일도 없었던 것처럼 있던 자리 그대로 목록에 돌아와 있습니다.',
  'help.guide.files-trash.tip.1':
    '행의 “삭제”는 미리 묻지 않고, 휴지통이 바로 그것을 위해 있습니다. 여기에서 직접 그렇게 하기 전에는 아무것도 TREK을 떠나지 않습니다.',
  'help.guide.files-trash.tip.2':
    '파일을 버리고 되돌리는 데에는 “파일 삭제” 권한이 필요합니다. 권한이 없는 구성원에게는 행의 “삭제”도, 휴지통 안의 버튼도 보이지 않습니다.',
  'help.guide.files-trash.tip.3': '휴지통에서 영구 삭제한 파일은 되돌릴 수 없습니다.',
  // files-sync
  'help.guide.files-sync.title': '문서를 내 문서 저장소와 맞춰 두기',
  'help.guide.files-sync.goal':
    '여행을 자신의 문서 저장소에 묶어, 여기서 올린 것이 거기에 놓이고 거기에 정리한 것이 여기에 나타나게 합니다.',
  'help.guide.files-sync.step.1':
    '도구 모음 오른쪽 끝 “휴지통” 옆의 “문서 동기화”를 클릭합니다. 대화 상자가 제목 아래에 여행 이름을 달고 열립니다. 왼쪽 “저장소 연결” 아래에는 관리자가 켜 둔 저장소가 각각 정리 방식을 적은 한 줄과 함께 있습니다. Paperless-ngx와 Papra는 태그로, Nextcloud와 Synology Drive는 폴더에, OpenCloud는 스페이스에 정리합니다. 오른쪽에는 “아직 연결된 저장소가 없습니다”라고 적혀 있습니다.',
  'help.guide.files-sync.step.2':
    '내 저장소를 클릭합니다. 여기서는 Nextcloud입니다. 연결을 위한 더 작은 대화 상자가 저장소 이름으로 열리고, 그 저장소가 로그인에 쓰는 정보를 묻습니다.',
  'help.guide.files-sync.step.3':
    '“주소”와 저장소별 로그인 정보를 채웁니다. Paperless-ngx는 “API 토큰”, Papra는 “API 키”와 “조직 ID”, Nextcloud는 “사용자 이름”과 “앱 비밀번호”, OpenCloud는 “사용자 이름”과 “앱 토큰”, Synology Drive는 “사용자 이름”, “비밀번호”, 그리고 계정이 요구하면 “2단계 인증 코드”입니다. 저장소가 앱 비밀번호나 토큰을 제공한다면 언제나 그것을 쓰고, 계정 비밀번호는 절대 쓰지 마세요. Nextcloud와 Synology Drive는 선택 사항인 “기준 폴더”도 받습니다. TREK이 여행 폴더를 찾는 위치로, 여기서는 /Reisen입니다. 맨 아래의 “자체 서명 인증서 허용”은 그런 인증서를 가진 자체 네트워크의 저장소에만 쓰입니다.',
  'help.guide.files-sync.step.4':
    '“연결 테스트”를 클릭합니다. TREK이 입력한 내용으로 저장소에 닿고, 바닥글에는 계정 이름이 들어간 “연결됐습니다. … 계정으로 로그인했습니다”가 적힙니다. 거부된 인증 정보나 닿을 수 없는 주소는 대신 거기에 적히고, 어느 쪽이든 아무것도 저장되지 않습니다.',
  'help.guide.files-sync.step.5':
    '“연결”을 클릭합니다. 연결은 여행과 함께 저장되고, TREK이 이 여행을 저장소의 어디에 둘지, 곧 문서를 담을 태그, 폴더, 스페이스를 묻습니다. 그 안에 있는 것만 동기화됩니다. “새로 만들기”는 “만들기”에서 그것을 만들고, 이름은 여행 제목에서 미리 채워집니다. “또는 이미 있는 것 사용하기” 아래에는 이미 있는 것들이 있습니다. 하나를 클릭합니다. 여기서는 폴더 Autumn in Japan입니다.',
  'help.guide.files-sync.step.6':
    '대화 상자가 돌아옵니다. 왼쪽 “이 여행” 아래에 내 저장소가 있고, 오른쪽의 그 카드에는 동기화 대상, 마지막으로 실행한 때, “지금 동기화”가 있습니다. 첫 실행은 저절로 시작되고, “지금 동기화”는 원할 때마다 한 번 실행합니다. 실행이 한 번 끝나면 이름 옆의 “아직 동기화하지 않았습니다” 배지는 초록 점으로 바뀌어 마우스를 올리면 “동기화됨”이라고 적히고, 흐름 막대는 TREK과 저장소가 각각 가진 문서를 세며 그 사이에 “저장소로 내보내기”와 “저장소에서 가져오기” 차선이 있습니다. ×로 대화 상자를 닫습니다.',
  'help.guide.files-sync.result':
    '저장소에 이미 있던 문서가 내 이름으로 올린 것으로 목록 맨 위에 있고, 여행의 모든 문서도 저장소에 있습니다. 이제부터 TREK은 뒤에서 저장소를 확인하고, 저장소는 목록을 따릅니다.',
  'help.guide.files-sync.tip.1':
    '여행을 묶을 수 있는 사람은 여행 소유자나 인스턴스 관리자뿐입니다. 인증 정보가 저장소의 그 계정 전체에 닿기 때문입니다. 모든 구성원은 “문서 동기화”를 열고, 카드를 읽고, “지금 동기화”를 누를 수 있습니다.',
  'help.guide.files-sync.tip.2':
    '자체 네트워크의 저장소에는 TREK 서버에 ALLOW_INTERNAL_NETWORK=true가 필요하고, 그 주소는 네트워크에서의 그 기기 주소여야 하며 localhost는 절대 안 됩니다. 그것이 없으면 “연결 테스트”는 “허용되지 않는 주소입니다.”라고 답합니다.',
  'help.guide.files-sync.tip.3':
    '카드의 “연결 해제”는 짝을 끝내고 양쪽의 모든 문서를 남깁니다. 두 번째로 묶은 태그, 폴더, 스페이스는 새것으로 취급되어 그 안의 모든 것이 다시 들어오므로, “연결 해제” 뒤에는 예전 것이 아니라 빈 것을 묶으세요.',

  // ── Screen: trip-day-detail ───────────────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': '일별 상세',
  'help.ctx.trip-day-detail.summary':
    '일자의 헤더가 지도 위에 여는 패널입니다. 하루 전체, 이름과 날짜, 머무는 곳의 날씨, 그날에 걸리는 예약, 그리고 그날에 잡아 둔 숙박이 들어 있습니다.',
  'help.ctx.trip-day-detail.bullet.1':
    '일자 열에서 어느 날의 헤더를 클릭하면 패널이 지도 한가운데 위에 열립니다. 같은 헤더를 다시 누르거나 그 오른쪽의 X를 누르면 닫히고 그 날의 선택도 풀립니다.',
  'help.ctx.trip-day-detail.bullet.2':
    '헤더에는 그 날의 이름과 날짜가 있습니다. 이름 옆의 연필은 날 이름을 바꾸고, 이중 셰브론은 패널을 얇은 막대로 접어 지도를 다시 비웁니다.',
  'help.ctx.trip-day-detail.bullet.3':
    '맨 위는 그 날의 날씨입니다. “… 예보”가 어느 장소를 가리키는지 말해 줍니다. 그 날의 첫 경유지이거나, 아침을 맞는 호텔입니다.',
  'help.ctx.trip-day-detail.bullet.4':
    '“예약”은 그 날의 예약을 종류, 속한 경유지, 시간과 함께 보여 줍니다. 초록은 확정됨, 호박색은 아직 대기 중입니다. 여기서는 읽기만 하고, 예약을 바꾸는 곳은 “예약” 탭입니다.',
  'help.ctx.trip-day-detail.bullet.5':
    '“숙박”은 이 날에 걸린 모든 숙박을 보여 줍니다. “체크인”과 “체크아웃”은 각각 해당하는 날에 붙고, 체크인 가능 시간대와 체크아웃 시간, 확인 번호도 함께 나옵니다.',
  'help.ctx.trip-day-detail.bullet.6':
    '“숙박 추가”는 이 날에 하룻밤을 잡습니다. 여행의 장소에서 숙소를 고르고, 며칠에 걸치는지 정하고, 시간과 번호를 넣습니다.',
  // day-panel
  'help.guide.day-panel.title': '날을 열어 상세를 읽기',
  'help.guide.day-panel.goal': '지도를 떠나지 않고 하루 전체, 날씨, 예약, 그리고 잠자는 곳을 봅니다.',
  'help.guide.day-panel.step.1':
    '일자 열에서 어느 날의 헤더를 클릭합니다. 그 날이 선택되고 상세가 지도 한가운데 위에 열립니다.',
  'help.guide.day-panel.step.2':
    '헤더는 그 날의 이름을 보여 줍니다. 이름을 주기 전까지는 “1일차”이고, 그 아래에 날짜가 있습니다.',
  'help.guide.day-panel.step.3':
    '맨 위는 그 날의 날씨입니다. “… 예보”가 어느 장소를 가리키는지 말해 줍니다. 그 날의 첫 경유지이거나, 아침을 맞는 호텔입니다.',
  'help.guide.day-panel.step.4': '그 아래의 “예약”은 이 날에 걸리는 예약을 시간과 함께 보여 줍니다.',
  'help.guide.day-panel.step.5':
    '“숙박”은 이 날에 걸린 숙박을 보여 주고, “체크인”과 “체크아웃”은 각각 해당하는 날에 붙습니다.',
  'help.guide.day-panel.step.6':
    '헤더의 이중 셰브론은 패널을 얇은 막대로 접습니다. 그 옆의 X는 패널을 닫고 그 날의 선택도 풉니다.',
  'help.guide.day-panel.result':
    '막대로 접힌 패널은 지도를 비워 두고 그 날의 선택은 유지합니다. 닫으면 선택이 풀리고 계획은 원래대로입니다.',
  'help.guide.day-panel.tip.1': '패널의 헤더 막대는 어디를 클릭해도 접힙니다. 셰브론은 그 버튼일 뿐입니다.',
  'help.guide.day-panel.tip.2':
    '장소 열에서 장소를 열면 패널 자리에 장소 세부정보가 들어옵니다. 그것을 닫으면 그 날이 돌아옵니다.',
  // day-weather
  'help.guide.day-weather.title': '그 날의 날씨 읽기',
  'help.guide.day-weather.goal': '그 날에 실제로 있는 곳의 하루가 어떨지 압니다.',
  'help.guide.day-weather.step.1':
    '“… 예보”는 숫자가 어느 장소의 것인지 알려 줍니다. 그 날의 첫 경유지, 경유지가 없는 날에는 아침을 맞는 호텔입니다.',
  'help.guide.day-weather.step.2': '큰 숫자가 그 날의 기온이고, 그 옆에 최저와 최고, 그리고 날씨 상태가 말로 나옵니다.',
  'help.guide.day-weather.step.3': '그 아래 칩들은 강수 확률, 강수량, 가장 센 바람, 그리고 일출과 일몰입니다.',
  'help.guide.day-weather.step.4':
    '맨 아래는 그 날의 시간별, 두 시간마다입니다. 시각, 아이콘, 기온, 강수 확률이 나옵니다. 50%를 넘는 시간은 파랗게 칠해집니다.',
  'help.guide.day-weather.result':
    '일자 열의 그 날 카드에도 번호 아래에 같은 날씨가 작게 실려서, 여행 전체를 한눈에 읽을 수 있습니다.',
  'help.guide.day-weather.tip.1':
    '온도와 바람은 설정의 “화면” 아래 “온도 단위”를 따릅니다. “°F Fahrenheit”를 고르면 같은 예보가 °F와 mph로 읽힙니다.',
  'help.guide.day-weather.tip.2':
    '좌표가 있는 경유지도 없고 아침을 맞을 호텔도 없는 날에는 날씨가 전혀 나오지 않습니다. 예보는 언제나 장소에 대한 것이지 여행에 대한 것이 아닙니다.',
  'help.guide.day-weather.tip.3':
    '16일보다 앞선 날에는 받을 예보가 없습니다. 그때의 숫자는 그 날짜에 대한 지난 해들의 평균이며, Ø 표시가 붙고 그 아래에 그렇게 적힙니다.',
  // rename-day
  'help.guide.rename-day.title': '날에 이름 주기',
  'help.guide.rename-day.goal': '“5일차” 대신 “Kyoto 도착”이나 “휴식일”처럼 그 날을 그대로 부릅니다.',
  'help.guide.rename-day.step.1': '날을 엽니다. 헤더에 “5일차”가 있고 그 아래에 날짜가 있습니다.',
  'help.guide.rename-day.step.2': '이름 옆의 연필을 클릭합니다.',
  'help.guide.rename-day.step.3': '이름이 입력란으로 바뀝니다. 원하는 이름을 입력합니다.',
  'help.guide.rename-day.step.4':
    'Enter를 누르거나 다른 곳을 클릭하기만 해도 됩니다. Escape는 변경을 버립니다. 일자 열의 그 날 카드에도 이름이 실립니다.',
  'help.guide.rename-day.result': '이름이 패널과 일자 열의 그 날 카드에서 “5일차”를 대신합니다. 날짜는 그대로입니다.',
  'help.guide.rename-day.tip.1':
    '입력란을 비우고 저장하면 그 날은 다시 “5일차”가 됩니다. 이름이 없을 때 나오는 것이 번호입니다.',
  'help.guide.rename-day.tip.2':
    '이름은 날짜가 아니라 날에 속합니다. 날들의 순서를 바꾸면 그 날의 다른 모든 것과 함께 따라갑니다.',
  // add-accommodation
  'help.guide.add-accommodation.title': '어느 날에 하룻밤 잡기',
  'help.guide.add-accommodation.goal': '호텔을 한 번만 계획에 넣습니다. 걸치는 날, 시간, 확인 번호까지 함께입니다.',
  'help.guide.add-accommodation.step.1':
    '숙소는 먼저 여행의 장소여야 합니다. 다른 장소와 똑같이 장소 열에서 만드세요. 선택기는 이미 있는 것만 보여 줍니다.',
  'help.guide.add-accommodation.step.2': '도착하는 날을 열고 “숙박” 아래의 “숙박 추가”를 클릭합니다.',
  'help.guide.add-accommodation.step.3':
    '“적용할 날”이 이 숙박이 걸치는 밤을 정합니다. 왼쪽이 체크인 날, 오른쪽이 체크아웃 날입니다. “전체”는 여행 전체를 덮습니다.',
  'help.guide.add-accommodation.step.4':
    '“체크인”, “까지”, “체크아웃”을 채우고 예약 번호를 “확인”에 넣습니다. 넷 다 비워 두어도 됩니다.',
  'help.guide.add-accommodation.step.5': '여행의 장소에서 숙소를 고릅니다. 목록 위의 칩이 한 카테고리로 좁혀 줍니다.',
  'help.guide.add-accommodation.step.6': '“저장”을 클릭합니다.',
  'help.guide.add-accommodation.result':
    '숙박은 걸치는 모든 날에 나옵니다. 첫날에 “체크인”, 마지막 날에 “체크아웃”입니다. 숙소는 체크인 날의 경유지가 되어 지도가 거기까지 가는 길을 그리고, “예약” 탭에 “숙박” 예약이 생깁니다.',
  'help.guide.add-accommodation.tip.1':
    '선택기는 열어 둔 날로 시작하고 체크아웃은 그 다음 날입니다. 저장하기 전에 둘 다 옮길 수 있습니다.',
  'help.guide.add-accommodation.tip.2':
    '호텔을 만들 때 여행의 Hotel 카테고리를 주면, 목록 위의 칩으로 한 번에 호텔만 남길 수 있습니다.',
  'help.guide.add-accommodation.tip.3':
    '시간은 모두 선택 사항입니다. 체크인도 번호도 없는 숙박이라도 밤은 그대로 덮고 경로도 그대로 그립니다.',
  // edit-accommodation
  'help.guide.edit-accommodation.title': '잡아 둔 숙박 바꾸기 또는 취소하기',
  'help.guide.edit-accommodation.goal': '숙박을 옮기거나, 시간을 고치거나, 계획에서 다시 빼냅니다.',
  'help.guide.edit-accommodation.step.1':
    '숙박의 모든 날에서 카드는 숙소, 체크인 가능 시간대, 체크아웃 시간, 확인 번호를 보여 줍니다.',
  'help.guide.edit-accommodation.step.2':
    '그 오른쪽의 연필이 숙박을 다시 엽니다. 팝업은 이제 “숙박 편집”이라고 나옵니다.',
  'help.guide.edit-accommodation.step.3':
    '늘어선 항목을 고칩니다. “체크인”, “까지”, “체크아웃”, “확인”입니다. 그 위의 걸치는 날과 그 아래의 숙소도 여기에서 바꿀 수 있습니다.',
  'help.guide.edit-accommodation.step.4': '“저장”을 클릭합니다.',
  'help.guide.edit-accommodation.step.5':
    '연필 옆의 X는 숙박을 끝냅니다. 아무것도 묻지 않고, 거기 딸린 “숙박” 예약도 함께 사라집니다.',
  'help.guide.edit-accommodation.result':
    '변경은 숙박이 걸치는 모든 날에 한 번에 닿고, “예약” 탭의 “숙박” 예약에도 함께 닿습니다.',
  'help.guide.edit-accommodation.tip.1':
    '숙박 중간의 밤에는 “체크인”도 “체크아웃”도 라벨이 붙지 않습니다. 붙는 것은 기간의 첫날과 마지막 날뿐입니다.',
  'help.guide.edit-accommodation.tip.2':
    '숙박을 취소하면 체크인 날에 놓았던 경유지와 그 예약에 딸린 비용도 함께 사라집니다. 실수였다면 다시 하룻밤을 잡으세요.',
  // day-bookings
  'help.guide.day-bookings.title': '그 날의 예약을 한눈에',
  'help.guide.day-bookings.goal': '이 날에 이미 무엇이 예약되어 있고 확정되었는지를 한곳에서 봅니다.',
  'help.guide.day-bookings.step.1':
    '“예약”은 그 날의 예약을 보여 줍니다. 그 날로 날짜가 잡힌 것과, 그 날의 경유지에 달린 것입니다.',
  'help.guide.day-bookings.step.2':
    '한 행에는 예약의 종류와 이름이 나오고, 경유지에 속하면 가운뎃점 뒤에 그 경유지가 붙습니다. 시간은 오른쪽 끝에 있습니다.',
  'help.guide.day-bookings.step.3':
    '색이 예약의 상태를 말해 줍니다. 초록 행은 확정됨, 호박색 행은 아직 대기 중입니다. 호텔은 이 목록에 없고 아래에 자기 블록을 가집니다.',
  'help.guide.day-bookings.step.4': '이 목록은 예약을 읽어 주기만 합니다. 예약을 만들고 바꾸는 곳은 “예약” 탭입니다.',
  'help.guide.day-bookings.result':
    '그 날로 날짜가 잡힌 것도, 그 날의 경유지에 달린 것도 모두 이 하나의 목록에 있습니다.',
  'help.guide.day-bookings.tip.1':
    '예약은 자기 날짜에 따라 어느 날에 놓입니다. “예약” 탭에서 날짜를 바꾸면 저절로 다른 날로 옮겨 갑니다.',
  'help.guide.day-bookings.tip.2':
    '“예약” 블록이 없으면 그 날에는 예약이 없다는 뜻입니다. 비어 있는 채로 보여 주는 대신 숨깁니다.',

  // ── Screen: trip-map ──────────────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': '지도',
  'help.ctx.trip-map.summary':
    '계획의 가운데입니다. 여행의 모든 장소가 핀으로 있고, 그것들을 잇는 경로가 있으며, 지도 가장자리에는 위성, 전체 여행 한눈에 보기, 지금 보고 있는 동네 주변의 장소를 위한 스위치가 있습니다.',
  'help.ctx.trip-map.bullet.1':
    '핀은 장소입니다. 사진이 있으면 그 사진이고, 없으면 카테고리 색과 카테고리 아이콘입니다. 포인터를 올리면 이름과 주소가 담긴 카드가 나오고, 장소가 가지고 있으면 카테고리와 평점도 함께 나옵니다. 핀을 날짜 카드로 끌어다 놓으면 그 날에 장소가 계획됩니다.',
  'help.ctx.trip-map.bullet.2':
    '너무 가까워 구분되지 않는 핀들은 개수를 가진 하나의 짙은 버블로 접힙니다. 버블을 클릭하면 지도가 그 안에 있는 것에 맞춰 확대됩니다.',
  'help.ctx.trip-map.bullet.3':
    '핀을 클릭하면 지도 아래에 그 장소가 열립니다. 평점, “파일”, 그리고 다음에 할 수 있는 일이 나옵니다. 지도의 빈 곳을 클릭하면 다시 닫힙니다.',
  'help.ctx.trip-map.bullet.4':
    '일자 열에서 날짜가 열려 있으면 그 경유지에 작은 흰색 배지가 붙어 그 날 안에서의 번호를 보여 주고, 두 날짜에 계획된 장소는 · 로 이은 두 번호를 함께 가집니다.',
  'help.ctx.trip-map.bullet.5':
    '맨 위의 아이콘 줄은 보이는 지도 범위를 검색합니다. “음식점”, “카페”, “바 & 나이트라이프”, “숙소”, “명소”, “박물관 & 문화”, “자연 & 공원”, “액티비티”입니다. 지도를 옮긴 뒤에는 “이 지역 검색”이 다시 실행합니다.',
  'help.ctx.trip-map.bullet.6':
    '지도 아무 곳이나 오른쪽 클릭하면 그 지점의 장소 양식이, 주소를 이미 찾아 둔 채로 열립니다. 왼쪽 아래의 둥근 버튼은 그려진 지도를 항공 사진으로 바꿉니다.',
  'help.ctx.trip-map.bullet.7':
    '오른쪽 아래의 “전체 여행 보기”는 이동이 있는 모든 날짜를 한 번에 그리고 각 날짜가 무엇을 지나는지 나열합니다. 예약 행의 경로 아이콘은 그 예약을 그리고, 일자 위 도구 모음의 아이콘은 전부를 그립니다.',
  // map-markers
  'help.guide.map-markers.title': '지도 읽기',
  'help.guide.map-markers.goal': '지도의 모든 핀과 배지와 버블이 무엇을 말하는지 압니다.',
  'help.guide.map-markers.step.1':
    '지도에는 여행의 모든 장소가 있습니다. 핀이 너무 가까워 구분되지 않는 곳에서는, 안에 든 개수를 가진 하나의 짙은 버블로 접힙니다. 버블을 클릭하면 지도가 그 안에 있던 것에 맞춰 확대되고, 가장 깊은 배율에서는 핀을 부채처럼 펼칩니다.',
  'help.guide.map-markers.step.2':
    '핀은 사진이 있으면 그 장소의 사진이고, 없으면 카테고리 색과 카테고리 아이콘입니다. 포인터를 올리면 카드가 이름과 주소를 알려 주고, 장소가 가지고 있으면 카테고리와 평점도 알려 줍니다.',
  'help.guide.map-markers.step.3':
    '핀을 클릭하면 지도 아래 카드에 장소가 열립니다. 좌표, 평점, “파일”, 그리고 맨 아래에는 다음에 할 수 있는 것들이 늘어서는데 그 가운데 “내비게이션”, “편집”, “삭제”가 있고, 날짜가 열려 있으면 “날에 추가”도 있습니다. 지도의 빈 곳을 클릭하면 다시 닫힙니다.',
  'help.guide.map-markers.step.4':
    '일자 열에서 날짜를 열면 그 경유지에 번호가 붙습니다. 핀 모서리의 작은 흰색 배지가 그 날 안에서의 순서입니다. 두 날짜에 계획된 장소는 · 로 이은 두 번호를 함께 가집니다. 열린 날짜가 없으면 번호도 없고, 모서리에는 대신 평점이 들어갑니다.',
  'help.guide.map-markers.step.5':
    '핀을 지도에서 일자 열의 날짜 카드로 끌어다 놓으면 그 날에 장소가 계획됩니다. 장소 목록에서 그 행을 끌어내는 것과 똑같습니다.',
  'help.guide.map-markers.result':
    '여행에는 아무 변화도 없습니다. 지도는 여행을 보는 창이고, 핀마다 어느 장소인지, 어느 날인지, 몇 번째인지를 말합니다.',
  'help.guide.map-markers.tip.1':
    '일자 열에서 접힌 날짜는 그 경유지도 함께 지도에서 데려갑니다. 날짜를 다시 열면 돌아옵니다.',
  'help.guide.map-markers.tip.2':
    '장소 목록 위의 필터는 지도가 무엇을 그릴지도 정합니다. “미계획”을 고르면 아직 날짜가 없는 장소만 지도에 남습니다.',
  'help.guide.map-markers.tip.3':
    '이 지도에는 확대 버튼이 없습니다. 휠로 확대하고 축소하며, 더블 클릭으로 한 단계 확대하고, 지도 자체를 끌면 움직입니다.',
  // map-nearby-places
  'help.guide.map-nearby-places.title': '지도에서 주변 장소 찾기',
  'help.guide.map-nearby-places.goal':
    '지금 보고 있는 동네에서 음식점이나 명소, 호텔을 지도가 찾게 하고, 그중 하나를 여행에 담습니다.',
  'help.guide.map-nearby-places.step.1':
    '지도 위쪽의 아이콘 줄이 카테고리 검색입니다. “음식점”, “카페”, “바 & 나이트라이프”, “숙소”, “명소”, “박물관 & 문화”, “자연 & 공원”, “액티비티”입니다.',
  'help.guide.map-nearby-places.step.2':
    '카테고리를 클릭합니다. TREK가 보이는 지도 범위에서 그 종류의 장소를 찾고, 찾은 것마다 카테고리 색의 핀을 떨어뜨립니다. 한 번에 하나의 카테고리만 됩니다. 다른 것을 클릭하면 바뀌고, 켜져 있는 것을 클릭하면 꺼집니다.',
  'help.guide.map-nearby-places.step.3':
    '지도를 옮기면 줄 아래에 두 번째 버튼이 나타납니다. “이 지역 검색”이 새 화면으로 같은 검색을 실행합니다. 옮기는 것만으로는 결코 다시 검색하지 않으며, 그만큼 요청 수가 줄어듭니다.',
  'help.guide.map-nearby-places.step.4':
    '핀에는 찾은 것의 이름이 붙어 있습니다. 하나를 클릭하면 장소 양식이 그 내용으로 이미 채워진 채 열립니다. “이름”, “주소”, “위도”와 “경도”, 그리고 OpenStreetMap에 있는 경우 웹사이트와 전화번호입니다.',
  'help.guide.map-nearby-places.step.5':
    '채워진 내용을 확인하고 검색이 알 수 없었던 것을 더합니다. “설명”, “카테고리”, 그리고 나만의 메모입니다.',
  'help.guide.map-nearby-places.step.6':
    '“추가”를 클릭합니다. 같은 이름의 장소가 이미 여행에 있으면 양식이 그것을 알리고 버튼은 “그래도 추가”로 바뀝니다.',
  'help.guide.map-nearby-places.result':
    '장소는 장소 목록에 있고 지도에는 여행 자신의 핀 가운데 하나로 있습니다. 날짜에 놓기 전까지는 “미계획” 아래입니다. 검색 핀은 카테고리를 끌 때까지 남습니다.',
  'help.guide.map-nearby-places.tip.1':
    '“설정”의 “Travel & map”에서 “지도에서 장소 탐색”이 꺼져 있으면 이 줄은 없습니다.',
  'help.guide.map-nearby-places.tip.2':
    '답은 TREK 장소 색인과 OpenStreetMap에서 옵니다. 그래서 이것은 계획에서 연결이 필요한 몇 안 되는 것 가운데 하나입니다.',
  'help.guide.map-nearby-places.tip.3':
    '검색은 화면에 있는 것을 대상으로 하므로, 묻고 싶은 거리까지 확대하세요. 도시 하나 전체는 처음 예순 개의 결과를, 거의 순서 없이 돌려줍니다.',
  // map-add-place
  'help.guide.map-add-place.title': '지도를 오른쪽 클릭해 장소 만들기',
  'help.guide.map-add-place.goal': '먼저 검색하지 않고, 원하는 바로 그 자리에 장소를 둡니다.',
  'help.guide.map-add-place.step.1':
    '지도에서 원하는 지점을 오른쪽 클릭합니다. “장소/활동 추가”라는 제목의 장소 양식이 열립니다.',
  'help.guide.map-add-place.step.2':
    '“위도”와 “경도”는 이미 그 지점이고, TREK가 좌표를 찾아보고 거기서 찾은 것으로 “주소”를 채우며, 찾아본 곳에 이름이 있으면 “이름”도 채웁니다. 아직 아무것도 기록되지 않았으니 틀린 것은 덮어쓰세요.',
  'help.guide.map-add-place.step.3':
    '알아볼 수 있는 “이름”을 주고, 계획이 알아야 할 나머지도 넣습니다. “설명”, “메모”, “카테고리”, “웹사이트”입니다.',
  'help.guide.map-add-place.step.4':
    '“추가”를 클릭합니다. 날짜가 열려 있어도 장소는 미계획으로 목록에 들어갑니다. 지도의 오른쪽 클릭은 어디인지를 말할 뿐, 언제인지는 말하지 않습니다.',
  'help.guide.map-add-place.result': '장소는 목록과 지도에 있습니다. 날짜에 놓기 전까지는 “미계획” 아래입니다.',
  'help.guide.map-add-place.tip.1':
    '주소는 좌표를 되짚어 찾은 것이라 이름이 아니라 거리로 읽힐 수 있고, 허허벌판에서는 비어서 돌아올 수도 있습니다. 두 항목 모두 덮어쓸 수 있습니다.',
  'help.guide.map-add-place.tip.2':
    'MapLibre GL과 Mapbox GL 지도에서는 가운데 클릭도 같은 일을 하고, 터치 화면에서는 길게 누르면 됩니다.',
  // map-satellite
  'help.guide.map-satellite.title': '위성으로 전환하기',
  'help.guide.map-satellite.goal': '그려진 지도를 항공 사진으로 바꾸고, 다시 되돌립니다.',
  'help.guide.map-satellite.step.1':
    '지도 왼쪽 아래의 둥근 버튼이 기본 레이어 전환입니다. 아이콘은 늘 옮겨 갈 레이어를 보여 주고, 위에 올리면 어느 쪽인지 알려 줍니다. “위성 보기로 전환”입니다. 클릭합니다.',
  'help.guide.map-satellite.step.2':
    '이제 지도는 항공 사진입니다. 건물 하나를 알아볼 만큼 자세하고, 나만의 키도 필요 없습니다. TREK가 그리는 것은 모두 그 위에 남습니다. 핀, 그 날의 경로, 트랙, 예약 경로입니다.',
  'help.guide.map-satellite.step.3':
    '버튼은 이제 “지도 보기로 전환”이라고 적혀 있습니다. 클릭하면 그려진 지도로 돌아갑니다.',
  'help.guide.map-satellite.result': '지도가 다시 그려지고, 마지막에 두었던 레이어는 내 계정에 기억됩니다.',
  'help.guide.map-satellite.tip.1':
    '이 선택은 여행이 아니라 계정에 보관되므로, 어떤 지도 렌더러를 쓰든 모든 여행이 마지막에 둔 모습으로 열립니다.',
  'help.guide.map-satellite.tip.2':
    '항공 사진에는 글자가 없습니다. 거리 이름과 구역, 번지는 그려진 지도에 있으니 주소를 찾을 때는 다시 전환하세요.',
  // map-whole-trip
  'help.guide.map-whole-trip.title': '전체 여행과 그 거리 보기',
  'help.guide.map-whole-trip.goal':
    '열려 있는 하루를 여행의 이동이 있는 모든 날짜로 바꾸고, 각 날짜가 얼마나 가는지 읽습니다.',
  'help.guide.map-whole-trip.step.1':
    '둥근 “전체 여행 보기” 버튼은 지도 오른쪽 아래에 있습니다. 클릭하면 여행의 이동이 있는 모든 날짜가 한 번에 그려집니다. 각각 흰 테두리 위에 자기 색으로 그려져, 이웃한 날짜끼리도 구분됩니다.',
  'help.guide.map-whole-trip.step.2':
    '버튼 위의 카드가 그 날짜들을 나열합니다. 색 점, 날짜 이름, 그 날 이동하는 방식마다의 아이콘, 그리고 지나는 거리입니다. “총 거리”는 맨 위에 있습니다.',
  'help.guide.map-whole-trip.step.3':
    '카드에서 날짜를 클릭하면 선택됩니다. 일자 열에서 고르는 것과 같습니다. 지도가 그 날짜를 화면에 담고, 그 경유지에는 번호가 다시 붙습니다.',
  'help.guide.map-whole-trip.step.4':
    '버튼은 이제 “전체 여행 숨기기”라고 적혀 있습니다. 누르면 열려 있던 하루로 돌아갑니다.',
  'help.guide.map-whole-trip.result':
    '이동이 있는 모든 날짜가 자기 색으로 그려지고, 카드는 각 날짜가 지나는 거리와 여행 전체의 합계를 알려 줍니다.',
  'help.guide.map-whole-trip.tip.1':
    '합계는 구간마다 조금씩 도착합니다. 뒤에 … 가 붙어 있는 동안 그 숫자는 아직 부분 합계이며, 모든 구간이 답하면 확정됩니다.',
  'help.guide.map-whole-trip.tip.2':
    '경로 계산이 거부한 구간은 직선으로 남고 거리에 더해지지 않으며, 카드는 조용히 적게 보여 주는 대신 그것을 알립니다.',
  'help.guide.map-whole-trip.tip.3':
    '위치가 있는 경유지가 둘에 못 미치는 날짜는 그릴 경로가 없으므로 카드에서 아예 빠집니다.',
  // map-booking-routes
  'help.guide.map-booking-routes.title': '예약 경로를 지도에 표시하기',
  'help.guide.map-booking-routes.goal': '예약한 항공편과 기차, 자동차 이동을 지도에 그리고, 다시 지웁니다.',
  'help.guide.map-booking-routes.step.1':
    '예약 경로는 요청하기 전까지 꺼져 있습니다. 일자 열의 예약 행에는 작은 경로 아이콘이 있습니다. “예약 경로 표시”입니다.',
  'help.guide.map-booking-routes.step.2':
    '아이콘을 클릭합니다. 예약이 지도에 나타납니다. 항공편은 대권 호로, 자동차 이동은 실제 도로를 따라, 기차는 역을 이은 선으로 그려집니다. “확정됨”은 실선으로, “대기 중”은 점선으로 그려지고, 경로의 양 끝은 교통수단 아이콘이 든 파란 알약 모양입니다.',
  'help.guide.map-booking-routes.step.3':
    '끝의 알약을 클릭하면 그 뒤의 예약이 시간, “예약 코드”, “위치 / 주소”와 함께 열립니다. “닫기”로 다시 치웁니다.',
  'help.guide.map-booking-routes.step.4':
    '일자 위 도구 모음의 경로 아이콘은 전체 여행을 한 번에 다룹니다. “모든 예약 경로 표시”는 경로가 있는 모든 예약을 그립니다.',
  'help.guide.map-booking-routes.step.5':
    '이것은 위에 얹는 층이 아니라 백지에서 다시 시작하는 것이라, 예약마다 골라 둔 것은 사라집니다. 이제 “모든 예약 경로 숨기기”라고 적힌 버튼을 다시 누르면 지도가 깨끗해집니다.',
  'help.guide.map-booking-routes.result':
    '요청한 예약이 지도에 그려지고, 그 선택은 바꾸기 전까지 이 브라우저의 이 여행에 보관됩니다.',
  'help.guide.map-booking-routes.tip.1':
    '양 끝에 공항 코드나 역 이름이 나오는 것은 “설정”의 “Travel & map”에서 “예약 경로 레이블”이 켜져 있을 때뿐입니다. 그렇지 않으면 아이콘만 보입니다.',
  'help.guide.map-booking-routes.tip.2':
    '같은 설정에 있는 “예약 경로 항상 표시”는 아직 정하지 않은 모든 여행에서 처음부터 경로를 그립니다.',
  'help.guide.map-booking-routes.tip.3':
    '예약이 그려지려면 좌표가 있는 두 끝이 필요하므로, 호텔이나 음식점에는 경로 아이콘이 없습니다.',
  'help.ctx.trip-map.bullet.8':
    'Dawarich 애드온이 켜져 있으면 “전체 여행 보기” 아래의 둥근 Dawarich 버튼이 휴대폰이 실제로 기록한 경로를 그립니다. “기록된 경로 표시”는 계획한 경로 아래에 날짜마다 한 색씩 점선으로 깔고, 선이 없을 때는 버튼의 라벨이 왜 없는지 말해 줍니다.',
  // map-dawarich-trail
  'help.guide.map-dawarich-trail.title': '실제로 다닌 경로 보기',
  'help.guide.map-dawarich-trail.goal':
    'Dawarich가 휴대폰에 기록한 경로를 계획한 경로 옆에 점선으로 지도에 얹고, 여행이 실제로 어떻게 흘러갔는지 날짜별로 읽습니다.',
  'help.guide.map-dawarich-trail.step.1':
    '둥근 Dawarich 버튼은 지도 오른쪽 아래, “전체 여행 보기” 아래에 있습니다. 마우스를 올리면 “기록된 경로 표시”라고 적힙니다. 클릭합니다. TREK이 Dawarich에 여행 날짜를 묻고, 답이 오는 동안 버튼 둘레에 고리가 돕니다.',
  'help.guide.map-dawarich-trail.step.2':
    '기록된 경로는 날짜마다 한 색씩 점선으로 내려앉고, 계획이 계속 읽히도록 계획한 경로 아래에 그려집니다. 버튼은 이제 “기록된 경로 숨기기”라고 적힙니다. 날짜는 현지 자정에서 잘리고, 일자 열에서 접은 날짜는 정차지와 함께 그 점선도 지도에서 걷어 냅니다.',
  'help.guide.map-dawarich-trail.step.3':
    '“전체 여행 보기”도 클릭하면 계획한 모든 날짜가 점선 기록 옆에 실선으로 그려집니다. 둘이 함께 달리는 곳은 계획대로 간 날이고, 점선이 벗어나는 곳은 그렇지 않았던 곳입니다.',
  'help.guide.map-dawarich-trail.result':
    '계획한 것과 실제로 한 것이 점선과 실선으로 지도에 함께 있고, 버튼 위의 카드는 여전히 계획한 날짜와 거리를 나열합니다.',
  'help.guide.map-dawarich-trail.tip.1':
    '켜짐과 꺼짐은 이 브라우저 세션 동안 여행별로 기억됩니다. 경로가 켜져 있는 동안 TREK은 2분마다 Dawarich에 다시 물으므로 진행 중인 여행은 새로 고침 없이 따라잡습니다. 경로 자체는 절대 저장되지 않으므로 TREK 데이터베이스에도, 백업에도 없고 오프라인에서도 없습니다.',
  'help.guide.map-dawarich-trail.tip.2':
    '버튼의 라벨이 빈 지도를 설명합니다. 오는 중이면 “기록된 경로를 불러오는 중…”, 그 밖에 “해당 날짜에 기록된 내용이 없습니다”, “기록된 경로를 불러올 수 없습니다”, 또는 TREK이 오프라인일 때 “기록된 경로를 보려면 연결이 필요합니다”입니다.',
  // map-compass
  'help.guide.map-compass.title': '지도를 돌리고 다시 북쪽 찾기',
  'help.guide.map-compass.goal': '가는 방향을 향하도록 지도를 돌리고, 클릭 한 번으로 북쪽으로 되돌립니다.',
  'help.guide.map-compass.step.1':
    '오른쪽 버튼으로 드래그하거나 Ctrl을 누른 채 왼쪽 버튼으로 드래그해 지도를 돌립니다. 터치 화면에서는 두 손가락으로 비틉니다. 지도 맨 위 카테고리 아이콘 줄 옆의 둥근 나침반도 함께 돕니다. 화살표는 늘 북쪽을 가리키므로 돌린 만큼 기웁니다.',
  'help.guide.map-compass.step.2':
    '나침반을 클릭합니다. 버튼 이름 그대로 “Reset north”가 지도를 북쪽이 위인 평평한 보기로 부드럽게 되돌리고, 화살표는 다시 똑바로 섭니다.',
  'help.guide.map-compass.result':
    '지도는 다시 북쪽이 위이고 평평하며, 여행에는 아무것도 바뀌지 않았습니다. 나침반은 카메라만 움직입니다.',
  'help.guide.map-compass.tip.1':
    '나침반은 MapLibre GL과 Mapbox GL 지도에만 있습니다. Leaflet 지도는 돌릴 수 없으므로 나침반이 없습니다. “설정”의 “지도” 아래 “지도 공급자”가 어느 것을 쓸지 정하고, “지도 저장”이 그 선택을 지킵니다.',
  'help.guide.map-compass.tip.2':
    '클릭은 기울기도 없앱니다. 오른쪽 버튼으로 위아래로 드래그하면 보기가 기울고, “Reset north”는 회전과 함께 그것도 평평하게 합니다. Mapbox GL에서 “3D 건물 및 지형”이 켜져 있으면 3D 보기도 다시 기울이기 전까지 평평해집니다.',

  // ── Screen: trip-collab ───────────────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': 'Collab',
  'help.ctx.trip-collab.summary':
    '그룹이 함께 계획하는 탭입니다. 왼쪽에 “채팅”, 그 옆에 함께 쓰는 “메모”와 “링크”, 그 아래에 “투표”, 마지막에 “다음 할 일”이 있습니다. 여기에 쓴 것은 모두 새로 고침 없이 다른 모든 구성원의 화면에 동시에 나타납니다.',
  'help.ctx.trip-collab.bullet.1':
    '“채팅”은 왼쪽 열입니다. “메시지 입력...”에 쓰고 Enter를 누릅니다. Shift와 Enter는 줄을 바꿉니다. 스마일 표시는 이모지를 넣고, “이미지 첨부”는 메시지에 사진을 최대 네 장까지 답니다.',
  'help.ctx.trip-collab.bullet.2':
    '메시지에 마우스를 올리면 “답장”이, 자기 메시지에는 “삭제”도 나옵니다. 오른쪽 클릭하면 빠른 반응 여덟 개가 나옵니다. 삭제한 메시지는 “메시지를 삭제했습니다”라는 한 줄만 남깁니다.',
  'help.ctx.trip-collab.bullet.3':
    '“메모”는 함께 쓰는 공책입니다. “새 메모”로 하나를 쓰고, 그 옆의 톱니바퀴는 이름과 색을 위한 “카테고리 관리”를 엽니다. 카드에는 “펼치기”, “고정”, “편집”, “삭제”가 있습니다.',
  'help.ctx.trip-collab.bullet.4':
    '“링크”는 여행이 기대는 주소를 모읍니다. “링크 추가”는 제목과 http 또는 https 주소를 받습니다. “링크 편집”, “링크 고정”, “링크 삭제”는 칩 끝에 있고, 고정한 링크는 앞에 남습니다.',
  'help.ctx.trip-collab.bullet.5':
    '“투표”는 일을 결정합니다. “새 투표”는 적어도 두 개의 선택지와 함께 질문합니다. 선택지를 클릭하면 그것이 당신의 표이고, “닫기”가 투표를 끝내며, “삭제”가 투표를 없앱니다.',
  'help.ctx.trip-collab.bullet.6':
    '“다음 할 일”은 아직 앞에 남은 여행의 지점을 최대 여덟 개까지, 시간과 거기에 있는 사람과 함께 나열합니다. 하루 계획만 읽을 뿐이고, 시간은 거기에서 정합니다.',
  // write-note
  'help.guide.write-note.title': '함께 보는 메모 쓰기',
  'help.guide.write-note.goal': '그룹 전체에 필요한 것, 규칙, 주소, 알림을 모두가 다시 찾는 자리에 둡니다.',
  'help.guide.write-note.step.1': '“메모” 패널 맨 위의 “새 메모”를 클릭합니다. 양식이 열립니다.',
  'help.guide.write-note.step.2':
    '“메모 제목”은 카드가 지니는 이름입니다. 양식이 반드시 요구하는 것은 이것뿐이고, 내용이 들어가기 전까지 “생성”은 회색으로 남습니다.',
  'help.guide.write-note.step.3':
    '그 아래 큰 상자가 본문을 담고 Markdown을 받습니다. 굵은 단어, 목록, 제목이 됩니다. 카드에는 처음 몇 줄이 나오고, 거기의 “펼치기”가 메모 전체를 엽니다.',
  'help.guide.write-note.step.4':
    '“카테고리” 아래에서 이 메모가 속할 것을 고릅니다. 그 색이 카드의 색이 됩니다. 알약 모양들은 이미 있는 카테고리이고, 새 카테고리는 “카테고리 관리”에서 만듭니다.',
  'help.guide.write-note.step.5':
    '“웹사이트”는 메모에 딸린 링크를 받습니다. 그러면 카드에 그것을 여는 Link 타일이 생깁니다.',
  'help.guide.write-note.step.6': '“생성”을 클릭합니다.',
  'help.guide.write-note.result':
    '메모는 “메모” 패널의 카드가 되어 카테고리의 색을 띠고, 이미 다른 모든 구성원의 화면에 있습니다.',
  'help.guide.write-note.tip.1':
    '카드의 “고정”은 그것을 패널 맨 위에 붙들어 둡니다. 그 아래는 모두 마지막으로 바뀐 때 순으로 정렬됩니다.',
  'help.guide.write-note.tip.2':
    '“새 메모” 옆의 톱니바퀴는 “카테고리 관리”를 엽니다. 거기에서 카테고리가 색을 얻고, 모든 곳에서 한 번에 이름이 바뀌며, 어떤 메모가 쓰기도 전에 미리 추가됩니다.',
  'help.guide.write-note.tip.3':
    '“파일 첨부”는 메모에 문서를 답니다. “첨부”가 파일 선택기를 열고, 이미지나 PDF는 양식에 그냥 붙여 넣어도 됩니다.',
  'help.guide.write-note.tip.4':
    '“메모”는 “애드온” 아래, “Collab” 밑에 있는 독립된 스위치입니다. 관리자는 이것만 꺼서 “채팅”, “링크”, “투표”, “다음 할 일”은 계속 돌아가게 둘 수 있습니다.',
  // shared-links
  'help.guide.shared-links.title': '여행의 링크 모으기',
  'help.guide.shared-links.goal':
    '예약 사이트, 공유 앨범, 시간표를 한자리에 두고, 그것을 찾느라 채팅을 훑지 않아도 되게 합니다.',
  'help.guide.shared-links.step.1': '“링크” 패널 맨 위의 “링크 추가”를 클릭합니다.',
  'help.guide.shared-links.step.2':
    '“링크 제목”에 링크의 이름을 주고, 그 아래 칸에 주소를 붙여 넣은 다음, “링크 저장”을 클릭합니다.',
  'help.guide.shared-links.step.3':
    '칩에는 이름과 가리키는 사이트가 나옵니다. 클릭하면 그 페이지가 새 탭에서 열립니다.',
  'help.guide.shared-links.step.4':
    '끝에 있는 작은 버튼 세 개는 “링크 편집”, “링크 고정”, “링크 삭제”입니다. “링크 고정”은 칩을 패널 앞으로 옮기고, “링크 삭제”는 아무것도 묻지 않습니다.',
  'help.guide.shared-links.result':
    '링크는 “링크” 패널의 칩이 되어 앞쪽에 고정되고, 동시에 모든 구성원의 화면에 있습니다.',
  'help.guide.shared-links.tip.1': '받는 것은 http와 https 주소뿐입니다. 그 밖의 것은 칸이 저장하기 전에 거부합니다.',
  'help.guide.shared-links.tip.2':
    '고정한 링크가 먼저, 그다음이 최신순입니다. 제목 옆의 작은 아이콘은 그 사이트 자신의 파비콘이고 사이트에서 직접 가져오므로, 인터넷이 없으면 칩은 대신 평범한 링크 기호를 보여 줍니다.',
  'help.guide.shared-links.tip.3':
    '“링크”는 “애드온” 아래, “Collab” 밑에 있는 독립된 스위치라서, 관리자는 탭의 나머지를 건드리지 않고 이 패널만 끌 수 있습니다.',
  // create-poll
  'help.guide.create-poll.title': '그룹에게 묻기',
  'help.guide.create-poll.goal': '채팅에서는 아무도 답하지 않는 질문을, 모두가 표시할 수 있는 투표로 바꿉니다.',
  'help.guide.create-poll.step.1': '“투표” 패널 맨 위의 “새 투표”를 클릭합니다.',
  'help.guide.create-poll.step.2':
    '질문을 씁니다. 상자 아래의 “Markdown 지원”은 굵은 단어, 줄바꿈, 짧은 목록이 여기에서 통한다는 뜻입니다.',
  'help.guide.create-poll.step.3': '“옵션 1”과 “옵션 2”를 채웁니다. 내용이 든 선택지 두 개가 최소입니다.',
  'help.guide.create-poll.step.4':
    '“+ 옵션 추가”는 세 번째, 네 번째를 필요한 만큼 더합니다. 줄 옆의 작은 가위표는 하나를 다시 없앱니다.',
  'help.guide.create-poll.step.5':
    '“복수 선택”은 모두가 선택지를 둘 이상 고를 수 있게 합니다. 꺼 두면 누군가 다른 것을 고를 때 표가 그쪽으로 옮겨 갑니다.',
  'help.guide.create-poll.step.6': '“투표 만들기”를 클릭합니다.',
  'help.guide.create-poll.result': '투표는 “투표” 패널 맨 위에 열린 채로, 아직 아무도 투표하지 않은 상태로 섭니다.',
  'help.guide.create-poll.tip.1': '질문은 Markdown으로 그려지고, 선택지는 평범한 텍스트로 남습니다.',
  'help.guide.create-poll.tip.2': '질문과 내용이 든 선택지 두 개가 갖춰질 때까지 “투표 만들기”는 회색으로 남습니다.',
  'help.guide.create-poll.tip.3':
    '마감일은 휴대폰 앱에서만 정할 수 있습니다. 마감일이 있는 투표는 여기에서 남은 시간을 호박색 칩으로 보여 주고, 시간이 다하면 종료된 것으로 칩니다.',
  'help.guide.create-poll.tip.4':
    '“투표”는 “애드온” 아래, “Collab” 밑에 있는 독립된 스위치입니다. 관리자는 이것만 꺼서 나머지 네 패널은 계속 돌아가게 둘 수 있습니다.',
  // vote-poll
  'help.guide.vote-poll.title': '투표하고 결과 읽기',
  'help.guide.vote-poll.goal': '표를 던지고, 그룹이 어디에 서 있는지 보고, 마음을 바꿉니다.',
  'help.guide.vote-poll.step.1': '원하는 선택지를 클릭합니다. 그 동그라미가 채워지고 뒤의 막대가 자랍니다.',
  'help.guide.vote-poll.step.2':
    '이제 결과 전체가 읽힙니다. 막대는 비율이고, 백분율은 오른쪽에 서며, 작은 동그라미들은 그 선택지를 고른 사람들입니다.',
  'help.guide.vote-poll.step.3':
    '마음이 바뀌었다면 다른 선택지를 클릭합니다. “복수 선택”이 아닌 투표에서는 표가 두 번째로 늘지 않고 그쪽으로 옮겨 갑니다.',
  'help.guide.vote-poll.step.4':
    '질문 아래에 그 투표의 표 수가 서 있습니다. 이미 고른 선택지를 클릭하면 표가 다시 빠지고, 숫자도 다시 내려갑니다.',
  'help.guide.vote-poll.result':
    '당신의 표시는 한 선택지에 있고, 막대들은 그룹이 어떻게 갈렸는지 보여 주며, 동그라미들은 누가 무엇을 골랐는지 말합니다.',
  'help.guide.vote-poll.tip.1':
    '막대와 백분율은 당신이 직접 투표한 뒤, 또는 투표가 닫힌 뒤에만 나타납니다. 아무도 중간 판세에 이끌리지 않게 하기 위해서입니다.',
  'help.guide.vote-poll.tip.2':
    '투표는 결코 익명이 아닙니다. 선택지의 동그라미 하나에 마우스를 올리면 그 뒤의 이름이 나옵니다.',
  // close-poll
  'help.guide.close-poll.title': '투표 닫기, 또는 없애기',
  'help.guide.close-poll.goal': '그룹이 정하고 나면 투표를 멈추고, 아무도 더는 필요로 하지 않는 투표를 치웁니다.',
  'help.guide.close-poll.step.1': '투표 모서리의 자물쇠인 “닫기”가 투표를 끝냅니다. 선택지는 클릭을 받지 않게 됩니다.',
  'help.guide.close-poll.step.2':
    '닫힌 투표는 패널 맨 아래의 “종료됨” 제목 밑으로 내려가, “종료됨” 배지를 달고, 투표했든 안 했든 모두에게 결과를 보여 줍니다. 이긴 선택지는 초록으로 물듭니다.',
  'help.guide.close-poll.step.3':
    '같은 모서리의 휴지통인 “삭제”가 투표를 없앱니다. 두 번 묻는 것은 없고, 표도 함께 사라집니다.',
  'help.guide.close-poll.result':
    '투표는 모든 구성원의 패널에서 사라집니다. 닫기만 한 것은 결과와 함께 맨 아래에서 계속 읽힙니다.',
  'help.guide.close-poll.tip.1':
    '닫기는 되돌릴 수 없습니다. 다시 여는 기능은 없습니다. 실수로 닫힌 투표는 다시 물어야 합니다.',
  'help.guide.close-poll.tip.2':
    '“삭제”는 그 투표와 거기에 담긴 모든 표를 모두에게서, 곧바로, 아무것도 묻지 않고 가져갑니다.',
  // whats-next
  'help.guide.whats-next.title': '“다음 할 일” 읽기',
  'help.guide.whats-next.goal': '계획을 열지 않고 그룹이 다음에 무엇을 하는지 봅니다.',
  'help.guide.whats-next.step.1':
    '이 패널은 아직 앞에 남은 여행의 지점을 최대 여덟 개까지 시간 순으로, 하루마다 하나씩 붙는 제목 아래에 나열합니다. 제목은 “오늘”, “내일” 또는 날짜입니다.',
  'help.guide.whats-next.step.2':
    '행의 왼쪽에는 시간이 섭니다. 시작 시각, “까지”, 그리고 그 지점에 끝 시각이 있으면 그것입니다. 아직 시간이 정해지지 않았으면 TBD입니다.',
  'help.guide.whats-next.step.3':
    '이름 아래의 칩은 그 지점에 있는 사람들입니다. 아무도 고르지 않았으면 여행의 모두가 나열됩니다.',
  'help.guide.whats-next.result':
    '다가오는 것의 목록이고, 읽기 전용입니다. 계획을 따를 뿐, 여기에서는 아무것도 계획을 바꾸지 않습니다.',
  'help.guide.whats-next.tip.1':
    '여기에서는 아무것도 정하지 않습니다. 시간은 하루 계획에서 옵니다. 거기에서 바꾸면 이 목록이 곧바로 따라옵니다.',
  'help.guide.whats-next.tip.2':
    '나열되는 것은 아직 앞에 남은 것뿐입니다. 시간이 지난 지점은 빠지고, 여행이 끝날 무렵에는 패널이 빕니다.',
  'help.guide.whats-next.tip.3':
    '“다음 할 일”은 “애드온” 아래, “Collab” 밑에 있는 독립된 스위치이고, 데스크톱 패널입니다. 휴대폰 앱의 “Collab” 탭에는 없습니다.',
  // trip-chat
  'help.guide.trip-chat.title': '그룹과 이야기하기',
  'help.guide.trip-chat.goal':
    '무언가를 말하고, 특정한 메시지 하나에 답하고, 다른 메시지에 반응하고, 자기 메시지를 거둬들입니다.',
  'help.guide.trip-chat.step.1':
    '“메시지 입력...”에 쓰고 Enter를 누릅니다. 상자 옆의 파란 화살표도 같은 일을 합니다. Shift와 Enter는 대신 줄을 바꿉니다.',
  'help.guide.trip-chat.step.2':
    '스마일 표시는 이모지 선택기를 엽니다. 그 안에 Smileys, Reactions, Travel이 있습니다. 고른 것은 쓰고 있는 글에 더해질 뿐, 그것만 따로 보내지지는 않습니다.',
  'help.guide.trip-chat.step.3':
    '다른 사람의 메시지에 마우스를 올리면 모서리에 작고 둥근 버튼이 나타납니다. 그것이 “답장”입니다.',
  'help.guide.trip-chat.step.4':
    '답하는 메시지는 상자 위에 인용됩니다. 쓰고 보내면 인용이 당신의 말풍선에 함께 실립니다. 인용의 가위표는 그것을 다시 떨굽니다.',
  'help.guide.trip-chat.step.5':
    '메시지를 오른쪽 클릭하면 빠른 반응 여덟 개가 나옵니다. 당신의 반응은 말풍선 아래에 앉고, 같은 것을 한 번 더 클릭하면 거둬들입니다.',
  'help.guide.trip-chat.step.6':
    '자기 메시지에는 “답장” 옆에 “삭제”가 있습니다. 그것은 메시지를 가져가고 “메시지를 삭제했습니다”라는 한 줄만 남깁니다. 돌아갈 길은 없습니다.',
  'help.guide.trip-chat.result':
    '당신의 답은 인용한 메시지 아래에 앉고, 반응은 세 번째 메시지에 달리며, 거둬들인 것은 그렇게 말하는 한 줄만 남깁니다.',
  'help.guide.trip-chat.tip.1': 'Enter는 보내고, Shift와 Enter는 줄을 바꿉니다. 이모지뿐인 메시지는 크게 나옵니다.',
  'help.guide.trip-chat.tip.2':
    '“이미지 첨부”는 한 메시지에 사진을 최대 네 장까지 받습니다. 사진은 상자에 그냥 붙여 넣거나 끌어다 놓아도 됩니다.',
  'help.guide.trip-chat.tip.3':
    '링크가 든 메시지에는 그 아래에 미리보기 카드가 붙습니다. 그것을 가져오는 것은 당신 자신의 TREK이므로, 당신만 닿을 수 있는 곳으로 가는 링크는 평범한 링크로 남습니다.',
  'help.guide.trip-chat.tip.4':
    '“채팅”은 “애드온” 아래, “Collab” 밑에 있는 독립된 스위치입니다. 관리자는 이것만 꺼서 “메모”, “링크”, “투표”, “다음 할 일”은 계속 돌아가게 둘 수 있습니다.',

  // ── Screen: trip-lists ────────────────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': '목록',
  'help.ctx.trip-lists.summary':
    '한 여행에 목록이 둘입니다. 누가 무엇을 가져가고 무게가 얼마인지까지 담는 짐 목록과, 여행 전과 도중에 일어나야 할 모든 것을 적는 할 일 목록입니다. 이 탭은 “목록” 애드온이 켜져 있는 동안 있습니다.',
  'help.ctx.trip-lists.bullet.1':
    '위쪽의 “짐 목록”과 “할 일”이 둘 사이를 전환하고 각각에 무엇이 있는지 셉니다. 오른쪽 버튼들은 지금 열려 있는 쪽의 것입니다.',
  'help.ctx.trip-lists.bullet.2':
    '짐 목록은 목록별로 묶입니다. 서류, 의류, 무엇이라 부르든 상관없습니다. 각 목록에는 색 점과, 챙긴 개수와 전체 개수를 보여 주는 배지와, “이름 변경”, “전체 체크”, “전체 체크 해제”, “목록 삭제”가 든 점 세 개가 있습니다. 위쪽 막대의 “목록 추가”가 새 목록을 만듭니다.',
  'help.ctx.trip-lists.bullet.3':
    '한 행은 체크 상자와 이름, 그다음 누가 가져가는지, 수량, 그램 단위 무게가 작은 배지로 나오고, “가방 추적”이 켜져 있으면 가방 동그라미, 그다음 휴지통과 “목록으로 이동”, “공유”, “이름 변경”, “삭제”가 든 점 세 개입니다. 행이 쓰지 않는 것은 포인터를 올릴 때까지 흐리게 보이고, 왼쪽의 손잡이는 그 행을 자기 목록 안에서 위아래로 끕니다.',
  'help.ctx.trip-lists.bullet.4':
    '“공동”과 “내 목록”이 짐 목록을 둘로 나눕니다. 모두가 보는 공용 묶음과, 내 것입니다. “전체”, “미완료”, “완료”가 열려 있는 쪽을 좁히고, 위쪽 막대가 얼마나 챙겼는지 셉니다.',
  'help.ctx.trip-lists.bullet.5':
    '“템플릿 적용”과 “템플릿으로 저장”은 일일이 입력하지 않고도 목록을 채우거나 남겨 둡니다. 그 옆의 아이콘 두 개는 목록을 인쇄물, PDF, 파일로 내보내고, 목록을 가져옵니다. 진행 막대 옆의 빨간 버튼은 체크된 항목이 몇 개인지 말하고 그것들을 치웁니다.',
  'help.ctx.trip-lists.bullet.6':
    '“할 일”에는 전용 사이드바가 있습니다. 진행 카드, “전체”, “내 작업”, “기한 초과”, “완료” 필터, 목록마다 한 행, 그리고 그 아래의 “목록 추가”입니다. 작업은 카드 안에 있으며, 카드 머리글에는 필터 이름이 표시되고 “우선순위”나 “마감일”로 하는 정렬도 여기에 있습니다. 작업을 클릭하면 오른쪽 패널에서 열리고, “새 작업 추가”는 화면 가운데에 “새 작업” 양식을 엽니다.',
  // packing-categories
  'help.guide.packing-categories.title': '짐 목록 만들기',
  'help.guide.packing-categories.goal': '가져갈 것을 목록으로 묶고, 항목을 채우고, 각 목록을 누가 맡는지 정합니다.',
  'help.guide.packing-categories.step.1':
    '목록 위의 막대에서 “목록 추가”를 클릭하고, “목록 이름 (예: 의류)”에 이름을 입력한 뒤 “추가”를 클릭합니다.',
  'help.guide.packing-categories.step.2':
    '새 목록은 빈 행 하나로 시작합니다. “항목 추가”를 클릭하고 “항목 이름...”에 항목을 입력한 뒤 Enter를 누릅니다. 입력란은 다음 항목을 위해 열린 채로 있습니다.',
  'help.guide.packing-categories.step.3':
    '행의 이름은 이름을 클릭하거나, 오른쪽 끝의 점 세 개에 있는 “이름 변경”으로 바꿉니다.',
  'help.guide.packing-categories.step.4':
    '목록 헤더의 점선 원은 여행 멤버를 그 목록에 배정합니다. 이름을 고르면 나타나는 칩을 클릭하면 그 사람이 다시 빠집니다.',
  'help.guide.packing-categories.step.5':
    '헤더 끝의 점 세 개에 나머지가 들어 있습니다. “이름 변경”, “전체 체크”, “전체 체크 해제”, 그리고 “목록 삭제”인데, 이것은 목록과 그 안의 모든 것을 다시 묻지 않고 없앱니다.',
  'help.guide.packing-categories.result':
    '새 목록이 항목들을 아래에 두고 색 점과 함께 격자에 자리 잡고, 배지가 이미 챙긴 개수를 셉니다.',
  'help.guide.packing-categories.tip.1':
    '목록은 그 항목들일 뿐입니다. 마지막 항목을 지우면 그 행이 자리 표시자로 바뀌어 목록이 자리와 색을 지킵니다. 그 행까지 지우면 목록이 사라집니다.',
  'help.guide.packing-categories.tip.2':
    '누군가를 목록에 배정하면 그 사람에게 짐 알림이 갑니다. 항목을 누가 볼 수 있는지는 바뀌지 않습니다. 그것은 행의 점 세 개에 있는 “공유”입니다.',
  'help.guide.packing-categories.tip.3':
    '두 목록이 같은 이름을 가져도 됩니다. TREK이 내부에서 둘을 구분하므로 이름은 입력한 그대로 남습니다.',
  // check-off-packing
  'help.guide.check-off-packing.title': '짐을 싸면서 체크하기',
  'help.guide.check-off-packing.goal': '가방에 들어간 것을 표시하고, 막대를 보고, 챙긴 항목을 치웁니다.',
  'help.guide.check-off-packing.step.1': '행 왼쪽의 상자를 클릭합니다. 이름에 취소선이 그어지고 막대가 움직입니다.',
  'help.guide.check-off-packing.step.2': '위쪽 막대는 목록에 있는 전부에 대해 챙긴 개수를 숫자로도 백분율로도 셉니다.',
  'help.guide.check-off-packing.step.3':
    '목록 전체를 한 번에 하려면, 그 헤더의 점 세 개에 “전체 체크”와 “전체 체크 해제”가 있습니다.',
  'help.guide.check-off-packing.step.4':
    '“전체”, “미완료”, “완료”가 격자를 좁힙니다. “미완료”는 아직 빠진 것만 남기므로, 다 챙긴 목록은 거기에서 빠집니다.',
  'help.guide.check-off-packing.step.5':
    '진행 막대 옆의 “체크된 3개 제거”는 브라우저의 확인을 한 번 거친 뒤, 체크된 항목을 모두 한꺼번에 삭제합니다.',
  'help.guide.check-off-packing.result': '아직 남은 것만 보이고, 위쪽 막대가 짐 싸기가 어디까지 왔는지 말해 줍니다.',
  'help.guide.check-off-packing.tip.1': '체크된 항목도 이름을 바꿀 수 있습니다. 이름을 클릭하세요.',
  'help.guide.check-off-packing.tip.2':
    '“전체 체크”와 “전체 체크 해제”는 그 목록 자신의 점 세 개에서, 한 번에 한 목록에만 작동합니다.',
  'help.guide.check-off-packing.tip.3': '모든 항목이 체크되면 카운터가 “모두 완료!”로 바뀌고 막대가 초록색이 됩니다.',
  // apply-packing-template
  'help.guide.apply-packing-template.title': '짐 템플릿 적용하기',
  'help.guide.apply-packing-template.goal':
    '이미 만들어진 목록을 여행에 들여오고, 이번 여행의 목록을 다음 여행을 위해 남깁니다.',
  'help.guide.apply-packing-template.step.1': '목록 위 막대에서 “템플릿 적용”을 클릭합니다.',
  'help.guide.apply-packing-template.step.2':
    '템플릿을 고릅니다. 각 줄이 이름과 항목이 몇 개 들어 있는지를 알려 줍니다.',
  'help.guide.apply-packing-template.step.3':
    '항목은 지금 보고 있는 화면에 들어갑니다. “공동”이면 모두가 보는 묶음에, “내 목록”이면 내 것이 됩니다.',
  'help.guide.apply-packing-template.step.4':
    '이번 여행의 목록을 다음 여행을 위해 남기려면 “템플릿으로 저장”으로 대화 상자를 열고, 이름을 입력한 뒤 “저장”을 클릭합니다.',
  'help.guide.apply-packing-template.result': '템플릿의 목록과 항목이 원래 있던 것 옆에 여행 안으로 들어옵니다.',
  'help.guide.apply-packing-template.tip.1':
    '템플릿이 나르는 것은 이름과 목록뿐입니다. 수량, 무게, 가방, 이미 체크된 상태는 따라오지 않습니다.',
  'help.guide.apply-packing-template.tip.2':
    '“템플릿 적용”은 템플릿이 하나라도 있어야 나타납니다. 없으면 버튼 자체가 보이지 않습니다.',
  'help.guide.apply-packing-template.tip.3':
    '“템플릿으로 저장”은 인스턴스 관리자에게만, 그리고 목록에 항목이 있는 동안에만 나타납니다. 공용 묶음과 내 항목을 저장하고, 다른 멤버의 개인 항목은 절대 저장하지 않습니다.',
  // import-packing-list
  'help.guide.import-packing-list.title': '짐 목록을 통째로 붙여넣기',
  'help.guide.import-packing-list.goal': '다른 곳에 이미 있는 목록을 한 번에 짐 항목으로 바꿉니다.',
  'help.guide.import-packing-list.step.1': '목록 위 막대에서 아래쪽 화살표가 있는 가져오기 버튼을 클릭합니다.',
  'help.guide.import-packing-list.step.2':
    '한 줄에 한 항목입니다. 카테고리, 이름, 무게(g, 선택), 가방(선택), checked/unchecked(선택). 상자 안의 회색 예시가 네 가지 형태를 모두 보여 줍니다. Markdown 목록도 됩니다. 제목이 목록 이름이 되고, "- [ ]"와 "- [x]"는 항목이 됩니다.',
  'help.guide.import-packing-list.step.3':
    '또는 “CSV/TXT/MD 불러오기”로 파일에서 줄을 읽어 옵니다. .csv, .txt, .md를 받아서 상자 안에 있던 것을 대체합니다.',
  'help.guide.import-packing-list.step.4': '“가져오기”를 클릭합니다. 버튼이 알아들은 줄 수를 셉니다.',
  'help.guide.import-packing-list.result':
    '모든 줄이 한 행이 되어 첫 필드가 가리키는 목록에 들어가고, 이미 있던 것은 아무것도 건드리지 않습니다.',
  'help.guide.import-packing-list.tip.1':
    '쉼표, 세미콜론, 탭이 모두 필드를 나누고, 큰따옴표는 필드를 하나로 묶습니다. 그래서 “Shirt, blue”는 한 이름으로 남습니다. 값이 하나뿐인 줄은 그냥 이름이고, 자기 목록이 없는 줄은 “기타”에 들어가며, 이름 앞의 "3x"는 수량을 정합니다.',
  'help.guide.import-packing-list.tip.2':
    '네 번째 필드에 적힌 가방은 여행에 아직 없으면 만들어집니다. 무게와 가방을 한꺼번에 불러오는 곳은 여기뿐이고, 템플릿은 이름과 목록만 가져옵니다.',
  // export-packing-list
  'help.guide.export-packing-list.title': '짐 목록 인쇄하거나 내보내기',
  'help.guide.export-packing-list.goal': '목록을 종이로, PDF로, 또는 다른 앱이나 다음 여행에 쓸 파일로 가져갑니다.',
  'help.guide.export-packing-list.step.1': '목록 위 막대에서 위쪽 화살표가 있는 내보내기 버튼을 클릭합니다.',
  'help.guide.export-packing-list.step.2':
    '“Markdown 체크리스트 (.md)”와 “가져오기용 CSV (.csv)”는 목록을 바로 파일로 저장합니다.',
  'help.guide.export-packing-list.step.3':
    '“인쇄 또는 PDF로 저장”을 클릭합니다. 미리 보기가 목록을 한 페이지로 보여 줍니다. 위에는 여행과 날짜가, 그 아래에는 목록마다 체크 상자가 달린 카드가 있습니다.',
  'help.guide.export-packing-list.step.4':
    '미리 보기 아래의 “인쇄 또는 PDF로 저장”을 클릭합니다. 브라우저가 인쇄 대화 상자를 엽니다. 프린터를 고르거나, 파일로 남기려면 “PDF로 저장”을 고릅니다.',
  'help.guide.export-packing-list.result':
    '인쇄물과 파일에는 지금 열려 있는 보기, “공동” 또는 “내 목록”이 수량, 무게, 체크 표시와 함께 담깁니다.',
  'help.guide.export-packing-list.tip.1':
    'CSV는 “가져오기”가 읽는 형식이고 가방까지 담기므로, 나만의 짐 템플릿으로 쓸 수 있습니다. 다음 여행에 가져오면 됩니다.',
  'help.guide.export-packing-list.tip.2':
    'Markdown 파일은 Obsidian, Notion, GitHub에서 체크리스트로 열리고, “가져오기”로 똑같이 다시 들여올 수 있습니다.',
  // share-packing-item
  'help.guide.share-packing-item.title': '누가 항목을 보고 누가 가져갈지 정하기',
  'help.guide.share-packing-item.goal':
    '항목을 그룹 공용 묶음과 내 목록, 그리고 내가 대신 챙겨 주는 사람들 사이에서 옮깁니다.',
  'help.guide.share-packing-item.step.1':
    '목록 위의 “공동”은 모두가 보는 묶음이고 “내 목록”은 내 것이며, 각각 그 안의 개수를 셉니다. “내 목록”을 클릭해 내 것을 봅니다.',
  'help.guide.share-packing-item.step.2': '다시 “공동”에서 행 끝의 점 세 개를 열고 “공유”를 클릭합니다.',
  'help.guide.share-packing-item.step.3':
    '단계는 셋입니다. “공동”은 그룹 공용 묶음에 있고 모두에게 보입니다. “개인”은 나만 볼 수 있습니다. “공유 대상…”에서는 그 항목이 누구를 위한 것인지 고릅니다.',
  'help.guide.share-packing-item.step.4': '“개인” 항목은 “내 목록”에만 있습니다. 그쪽으로 옮겨 가서 찾으세요.',
  'help.guide.share-packing-item.step.5':
    '“공유”를 다시 열고 “공유 대상…” 아래에서 이름을 체크합니다. 그 항목이 그 사람의 목록에도 보이고, 행에는 공유한 사람 수를 세는 작은 배지가 붙습니다.',
  'help.guide.share-packing-item.result': '항목이 고른 단계에 놓이고, 행이 누가 가져가는지 말해 줍니다.',
  'help.guide.share-packing-item.tip.1':
    '항목의 공유를 바꾸는 사람은 그것을 가져가는 사람뿐입니다. 공유받은 사람은 자기 “내 목록”에서 내 이름이 붙은 채로 그것을 보고, 체크할 수 있습니다.',
  'help.guide.share-packing-item.tip.2':
    '다른 사람이 가져가는 항목에서는 대신 다른 버튼 두 개가 나옵니다. “저도 가져갈 수 있어요”는 나를 그 사람 옆에 더하고, “내 목록으로 복사”는 나만의 비공개 사본을 만듭니다.',
  'help.guide.share-packing-item.tip.3':
    '새 항목은 추가한 화면을 물려받습니다. “내 목록”에서 추가하면 “개인”이 되고, “공동”에서 추가하면 공용 묶음으로 들어갑니다.',
  // packing-bags
  'help.guide.packing-bags.title': '가방 무게 재기',
  'help.guide.packing-bags.goal':
    '모든 항목에 무게를 넣고, 항목을 가방에 나눠 담고, 각 가방을 항공사 제한 아래로 유지합니다.',
  'help.guide.packing-bags.step.1': '동그라미 앞의 무게 배지를 클릭하고 항목의 무게를 그램 단위로 입력합니다.',
  'help.guide.packing-bags.step.2': '행 끝의 동그라미가 그 항목의 가방입니다. 클릭하세요.',
  'help.guide.packing-bags.step.3':
    '아직 가방이 없으면 “가방 추가”, 이름, Enter입니다. 가방이 만들어지고 항목이 곧장 그 안에 들어갑니다.',
  'help.guide.packing-bags.step.4':
    '가방이 하나라도 생기면 오른쪽에 “가방” 패널이 나타납니다. 이름, 무게, 채움 막대, 누가 드는지와 안에 항목이 몇 개인지, 그다음 “미배정”과 “총 무게”입니다.',
  'help.guide.packing-bags.step.5': '“제한 설정”을 클릭하고 항공사가 말하는 방식대로 제한을 킬로그램으로 입력합니다.',
  'help.guide.packing-bags.step.6': '가방 이름 옆의 점선 더하기가 누가 그것을 드는지 알려 줍니다.',
  'help.guide.packing-bags.result':
    '오른쪽의 “가방” 패널이 각 가방의 무게를 제한과 나란히, 어느 가방에도 없는 것, 그리고 합계를 보여 줍니다.',
  'help.guide.packing-bags.tip.1':
    '무게 칸과 가방 동그라미와 “가방” 패널은 관리자가 “목록” 애드온 아래에서 “가방 추적”을 켜 둔 동안에만 있습니다.',
  'help.guide.packing-bags.tip.2':
    '가방의 무게는 내가 볼 수 없는 것까지 포함해 모든 멤버의 항목에 대해 서버에서 합산됩니다. 그래서 그 숫자는 정말로 그 가방의 무게입니다.',
  'help.guide.packing-bags.tip.3':
    '제한이 없는 가방은 가장 무거운 가방을 기준으로 그려져 막대들이 서로 비교 가능하게 남습니다. 제한을 주면 막대는 그 제한을 기준으로 읽힙니다.',
  // create-todo
  'help.guide.create-todo.title': '작업 추가하기',
  'help.guide.create-todo.goal': '일어나야 할 일을 목록, 우선순위, 날짜, 그리고 담당자와 함께 적어 둡니다.',
  'help.guide.create-todo.step.1': '오른쪽 위의 “새 작업 추가”를 클릭합니다.',
  'help.guide.create-todo.step.2': '“작업 이름”에 이름을 붙이고, 기억해 둘 만한 것은 “설명”에 적습니다.',
  'help.guide.create-todo.step.3':
    '“목록”이 작업을 묶습니다. 하나를 고르거나, 옆의 더하기를 눌러 작은 대화 상자에서 새 목록의 이름을 정합니다.',
  'help.guide.create-todo.step.4':
    '“우선순위”는 버튼 네 개입니다. “없음”, P1, P2, P3이고 빨강에서 파랑으로 내려갑니다.',
  'help.guide.create-todo.step.5': '“마감일”은 달력을 열고, “배정 대상”은 작업에 이름을 붙입니다.',
  'help.guide.create-todo.step.6': '“작업 만들기”를 클릭합니다.',
  'help.guide.create-todo.result':
    '작업이 우선순위, 마감일, 목록, 배정된 사람이라는 배지를 달고 목록에 들어가며, 오른쪽 패널에서 열립니다.',
  'help.guide.create-todo.tip.1': '필수는 이름뿐입니다. 나머지는 나중에 오른쪽 패널에서 채울 수 있습니다.',
  'help.guide.create-todo.tip.2': '사이드바에서 목록을 선택해 두면 새 작업은 그 목록에서 시작합니다.',
  'help.guide.create-todo.tip.3': '이름 칸에서 Enter를 누르면 다른 칸을 건드리지 않고 곧바로 작업이 만들어집니다.',
  // todo-filters
  'help.guide.todo-filters.title': '작업 찾아서 고치기',
  'help.guide.todo-filters.goal': '작업 목록을 지금 중요한 것만 남게 줄이고, 도달한 작업을 편집합니다.',
  'help.guide.todo-filters.step.1':
    '사이드바의 “작업”입니다. “전체”는 아직 열려 있는 전부, “내 작업”은 나에게 걸린 것, “기한 초과”는 날짜가 지난 것, “완료”는 끝난 것입니다. 각각 개수를 달고 있습니다. “기한 초과”를 클릭하세요.',
  'help.guide.todo-filters.step.2':
    '“목록” 아래에는 목록마다 한 행이 있습니다. 하나를 고르면 끝난 작업까지 포함해 그 목록이 보입니다.',
  'help.guide.todo-filters.step.3':
    '목록 머리글에 있는 정렬은 화면에 있는 것을 다시 늘어놓습니다. “우선순위”는 P1을 앞에, “마감일”은 가장 가까운 기한을 앞에 둡니다. 둘 중 하나만 한 번에 되며, 한 번 더 클릭하면 내가 정한 순서로 돌아갑니다.',
  'help.guide.todo-filters.step.4': '작업을 클릭해 오른쪽 패널에서 엽니다.',
  'help.guide.todo-filters.step.5':
    '필요한 것을 바꿉니다. “설명”, “우선순위”, “목록”, “마감일”, “배정 대상”입니다. 그다음 “변경 사항 저장”입니다. 패널 머리글의 체크 상자는 작업을 완료로 표시하고, “삭제”는 작업을 즉시 없앱니다.',
  'help.guide.todo-filters.result': '목록에는 요청한 작업만 보이고, 오른쪽 패널이 고른 작업을 편집합니다.',
  'help.guide.todo-filters.tip.1':
    '목록 행은 아직 열려 있는 것만 세지만, 선택하면 끝난 작업도 보입니다. “전체”, “내 작업”, “기한 초과”는 끝난 것을 감추고, “완료”는 그것만 보여 줍니다.',
  'help.guide.todo-filters.tip.2':
    '정렬의 “우선순위”와 “마감일”은 서로를 배제하며, 둘 중 하나가 켜져 있는 동안에는 행을 내가 정한 순서로 끌어 옮길 수 없습니다.',

  // ── Screen: trip-bookings ─────────────────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': '예약',
  'help.ctx.trip-bookings.summary':
    '이동 수단을 뺀, 여행을 위해 예약한 모든 것이 있는 탭입니다. 묵을 곳, 식당 자리, 티켓, 투어, 주차가 여기에 있습니다. 예약은 저마다 “대기 중”이나 “확정됨”의 카드가 되어 코드와 서류와 동행자와 비용을 지니고 있습니다.',
  'help.ctx.trip-bookings.bullet.1':
    '오른쪽 위의 “직접 예약”이 양식을 엽니다. 여기서 만드는 여섯 가지는 “숙박”, “레스토랑”, “이벤트”, “투어”, “주차”, “기타”입니다. 항공편과 기차 등은 “교통” 탭에 있고 여기에는 나타나지 않습니다.',
  'help.ctx.trip-bookings.bullet.2':
    '“파일에서 가져오기”는 확인서를 분석기에 넘깁니다. EML, PDF, PKPass, HTML, TXT를 쓸 수 있고, 파일당 10 MB, 최대 5개입니다. 이 버튼은 서버가 그것들을 읽을 수 있을 때만 있습니다.',
  'help.ctx.trip-bookings.bullet.3':
    '제목 옆의 칩은 유형으로 거르며, 저마다 자기 개수를 지니고 있습니다. “전체”가 모두를 되돌립니다. 예약이 사람을 지정하면, 칩 옆의 아바타 줄이 탭을 그중 한 사람으로 좁힙니다.',
  'help.ctx.trip-bookings.bullet.4':
    '카드는 “대기 중”과 “확정됨”의 두 구역에 서고, 각각 개수가 붙습니다. 구역 제목을 클릭하면 접히고, 열려 있는지 여부는 이 여행에 대해 기억됩니다.',
  'help.ctx.trip-bookings.bullet.5':
    '카드는 상태 점, 유형, 제목, 날짜와 시간, “예약 코드”, “위치 / 주소”, 예약이 연결된 대상, “링크”, “메모”, “파일”, “동행자”를 담습니다.',
  'help.ctx.trip-bookings.bullet.6':
    '카드의 연필은 같은 양식을 다시 엽니다. 휴지통은 한 번 묻고 그러면 예약은 사라집니다. 숙박이라면 일별 계획의 숙박일과 연결된 지출도 함께 사라집니다.',
  // create-booking
  'help.guide.create-booking.title': '예약 만들기',
  'help.guide.create-booking.goal': '식당, 이벤트, 투어, 주차 자리, 그 밖의 무엇이든 손으로 여행에 넣습니다.',
  'help.guide.create-booking.step.1': '탭 오른쪽 위의 “직접 예약”을 클릭합니다. “새 예약”이 열립니다.',
  'help.guide.create-booking.step.2':
    '양식 위쪽의 “동행자” 옆에 있는 목록에서 “예약 유형”을 고릅니다. 이 탭이 만드는 여섯 가지는 “숙박”, “레스토랑”, “이벤트”, “투어”, “주차”, “기타”이고, 고른 것에 따라 양식이 바뀝니다. 날짜를 날의 범위로 바꾸는 것은 “숙박”뿐입니다.',
  'help.guide.create-booking.step.3':
    '“제목”을 입력합니다. 양식이 꼭 요구하는 항목은 이 하나뿐이고, 무언가 들어가기 전까지 “추가”는 눌리지 않습니다.',
  'help.guide.create-booking.step.4':
    '“날짜”와 “시작 시간”을 정하고, 끝이 있는 예약이라면 “종료 날짜”와 “종료 시간”도 정합니다. 달력은 여행 안의 날만 내어 주고, 끝이 시작보다 뒤가 아니면 빨간색으로 그렇게 알리며 “추가”를 막습니다.',
  'help.guide.create-booking.step.5':
    '확인서의 “예약 코드”를 넣고 “상태”를 정합니다. “대기 중”이냐 “확정됨”이냐가 카드가 두 구역 가운데 어디에 놓일지를 결정합니다.',
  'help.guide.create-booking.step.6': '“추가”를 클릭합니다.',
  'help.guide.create-booking.result':
    '예약은 유형 칩과 날짜와 코드를 단 카드로 제 구역에 서고, 여행의 다른 모두에게도 나타납니다.',
  'help.guide.create-booking.tip.1':
    '“위치 / 주소”는 입력하는 동안 실제 주소를 내어 줍니다. 하나를 고르면 쓴 내용이 바뀌고, 직접 입력한 주소는 그대로 남습니다.',
  'help.guide.create-booking.tip.2':
    '“링크”에는 제공처에 있는 그 예약의 페이지를 넣습니다. 카드는 그것을 새 탭에서 열리는 링크로 만듭니다.',
  'help.guide.create-booking.tip.3': '“메모”는 Markdown이라 목록이나 굵은 줄도 카드에서 그대로 표시됩니다.',
  // booking-hotel
  'help.guide.booking-hotel.title': '묵을 곳 예약하기',
  'help.guide.booking-hotel.goal': '숙박을 넣어 예약으로도, 일별 계획의 숙박일로도 한 번에 세어지게 합니다.',
  'help.guide.booking-hotel.step.1':
    '“직접 예약”을 클릭하고 “숙박”을 고릅니다. 날짜 항목이 사라지고 그 자리에 숙소용 항목 묶음이 들어섭니다.',
  'help.guide.booking-hotel.step.2':
    '“숙박”에서 호텔을 고릅니다. 목록은 이 여행에 있는 장소이고, 하나를 고르면 그 이름이 “제목”에, 주소가 “위치 / 주소”에 적힙니다.',
  'help.guide.booking-hotel.step.3':
    '“부터”와 “까지”를 정합니다. 첫 숙박일과 떠나는 날 아침입니다. 둘 다 여행의 날을 날짜와 함께 내어 주고, 두 값은 서로 순서가 어긋나지 않게 유지됩니다.',
  'help.guide.booking-hotel.step.4': '“체크인”, “체크인 마감”, “체크아웃”과 확인서의 “예약 코드”를 채웁니다.',
  'help.guide.booking-hotel.step.5': '“추가”를 클릭합니다.',
  'help.guide.booking-hotel.result':
    '카드는 날짜 대신 날의 범위를 지니고, 체크인과 체크아웃 시간과 주소가 함께 붙습니다. 같은 숙박이 이제 계획의 그 날들에도 자리를 잡습니다.',
  'help.guide.booking-hotel.tip.1':
    '“숙박”은 “날짜”와 “시작 시간”이 없는 유일한 유형입니다. 그 날짜는 “부터”와 “까지”이고, 달력이 아니라 여행의 날에서 고릅니다.',
  'help.guide.booking-hotel.tip.2':
    '“숙박”을 비워 두고 대신 주소를 입력해도 됩니다. 그 장소를 찾아 만들고 지도에 핀으로 꽂아 줍니다.',
  'help.guide.booking-hotel.tip.3': '예약을 지우면 일별 계획의 숙박일도 함께 사라집니다.',
  // link-booking
  'help.guide.link-booking.title': '예약을 계획에 묶기',
  'help.guide.link-booking.goal': '예약을 그것이 속한 들를 곳과 장소에 걸어, 필요한 자리에 나타나게 합니다.',
  'help.guide.link-booking.step.1': '연결하려는 카드의 연필을 클릭합니다. “예약 편집”이 열립니다.',
  'help.guide.link-booking.step.2':
    '“날 배정에 연결”을 엽니다. 목록은 계획 그 자체입니다. 날마다 제목이 있고, 그 아래에 그날의 들를 곳이 번호와 시간과 함께 있습니다. 예약이 속한 것을 고릅니다.',
  'help.guide.link-booking.step.3':
    '“장소 / 활동”은 장소 자체를 연결합니다. 거기서 고르면 비워 둔 “제목”과 “위치 / 주소”가 채워집니다.',
  'help.guide.link-booking.step.4': '“업데이트”를 클릭합니다.',
  'help.guide.link-booking.result':
    '카드는 “날 배정에 연결” 아래에 그 날과 들를 곳을 적고, 예약은 일별 계획에서 그 들를 곳과 함께 움직입니다.',
  'help.guide.link-booking.tip.1':
    '목록 맨 위의 “연결 없음 (독립)”이 연결을 다시 풉니다. “숙박”에는 들를 곳을 고르는 칸 자체가 없습니다. 숙박일을 통해 연결됩니다.',
  'help.guide.link-booking.tip.2':
    '날짜가 있는 날의 들를 곳을 고르면 비어 있던 “날짜”가 대신 채워집니다. 이미 정해 둔 날짜는 건드리지 않습니다.',
  // booking-travelers
  'help.guide.booking-travelers.title': '예약이 누구를 위한 것인지 밝히기',
  'help.guide.booking-travelers.goal': '예약이 포함하는 동행자를 표시하고, 그런 다음 그 사람의 것만 봅니다.',
  'help.guide.booking-travelers.step.1':
    '연필로 예약을 엽니다. “동행자”는 양식 위쪽, “예약 유형” 옆에 있고, 예약에 아무도 없는 동안에는 “동행자 지정”이라고 표시됩니다.',
  'help.guide.booking-travelers.step.2':
    '그곳을 클릭하고 이 예약이 해당하는 사람을 고릅니다. 이름이 있는 “게스트”도 목록에 있습니다. 고른 사람에게는 체크가 붙고 필드에 그 사람의 아바타가 나타납니다. 이름을 다시 클릭하면 풀립니다.',
  'help.guide.booking-travelers.step.3': '“업데이트”를 클릭합니다.',
  'help.guide.booking-travelers.step.4':
    '위쪽 도구 모음에서, 유형 칩 옆에 있는 동행자의 아바타를 클릭하면 그 사람의 예약만 보입니다.',
  'help.guide.booking-travelers.result': '카드는 해당하는 사람을 적고, 아바타 줄은 탭을 그중 한 사람으로 좁힙니다.',
  'help.guide.booking-travelers.tip.1':
    '카드에서 동행자는 보이기만 할 뿐 바뀌지 않습니다. 지정은 여기, 양식에서 합니다.',
  'help.guide.booking-travelers.tip.2':
    '아바타 줄은 여행에 구성원이 둘 이상이고 적어도 한 예약이 누군가를 지정했을 때 나타납니다. 고른 내용은 이 브라우저 세션 동안 이어집니다.',
  // booking-files
  'help.guide.booking-files.title': '바우처를 예약과 함께 두기',
  'help.guide.booking-files.goal': '확인서, 티켓, 패스를 그것이 속한 예약에 첨부합니다.',
  'help.guide.booking-files.step.1':
    '연필로 예약을 열고 “파일”까지 내려가 “파일 첨부”를 클릭합니다. 이미 있는 예약이라면 서류가 곧바로 올라가고 TREK이 “파일이 업로드되었습니다”라고 알립니다.',
  'help.guide.booking-files.step.2': '서류는 이름으로 나열되고, 여는 버튼과 그 옆의 X가 붙습니다.',
  'help.guide.booking-files.step.3':
    '“기존 파일 연결”은 아직 이 예약에 없는 여행의 서류를 내어 줍니다. 하나를 고르면 다시 올리지 않고 첨부됩니다.',
  'help.guide.booking-files.step.4': '“업데이트”를 클릭합니다.',
  'help.guide.booking-files.result': '카드는 “파일” 아래에 서류를 나열하고, 그중 하나를 클릭하면 열립니다.',
  'help.guide.booking-files.tip.1': '아직 만들고 있는 예약에서는 서류가 기다렸다가 “추가”를 클릭하는 순간 올라갑니다.',
  'help.guide.booking-files.tip.2':
    '서류 옆의 X는 연결만 없앨 뿐 서류를 없애지는 않습니다. 서류는 여행의 “파일” 탭에 남습니다.',
  'help.guide.booking-files.tip.3':
    '어떤 종류의 파일을 첨부할 수 있는지는 관리자의 “허용된 파일 형식” 목록에 달려 있습니다. 기본 상태에서는 문서, 텍스트, 그림이 허용됩니다.',
  // booking-cost
  'help.guide.booking-cost.title': '예약 금액을 비용으로 바꾸기',
  'help.guide.booking-cost.goal': '예약에 드는 금액을 “비용”에 넣고, 내는 사람들끼리 나눕니다.',
  'help.guide.booking-cost.step.1':
    '예약을 열고 양식의 맨 아래로 갑니다. “비용” 아래에 “지출 만들기”와 “기존 지출 연결”이 있고, 그 아래에 “예약을 저장한 뒤 비용 편집기를 엽니다.”라는 안내가 붙어 있습니다.',
  'help.guide.booking-cost.step.2':
    '“지출 만들기”를 클릭합니다. 예약이 저장되고, 그 양식이 닫히며, 비용 편집 창이 열립니다.',
  'help.guide.booking-cost.step.3':
    '“무엇을 위한 것인가요?”에는 이미 예약의 제목이 들어 있습니다. “총 금액”을 넣고 “통화”와 “날짜”를 확인합니다.',
  'help.guide.booking-cost.step.4':
    '“카테고리”는 예약 유형이 정해 주는 것입니다. “누가 지불했나요?”와 금액을 나누는 방식인 “Split”을 설정합니다.',
  'help.guide.booking-cost.step.5': '“지출 추가”를 클릭합니다.',
  'help.guide.booking-cost.result':
    '예약의 양식에는 이제 지출이 금액과 함께 “연결된 지출” 아래에 보이고, 같은 지출이 이 예약에 묶인 채 “비용” 탭에 섭니다.',
  'help.guide.booking-cost.tip.1':
    '카테고리는 유형을 따릅니다. “레스토랑”은 “식음료”가 되고, “숙박”은 “숙박”이 되고, “주차”는 “주차”가 되며, “이벤트”와 “투어”는 둘 다 “기타”로 갑니다.',
  'help.guide.booking-cost.tip.2':
    '예약 하나에 지출을 여러 개 달 수 있습니다. “기존 지출 연결”은 “비용”에 있으면서 아직 어디에도 속하지 않은 지출을 보여 줍니다. 연결된 지출에서 “연결 해제, 지출은 유지”는 연결만 풀고 지출을 “비용”에 남기며, 휴지통은 지출을 없앱니다.',
  'help.guide.booking-cost.tip.3':
    '“비용”이 양식에 있는 것은 “비용” 애드온이 켜져 있는 동안뿐이고, 관리자가 “애드온”에서 그것을 켜고 끕니다.',
  // filter-bookings
  'help.guide.filter-bookings.title': '예약 찾기',
  'help.guide.filter-bookings.goal': '긴 탭을 찾는 유형, 사람, 상태로 좁힙니다.',
  'help.guide.filter-bookings.step.1':
    '제목 옆의 칩은 이 여행이 실제로 쓰는 유형이고, 저마다 담고 있는 개수를 답니다. “전체”는 탭 전부입니다.',
  'help.guide.filter-bookings.step.2': '칩을 클릭하면 그 유형만 남습니다. 두 번째를 클릭하면 둘 다 남습니다.',
  'help.guide.filter-bookings.step.3': '“전체”가 모두를 되돌립니다.',
  'help.guide.filter-bookings.step.4':
    '칩 옆의 아바타는 동행자로 거르며, 한 사람이든 여러 사람이든 한꺼번에 고를 수 있습니다.',
  'help.guide.filter-bookings.step.5':
    '“대기 중”과 “확정됨”이 두 구역이고, 각각 개수가 붙습니다. 제목을 클릭하면 하나가 접히고, 돌아와도 여전히 접혀 있습니다.',
  'help.guide.filter-bookings.result':
    '탭은 고른 것만 보여 주고, 이 브라우저 세션 안에서는 돌아와도 여전히 그대로 골라져 있습니다.',
  'help.guide.filter-bookings.tip.1':
    '칩은 여행에 있는 유형만 내어 주므로, 투어가 하나도 없는 여행에는 “투어” 칩이 없습니다.',
  'help.guide.filter-bookings.tip.2':
    '아무것도 맞지 않는 거르기는 탭을 비우고 “장소를 찾을 수 없습니다”를 남깁니다. 문구는 장소 목록의 것이지만 뜻은 같습니다.',
  // import-booking-file
  'help.guide.import-booking-file.title': '확인서에서 예약 읽어 오기',
  'help.guide.import-booking-file.goal':
    '다시 입력하는 대신, 제공처가 보낸 메일이나 PDF에서 TREK이 예약을 끌어내게 합니다.',
  'help.guide.import-booking-file.step.1':
    '도구 모음의 “파일에서 가져오기”를 클릭합니다. “예약 확인서 가져오기”가 열립니다.',
  'help.guide.import-booking-file.step.2':
    '확인서를 상자에 끌어다 놓거나, 상자를 클릭해 고릅니다. EML, PDF, PKPass, HTML, TXT를 쓸 수 있고, 파일당 10 MB로 최대 5개입니다. 고른 파일의 이름이 상자에 적힙니다.',
  'help.guide.import-booking-file.step.3':
    '“가져오기”를 클릭합니다. 읽는 일은 뒤에서 일어나므로 대화 상자는 곧바로 닫힙니다.',
  'help.guide.import-booking-file.step.4':
    '오른쪽 아래의 카드가 파일 이름 아래에서 진행 상황을 알리고, 앱 안을 옮겨 다녀도 새로 고쳐도 따라옵니다. 읽기가 끝나면 “파일 분석 중…”이 체크 표시로 바뀌고, 카드가 “가져오기”를 내어 줍니다. 그것을 클릭합니다.',
  'help.guide.import-booking-file.result':
    '예약은 숙박일, 코드, “파일” 아래의 확인서를 지닌 “대기 중”의 카드가 되고, 숙박은 계획의 그 날짜들에 놓이며, “비용”이 켜져 있으면 가격은 그것에 묶인 지출입니다.',
  'help.guide.import-booking-file.tip.1':
    '“파일에서 가져오기”는 서버가 확인서를 읽을 수 있을 때만 있고, 그러려면 추출기나 “AI 분석” 애드온이 필요합니다. 뒤엣것은 관리자가 “애드온”에서 켜고 끕니다.',
  'help.guide.import-booking-file.tip.2':
    '아무것도 읽어 내지 못하면 카드가 그렇게 알리고 “Try AI parsing”을 내어 줍니다. 그것은 같은 파일을 곧장 모델로 보냅니다. 끝난 분석은 10분 동안 보관되니, 검토는 그 안에 시작하세요.',
  'help.guide.import-booking-file.tip.3':
    '확인서는 그 형식이 관리자 설정의 “허용된 파일 형식”에 있을 때만 첨부됩니다. PDF는 처음부터 있지만 메일, 곧 EML은 먼저 추가해야 하고, 그러지 않으면 예약은 확인서 없이 저장됩니다.',
  // edit-booking
  'help.guide.edit-booking.title': '예약 바꾸기',
  'help.guide.edit-booking.goal':
    '시간을 고치거나, 나중에 온 코드를 넣거나, 예약을 “대기 중”에서 “확정됨”으로 옮깁니다.',
  'help.guide.edit-booking.step.1':
    '카드 머리의 연필을 클릭합니다. “예약 편집”이 그 예약이 아는 모든 것과 함께 열립니다.',
  'help.guide.edit-booking.step.2': '바꿀 것을 바꿉니다. 여기서는 업체가 마침내 보내온 “예약 코드”입니다.',
  'help.guide.edit-booking.step.3': '“상태”를 “확정됨”으로 둡니다.',
  'help.guide.edit-booking.step.4': '“업데이트”를 클릭합니다.',
  'help.guide.edit-booking.result':
    '카드가 옮겨 갑니다. 확정된 예약은 초록 점 뒤, “확정됨” 구역에 서고, 여행의 모두가 그 이동을 봅니다.',
  'help.guide.edit-booking.tip.1':
    '읽을 수 없는 “예약 코드”는 설정의 “화면”에 있는 “예약 코드 흐리게” 때문입니다. 마우스를 올리거나 클릭하면 읽힙니다.',
  'help.guide.edit-booking.tip.2':
    '유형을 바꾸면 연결된 지출의 카테고리도 따라갑니다. 비용 편집 창에서 손으로 카테고리를 고른 경우에는 그렇지 않습니다.',
  'help.guide.edit-booking.tip.3': '숙박도 여기서 편집합니다. 그 “부터”와 “까지” 날도 같은 양식에 있습니다.',
  // delete-booking
  'help.guide.delete-booking.title': '예약 지우기',
  'help.guide.delete-booking.goal': '무산된 예약을 여행에서 덜어 냅니다.',
  'help.guide.delete-booking.step.1': '카드 머리의 휴지통을 클릭합니다.',
  'help.guide.delete-booking.step.2': '“예약을 삭제할까요?”가 고른 예약의 이름을 대고 영구히 삭제된다고 알립니다.',
  'help.guide.delete-booking.step.3': '“확인”을 클릭합니다.',
  'help.guide.delete-booking.result':
    '카드는 여행의 모두에게서 사라집니다. 예약에는 되돌리기가 없으니 이 물음이 마지막 관문입니다.',
  'help.guide.delete-booking.tip.1':
    '숙박 예약을 지우면 일별 계획에서 그 숙박일도 빠지고, 거기 연결되어 있던 지출도 없어집니다.',
  'help.guide.delete-booking.tip.2':
    '첨부되어 있던 서류는 여행의 “파일” 탭에 남습니다. 사라지는 것은 예약과의 연결뿐입니다.',
  // import-booking-file
  'help.guide.import-booking-file.step.5':
    '찾아낸 예약이 하나씩 “새 예약”에 이미 채워진 채로 차례로 열립니다. 호텔이라면 “제목”에 이름, 여행에 그 장소가 있으면 “숙박” 아래에 그 장소, “위치 / 주소”, 숙박일에 맞춘 “부터”와 “까지”, “체크인”과 “체크아웃”, “예약 코드”, “파일” 아래의 확인서, 그리고 “비용”이 켜져 있으면 “연결된 지출”로 가격입니다. 확인하고 “추가”를 클릭합니다.',

  // ── Screen: trip-costs ────────────────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': '비용',
  'help.ctx.trip-costs.summary':
    '여행의 돈입니다. 모든 지출이 날짜별 장부로 쌓이고, 누가 돈을 냈는지와 누가 그 몫을 지는지가 영수증에 적힌 통화 그대로 남습니다. 그리고 오른쪽 열에는 다시 셈이 맞으려면 누가 누구에게 얼마를 내야 하는지가 나옵니다.',
  'help.ctx.trip-costs.bullet.1':
    '위쪽의 카드 넷: “내가 줄 돈”과 “받을 돈”은 정산에서 내 쪽이고, “미정산 금액”은 기록은 되었지만 아직 지불자가 없는 금액이며, “총 여행 지출”은 모든 것을 더한 다음 그 아래에 “내 몫”과 “내가 지불함”을 둡니다.',
  'help.ctx.trip-costs.bullet.2':
    '오른쪽 위의 “지출 추가”가 편집기를 엽니다. 그 옆의 “정산하기”는 열려 있는 송금을 한 번에 모두 기록합니다.',
  'help.ctx.trip-costs.bullet.3':
    '장부는 날짜별로 묶이고 최근 날짜가 먼저 오며, 그날의 합계가 오른쪽에 붙습니다. 한 줄에는 카테고리가 색이 있는 탭으로, 이름과 지불자 칩, 메모와 금액이 담기고, 분할 결과 내가 더 냈거나 덜 냈으면 “빌려줌” 또는 “빌림”도 함께 나옵니다.',
  'help.ctx.trip-costs.bullet.4':
    '목록 위에는 “지출 검색…”, 카테고리 필터, 날짜 필터, “전체” / “내가 지불” / “받을 돈” 전환, 그리고 “CSV 내보내기” 버튼이 있습니다.',
  'help.ctx.trip-costs.bullet.5':
    '오른쪽 열이 답입니다. “정산하기”는 누가 누구에게 내는지를 나열하고, “잔액”은 여행자마다 남거나 모자란 금액을 보여주며, “최종 부담액”은 여행이 각자에게 얼마가 되는지를, “카테고리별”은 돈이 어디로 갔는지를 보여줍니다.',
  'help.ctx.trip-costs.bullet.6':
    '기록된 결제는 같은 장부에 자기 줄로 놓이고 옆에 “편집”과 “실행 취소”가 붙습니다. 지출에는 연필과 휴지통이 있고, 휴지통은 묻지 않고 바로 삭제합니다.',
  // add-expense
  'help.guide.add-expense.title': '지출 추가하기',
  'help.guide.add-expense.goal': '무엇에 얼마가 들었는지, 누가 냈는지, 누구와 나누는지를 기록합니다.',
  'help.guide.add-expense.step.1':
    '비용 탭 오른쪽 위의 “지출 추가”를 클릭합니다. 편집기가 오늘 날짜로 열리고, 모두가 이미 분할에 들어 있습니다.',
  'help.guide.add-expense.step.2':
    '무엇에 쓴 돈인지를 “무엇을 위한 것인가요?”에 입력합니다. 반드시 채워야 하는 항목은 이것 하나뿐입니다. 영수증의 숫자는 “총 금액”에 넣습니다.',
  'help.guide.add-expense.step.3':
    '“통화”와 “날짜”는 금액 아래에 있습니다. “통화”는 여행 자체의 통화에서 시작하고, 바꾸면 그 금액이 여행 통화로 얼마인지를 편집기가 보여줍니다. “날짜”는 오늘에서 시작하며, 장부는 이 날짜로 지출을 묶습니다.',
  'help.guide.add-expense.step.4':
    '“카테고리”를 고릅니다. 열네 개가 있고 바꿀 수 없습니다. 고른 것이 줄의 색이 있는 탭이 되고 “카테고리별”의 막대가 됩니다.',
  'help.guide.add-expense.step.5':
    '“누가 지불했나요?” 아래에서 실제로 돈을 낸 사람을 고릅니다. “나”가 미리 선택되어 있습니다. “아직 아무도 지불하지 않음”은 누구에게도 부담을 지우지 않고 금액만 기록하고, “여러 명이 결제함”은 계산을 여러 지불자에게 나눕니다.',
  'help.guide.add-expense.step.6':
    'Split은 모두가 포함된 Equally로 시작하고, 이름마다 돌아가는 몫이 표시됩니다. “지출 추가”를 클릭하면 저장됩니다.',
  'help.guide.add-expense.result':
    '지출이 해당 날짜 아래 장부에 들어가고 “총 여행 지출”에 더해지며, 정산 열은 누가 누구에게 줄지를 다시 계산했습니다.',
  'help.guide.add-expense.tip.1':
    '열린 그대로 두면 지출은 여행 통화에, 오늘 날짜로, 모두에게 똑같이 나뉜 상태입니다. 정말로 채워야 하는 것은 이름과 금액뿐입니다.',
  'help.guide.add-expense.tip.2':
    '금액 옆의 ±는 지출을 환불로 바꿉니다. 합계가 음수면 돈을 가져가는 대신 돌려주고, 분할도 반대 방향으로 갑니다.',
  'help.guide.add-expense.tip.3':
    '아래의 “영수증 / 청구서 첨부”는 이미지와 PDF를 받습니다. 저장할 때 업로드되어 여행의 파일로 들어가고, 목록에서 이름 옆에 “영수증” 칩이 나타납니다.',
  // expense-payers
  'help.guide.expense-payers.title': '누가 계산했는지 적기',
  'help.guide.expense-payers.goal': '어떤 지출에서 누가 돈을 먼저 냈는지를 기록합니다. 정산 계산의 나머지 반입니다.',
  'help.guide.expense-payers.step.1':
    '줄 옆의 연필로 지출을 열고 “누가 지불했나요?”를 봅니다. 기본값은 “한 명이 결제함”이고, 드롭다운에는 돈을 낸 한 사람의 이름이 들어갑니다.',
  'help.guide.expense-payers.step.2':
    '그 드롭다운의 첫 항목인 “아직 아무도 지불하지 않음”은 누구에게도 부담을 지우지 않고 금액만 기록합니다. 그래도 지출은 “총 여행 지출”에 그대로 들어갑니다.',
  'help.guide.expense-payers.step.3':
    '라벨 옆의 링크인 “여러 명이 결제함”은 여행자마다 한 줄씩 엽니다. 돈을 낸 사람을 포함하고 각자가 얼마를 냈는지 입력합니다. 금액의 합은 총액과 같아야 합니다.',
  'help.guide.expense-payers.step.4':
    '아무도 내지 않은 지출은 줄에 “미완료” 표시가 붙고 “미정산 금액” 카드에 더해집니다. 기록은 되었지만 정산되지 않은 지출이 모이는 곳입니다.',
  'help.guide.expense-payers.result':
    '누가 냈는지가 누가 돌려받을지를 정하고, 분할이 누가 낼지를 정하며, “잔액”은 그 둘의 차이입니다.',
  'help.guide.expense-payers.tip.1':
    '“누가 지불했나요?”와 Split은 서로 독립적입니다. 함께하지 않은 저녁값을 낼 수도 있고, 내지 않은 저녁의 분할에 들어갈 수도 있습니다.',
  'help.guide.expense-payers.tip.2':
    '지불자가 여럿이면 금액의 합이 총액과 같아야 합니다. 한 사람을 더 포함하면 나머지가 그에 맞춰 다시 배분되고, 맞지 않는 동안에는 합이 얼마가 되어야 하는지 편집기가 알리며 저장을 거부합니다.',
  'help.guide.expense-payers.tip.3':
    '지불자를 없애도 지출은 없어지지 않습니다. 금액은 “총 여행 지출”에 남고 줄은 “미완료”가 됩니다.',
  // split-expense
  'help.guide.split-expense.title': '여행자끼리 계산 나누기',
  'help.guide.split-expense.goal': '어떤 지출을 누가 부담할지 정합니다. 모두 똑같이, 금액으로, 또는 영수증을 한 줄씩.',
  'help.guide.split-expense.step.1':
    '지출 편집기의 Split에는 모든 여행자가 나열됩니다. 이름을 클릭하면 이 지출에서 빠지고, 빠진 여행자에게는 “제외됨”이라고 표시되며 아무것도 부담하지 않습니다.',
  'help.guide.split-expense.step.2':
    'Equally가 기본값입니다. 포함된 여행자마다 같은 몫을 지고, 목록 아래 줄이 몇 사람으로 나뉘는지와 한 몫이 얼마인지를 알려줍니다.',
  'help.guide.split-expense.step.3':
    'Custom은 그 몫들을 금액 입력란으로 바꿉니다. 여행자마다 부담할 금액을 입력하면 아래 줄이 함께 세다가 “분할 금액이 합계와 일치합니다”가 되면 초록색으로 바뀝니다. 맞지 않는 동안에는 저장되지 않습니다.',
  'help.guide.split-expense.step.4':
    'Ticket은 영수증을 한 줄씩 나눕니다. “항목 추가”를 누르고 줄마다 이름과 가격을 넣은 다음, “나눔:” 아래에 그 줄을 나눠 지는 여행자를 둡니다.',
  'help.guide.split-expense.step.5':
    '줄 아래의 “개인별 부담”은 여행자마다 결국 얼마를 부담하는지를 보여주고, 위의 “총 금액”은 줄에서 합산됩니다. “저장”을 클릭합니다.',
  'help.guide.split-expense.result':
    '분할은 모든 잔액이 만들어지는 바탕입니다. 지출과 함께 저장되고, 다른 것은 건드리지 않고 나중에 바꿀 수 있습니다.',
  'help.guide.split-expense.tip.1':
    '빼놓은 여행자에게는 “제외됨”이라고 표시되고 이 지출 하나만 부담하지 않습니다. 그 몫은 나머지가 나눠 집니다.',
  'help.guide.split-expense.tip.2':
    'Equally는 1센트까지 정확합니다. 남는 1센트는 지출마다 돌아가므로 늘 같은 사람이 내는 일은 없습니다.',
  'help.guide.split-expense.tip.3':
    'Ticket 모드는 “총 금액”을 스스로 합산하고 입력란을 회색으로 막습니다. 영수증의 줄이 곧 합계입니다.',
  // expense-currency
  'help.guide.expense-currency.title': '다른 통화로 지출 입력하기',
  'help.guide.expense-currency.goal': '영수증에 적힌 그대로 넣고 환율은 TREK이 붙잡게 둡니다.',
  'help.guide.expense-currency.step.1':
    '“지출 추가”를 열고 이름과 금액을 영수증에 적힌 그대로 채웁니다. 환산한 값이 아니라 그 숫자 자체입니다.',
  'help.guide.expense-currency.step.2':
    '“통화”를 열고 영수증의 통화를 고릅니다. 목록에는 TREK이 아는 모든 코드가 있고 검색할 수 있습니다. 세 글자를 입력하세요.',
  'help.guide.expense-currency.step.3':
    '입력란 아래에 그 금액이 지금 얼마인지를 보여주는 줄이 “실시간 환율” 표시와 함께 나타납니다. 미리보기일 뿐 저장되는 값은 아닙니다.',
  'help.guide.expense-currency.step.4':
    '“지출 추가”를 클릭합니다. 환율은 그 자리에서 고정됩니다. 이제부터 이 지출은 입력한 날의 가치 그대로입니다.',
  'help.guide.expense-currency.step.5':
    '장부에서는 이름 아래에 두 숫자가 함께 놓입니다. 입력한 금액, 화살표, 그리고 여행 통화로 환산된 금액입니다. 위의 모든 합계와 잔액과 정산은 두 번째 것을 씁니다.',
  'help.guide.expense-currency.result':
    '지출은 입력한 금액과 통화를 그대로 지닙니다. 장부는 둘 다 보여주고, 여행의 합계와 잔액은 여행 통화로 남습니다.',
  'help.guide.expense-currency.tip.1':
    '환율은 저장하는 순간 고정되므로, 그다음 주에 시세가 움직였다고 해서 정산된 빚이 되살아나지 않습니다. 새 환율이 고정되는 것은 지출의 통화를 바꿀 때뿐입니다.',
  'help.guide.expense-currency.tip.2':
    '“설정”의 “표시 통화”는 읽는 내용만 바꿀 뿐, 저장된 금액은 움직이지 않습니다. 비워 두면 여행마다 자기 통화로 표시됩니다.',
  'help.guide.expense-currency.tip.3':
    '여행 통화 자체는 여행에 있고 “여행 편집” 아래에 있으며, “여행 상세 편집” 권한이 필요합니다. 바꾸면 고정된 환율들의 기준이 다시 잡히며, 금액이 다른 통화로 바뀌는 것은 아닙니다.',
  // filter-costs
  'help.guide.filter-costs.title': '지출 하나 또는 하루의 지출 찾기',
  'help.guide.filter-costs.goal': '긴 장부를 정말로 찾는 것까지 좁힙니다.',
  'help.guide.filter-costs.step.1': '목록 위의 “지출 검색…”에 입력합니다. 입력하는 대로 지출의 이름을 맞춰 찾습니다.',
  'help.guide.filter-costs.step.2':
    '“모든 카테고리”를 열면 열네 개의 카테고리가 나옵니다. 하나를 고르면 그 카테고리의 지출만 남습니다.',
  'help.guide.filter-costs.step.3':
    '“모든 날짜”에는 무언가를 쓴 날이 모두 나옵니다. 하나를 고르면 날짜 머리글 대신 배너가 나와 그 날짜와 그 안의 지출 건수와 합계를 보여줍니다.',
  'help.guide.filter-costs.step.4':
    '“전체” / “내가 지불” / “받을 돈” 전환은 장부를 보는 나만의 시야입니다. 내가 돈을 낸 것과, 아직 돌려받지 못한 것이 보입니다.',
  'help.guide.filter-costs.step.5':
    '줄 끝의 “CSV 내보내기”는 모든 지출을 파일로 씁니다. 원래 금액과 그 통화, 환산된 금액이 함께 들어갑니다.',
  'help.guide.filter-costs.result': '필터는 서로 겹쳐 적용되고, 날짜 묶음은 남은 것만으로 각자의 합계를 다시 그립니다.',
  'help.guide.filter-costs.tip.1':
    '기록된 결제에는 이름도 카테고리도 없어서 검색이나 카테고리 필터로는 가려집니다. 날짜 필터는 결제가 기록된 날짜 아래에 그대로 둡니다.',
  'help.guide.filter-costs.tip.2':
    '“CSV 내보내기”는 화면에서 무엇을 걸러 놓았든 언제나 모든 지출을 지출 하나당 한 줄로 내보냅니다.',
  // settle-up
  'help.guide.settle-up.title': '누가 누구에게 줄지 계산하고 정산하기',
  'help.guide.settle-up.goal':
    '쌓인 공동 지출을 모두가 셈이 맞는 가장 적은 수의 송금으로 바꾸고, 실제로 오갈 때마다 기록합니다.',
  'help.guide.settle-up.step.1':
    '오른쪽 열의 “정산하기” 카드에는 모두를 셈이 맞게 만드는 송금이 나열됩니다. 누가 누구에게 얼마를 내는지입니다. 제목 옆의 숫자는 아직 열려 있는 건수입니다.',
  'help.guide.settle-up.step.2':
    '송금 옆의 “정산”은 그것을 완료로 기록합니다. 그 흐름은 카드에서 사라지고 잔액이 다시 그려집니다.',
  'help.guide.settle-up.step.3':
    '기록된 송금은 장부의 한 줄이 되어 실제로 오간 날짜 아래에 “결제” 표시와 두 여행자, 금액과 함께 놓입니다.',
  'help.guide.settle-up.step.4':
    '그 줄 옆에서 연필은 결제를 고치고 “실행 취소”는 되돌립니다. 되돌리면 송금은 “정산하기” 카드로 돌아갑니다.',
  'help.guide.settle-up.step.5':
    '카드 머리의 “결제 추가”는 제안을 따르지 않은 송금을 기록합니다. “보낸 사람”과 “받는 사람”, 금액과 그 통화, 그리고 오간 날짜를 고릅니다.',
  'help.guide.settle-up.step.6':
    '화면 맨 위 머리글의 “정산하기”는 열려 있는 송금을 한 번에 모두 기록합니다. 여행이 끝날 때 다 같이 셈을 맞추는 방식입니다.',
  'help.guide.settle-up.result':
    '기록된 송금은 모두 장부의 한 줄이 되고 “정산하기” 카드에서는 한 줄이 빠집니다. 카드에 “모두 정산 완료”라고 나오면 여행의 셈은 끝난 것입니다.',
  'help.guide.settle-up.tip.1':
    '카드는 모든 빚이 아니라 가장 적은 송금을 보여줍니다. 세 사람이 고리처럼 서로 빚지고 있으면 한두 번의 결제로 줄어듭니다.',
  'help.guide.settle-up.tip.2':
    '“정산”은 송금을 기록할 뿐 돈을 옮기지는 않습니다. 평소 쓰는 방법으로 보낸 다음에 클릭하세요.',
  'help.guide.settle-up.tip.3':
    '결제는 어떤 통화로든 할 수 있어서, 엔화 빚을 유로로 갚는 것도 보통입니다. 대화 상자에는 자체 통화 선택기가 있고 그 환율도 고정합니다.',
  // final-budget
  'help.guide.final-budget.title': '여행이 여행자마다 얼마가 들었는지 보기',
  'help.guide.final-budget.goal': '장부의 한 사람 쪽을 읽습니다. 오늘의 잔액과 한 사람당 실제 비용입니다.',
  'help.guide.final-budget.step.1':
    '“잔액”은 여행자마다의 위치를 보여줍니다. 여행이 그 사람에게 줄 돈이 있으면 오른쪽으로 초록 막대가, 그 사람이 낼 돈이 있으면 왼쪽으로 빨간 막대가 뻗고, 이름 옆에 금액이 붙습니다.',
  'help.guide.final-budget.step.2':
    '그 아래의 “최종 부담액”은 다른 질문에 답합니다. 지금 누가 무엇을 지고 있는지가 아니라, 모든 것이 되돌려진 뒤 여행이 여행자마다 얼마가 되는지입니다.',
  'help.guide.final-budget.step.3':
    '이름을 클릭하면 계산이 열립니다. “지불한 지출”, 그 아래에 “정산 (순액)”과 “미정산 금액”이 있습니다.',
  'help.guide.final-budget.step.4':
    '각 줄 아래에는 그 줄을 이루는 항목이 놓입니다. 그 여행자가 지불한 지출, 이미 기록된 송금, 그리고 아직 열려 있는 송금입니다. 이들의 합은 위의 줄과 정확히 맞습니다.',
  'help.guide.final-budget.result':
    '“잔액”은 오늘 누가 더 냈고 덜 냈는지이고, “최종 부담액”은 모든 것이 되돌려진 뒤 여행이 여러분 각자에게 결국 얼마가 되는지입니다.',
  'help.guide.final-budget.tip.1':
    '결제를 기록해도 누구의 최종 부담액도 달라지지 않습니다. 금액이 미정산 금액에서 정산 (순액)으로 옮겨질 뿐입니다.',
  'help.guide.final-budget.tip.2':
    '지불자가 없는 지출은 정산 제안에서 빠지는 것과 마찬가지로 두 카드 어디에도 들어가지 않습니다.',
  // expense-from-booking
  'help.guide.expense-from-booking.title': '예약을 지출로 바꾸기',
  'help.guide.expense-from-booking.goal': '항공편이나 숙소, 장소에 실제로 든 비용을 그것이 속한 기록에 붙입니다.',
  'help.guide.expense-from-booking.step.1': '교통 탭이나 예약 탭에서 예약을 열고 연필을 클릭합니다.',
  'help.guide.expense-from-booking.step.2':
    '양식 맨 아래의 “비용” 블록까지 스크롤합니다. 예약을 먼저 저장하는 “지출 만들기”와, 이미 “비용”에 있는 지출을 위한 “기존 지출 연결”을 내줍니다.',
  'help.guide.expense-from-booking.step.3':
    '“지출 만들기”를 클릭합니다. 예약이 저장되고 양식이 닫히며, 예약의 제목이 이름으로 들어가고 종류에 맞는 카테고리가 이미 붙은 채로 비용 편집기가 열립니다.',
  'help.guide.expense-from-booking.step.4':
    '다른 지출과 마찬가지로 금액과 그 통화, 누가 냈는지와 분할을 채우고 저장합니다. 예약을 다시 열면 “연결된 지출” 아래에 그것이 보이고, 편집할 연필, 연결만 풀 “연결 해제, 지출은 유지”, 삭제할 휴지통이 함께 있습니다.',
  'help.guide.expense-from-booking.result':
    '예약은 자기 비용을 지니게 되고, 지출은 비용 탭의 평범한 한 줄이 됩니다. 다른 지출처럼 지불자와 분할과 통화를 가집니다.',
  'help.guide.expense-from-booking.tip.1':
    '예약을 삭제하면 연결된 지출도 함께 삭제됩니다. 예약의 “비용” 블록에 있는 “지출 삭제”는 그 반대로, 지출은 사라지고 예약은 남습니다. “연결 해제, 지출은 유지”는 둘 다 남깁니다.',
  'help.guide.expense-from-booking.tip.2': '장소의 양식에도 같은 블록이 있고, “지출 만들기”가 장소를 먼저 저장합니다.',

  // ── Screen: trip-transports ───────────────────────────────────────────────────────────
  'help.ctx.trip-transports.title': '교통',
  'help.ctx.trip-transports.summary':
    '장소와 장소 사이를 오가게 해 주는 모든 것입니다. 항공, 기차, 버스, 차량, 택시, 자전거, 크루즈, 페리, 그리고 TREK이 대신 찾아 주는 대중교통 연결편까지. 탭은 그 목록이고, 계획 위에서도 만들고 읽으며, 지도에도 그려집니다.',
  'help.ctx.trip-transports.bullet.1':
    '탭에는 이동만 담깁니다. 숙소, 식당, 행사, 티켓은 “예약”에 있으므로 같은 항목이 두 번 나오는 일은 없습니다.',
  'help.ctx.trip-transports.bullet.2':
    '도구 모음은 “전체”에서 모두를 세고, 쓰이고 있는 유형마다 자기 개수를 가진 칩을 줍니다. “항공”, “기차”, “차량”, “대중교통”입니다. 오른쪽의 “교통”은 손으로 하나를 추가합니다.',
  'help.ctx.trip-transports.bullet.3':
    '카드는 세 묶음으로 나오고, 각각 제목에서 접을 수 있습니다. 검색이 계획한 연결편의 “자동 대중교통”, 다음 “대기 중”, 다음 “확정됨”입니다.',
  'help.ctx.trip-transports.bullet.4':
    '카드는 상태, 유형, 걸쳐 있는 날짜, 시간, “예약 코드”, 경로, 그리고 “항공사”와 “항공편 번호”, 또는 “열차 번호”, “플랫폼”, “좌석”을 담습니다. 연필이 카드를 열고, 휴지통은 물음을 거친 뒤 삭제합니다.',
  'help.ctx.trip-transports.bullet.5':
    '교통은 계획 위에서도 만듭니다. 모든 날짜 머리글에 “교통 추가”의 +와 “대중교통”의 트램 버튼이 있고, 두 장소 사이의 이동 시간 연결선은 그 구간만을 위한 같은 검색을 엽니다.',
  'help.ctx.trip-transports.bullet.6':
    '양쪽 끝이 정해진 교통은 지도에 선을 그립니다. 일정의 그 행에 있는 경로 아이콘이 그 선을 켜고, 날짜들 위 도구 모음의 “모든 예약 경로 표시”는 여행 전체를 뒤집습니다.',
  // transports-list
  'help.guide.transports-list.title': '“교통” 탭 읽기',
  'help.guide.transports-list.goal': '무엇인가를 바꾸기 전에 목록이 무엇을 말해 주는지 알아 둡니다.',
  'help.guide.transports-list.step.1':
    '“교통”은 여행의 두 번째 탭입니다. 이동만 담기고, 호텔, 식당, 행사, 티켓은 “예약”에 있습니다.',
  'help.guide.transports-list.step.2':
    '도구 모음은 모든 교통을 “전체”에서 세고, 쓰이고 있는 유형마다 자기 개수를 가진 칩을 줍니다. 칩을 클릭하면 그 유형만 남고, 다시 클릭하면 풀립니다. 여러 칩을 한꺼번에 켤 수 있고, “전체”가 그것들을 지웁니다.',
  'help.guide.transports-list.step.3':
    '“자동 대중교통”은 그 자체로 하나의 묶음이며, 대중교통 검색이 계획한 연결편입니다. “대기 중”과 “확정됨”에는 손으로 넣은 것이 모두 들어갑니다. 제목 옆의 화살표가 묶음을 접습니다.',
  'help.guide.transports-list.step.4':
    '카드가 모든 것을 말해 줍니다. “대기 중” 또는 “확정됨”의 상태 점, 유형, 걸쳐 있는 날들과 그 날짜, 시간, “예약 코드”, 경로, 그리고 “항공사”와 “항공편 번호”, 또는 “열차 번호”, “플랫폼”, “좌석”입니다.',
  'help.guide.transports-list.step.5':
    '연필은 교통을 편집하려고 열고, 휴지통은 무엇이 사라지는지 알려 주는 물음 뒤에 그것을 삭제합니다.',
  'help.guide.transports-list.result':
    '목록은 찾던 것으로 좁혀지고, 모든 카드가 한눈에 그 이동이 예약되었는지 말해 줍니다.',
  'help.guide.transports-list.tip.1':
    '칩과 접어 둔 묶음은 여행별로 기억되므로, 탭은 떠날 때 모습 그대로 다시 열립니다.',
  'help.guide.transports-list.tip.2':
    '“파일에서 가져오기”와 AirTrail이 도구 모음의 “교통” 옆에 붙는 것은 서버가 예약 확인서를 읽을 수 있을 때, 그리고 AirTrail 인스턴스가 연결되어 있을 때뿐입니다. 그것이 없으면 목록은 손으로, 그리고 대중교통 검색으로 채워집니다.',
  // add-transport
  'help.guide.add-transport.title': '날짜에 교통 추가하기',
  'help.guide.add-transport.goal': '한 장소에서 다음 장소로 데려다주는 이동을, 그 이동이 일어나는 날짜에 넣습니다.',
  'help.guide.add-transport.step.1':
    '모든 날짜 머리글은 오른쪽에 작은 버튼 네 개를 답니다. 도구 설명에 “교통 추가”라고 나오는 +를 클릭합니다. 양식이 열리고 “날짜”는 이미 그 날짜로 맞춰져 있습니다.',
  'help.guide.add-transport.step.2':
    '“예약 유형”은 무엇을 타는지 고릅니다. “항공”, “기차”, “버스”, “차량”, “택시”, “자전거”, “크루즈”, “페리” 또는 “기타”입니다. 양식이 그에 따릅니다. 항공은 구간마다 공항을, 기차는 역의 연쇄를, 차량은 “픽업”과 “반납”이라는 표현과 “가는 길의 경유지”를 받습니다.',
  'help.guide.add-transport.step.3':
    '“제목”만이 반드시 채워야 하는 항목이며, 그것이 없으면 “추가”는 회색으로 남습니다. 승강장 안내판에서 알아볼 수 있는 것을 씁니다.',
  'help.guide.add-transport.step.4':
    '“출발”과 “도착”은 역, 항구, 주소를 검색합니다. 최소 세 글자를 입력하고 목록에서 결과를 고릅니다. 입력만 한 이름은 좌표를 갖지 않으므로 지도에 아무것도 그리지 않습니다.',
  'help.guide.add-transport.step.5':
    '“날짜”와 “시작 시간”은 언제 운행하는지를, “종료 날짜”와 “종료 시간”은 언제 끝나는지를 말합니다. 다음 날 도착하는 이동은 끝에 다음 날을 가져갑니다. “예약 코드”, “대기 중” 또는 “확정됨”이 들어가는 “상태”, “메모”는 선택 사항입니다.',
  'help.guide.add-transport.step.6': '“추가”를 클릭합니다.',
  'help.guide.add-transport.result':
    '교통은 그 날짜의 한 행이 되어 장소들 사이 제 시간에 놓이고, “교통” 탭에서는 “대기 중” 또는 “확정됨” 아래의 카드가 됩니다.',
  'help.guide.add-transport.tip.1':
    '행은 시작 시간이 정하는 자리, 곧 그보다 일찍 시작하는 마지막 장소 뒤에 놓입니다. 손잡이로 그 날짜 안 어디로든, 또는 다른 날짜로 끌 수 있습니다.',
  'help.guide.add-transport.tip.2':
    '“파일” 아래의 “파일 첨부”가 승차권을 받고, “비용” 아래의 “지출 만들기”는 예약을 저장하고 운임을 위해 “비용” 편집기를 엽니다.',
  'help.guide.add-transport.tip.3':
    '“동행자”는 이 이동에 누가 타는지를 표시합니다. 교통 하나에 동행자가 생기자마자 탭의 도구 모음에 그들의 아바타가 늘어나고, 그것으로 목록을 거릅니다.',
  // plan-transit
  'help.guide.plan-transit.title': '대중교통 연결편 계획하기',
  'help.guide.plan-transit.goal':
    '하루의 두 지점 사이를 다니는 실제 기차와 버스를 TREK이 찾게 하고, 고른 것을 계획에 넣습니다.',
  'help.guide.plan-transit.step.1': '날짜 머리글에서 트램 버튼, “대중교통”을 클릭합니다. 그 날짜의 검색이 열립니다.',
  'help.guide.plan-transit.step.2':
    '“출발”과 “도착”은 정류장이나 역을 받습니다. 칸이 아직 비어 있으면 그날 자체의 장소들과 여행의 숙소가 제시되고, 두 글자를 입력하면 대신 시간표의 역을 검색합니다. 두 칸 사이의 “출발지·도착지 교체”는 연결편의 방향을 뒤집습니다.',
  'help.guide.plan-transit.step.3':
    '“출발 시각” 또는 “도착 시각”에 시간을 넣어 언제 이동하고 싶은지 말하고, “최적 경로”, “환승 최소”, “도보 최소”가 답을 어떤 순서로 낼지 말합니다.',
  'help.guide.plan-transit.step.4':
    '아래의 칩은 어떤 수단을 써도 되는지 말합니다. “기차”, “지하철”, “트램”, “버스”, “여객선”, “케이블카”입니다. 하나를 끄면 빠지고, 적어도 하나는 켜진 채로 남습니다. 그런 다음 “검색”을 클릭합니다.',
  'help.guide.plan-transit.step.5':
    '각 결과는 출발과 도착, 얼마나 걸리는지, 환승이 몇 번인지, 도보가 얼마나 되는지, 그리고 각 노선을 저마다의 색으로 보여 줍니다. 하나를 클릭하면 정류장 하나하나로 펼쳐지고, 승강장과 노선 사이의 도보도 나옵니다.',
  'help.guide.plan-transit.step.6': '“일정에 추가”를 클릭합니다.',
  'help.guide.plan-transit.result':
    '연결편은 노선, 환승, 도보 시간과 함께 그 날짜의 한 행이 되고, “교통” 탭에서는 “자동 대중교통” 아래의 카드가 됩니다.',
  'help.guide.plan-transit.tip.1':
    '연결편은 Transitous에서 옵니다. 공개 시간표 데이터 위에 선 무료 커뮤니티 서비스로, 키도 계정도 필요 없습니다. 관리자는 검색을 대신 Google로 돌릴 수 있습니다.',
  'help.guide.plan-transit.tip.2':
    '아무것도 찾지 못했나요? 피드는 한 지역과 한 기간을 덮습니다. 다른 시간을 시도하거나, 수단을 더 켜거나, 장소 자체가 아니라 역을 고르세요. 메시지는 답한 서비스의 이름을 알려 줍니다.',
  'help.guide.plan-transit.tip.3':
    '같은 검색이 한 구간만을 위해서도 열립니다. 두 장소 사이의 이동 시간 연결선을 클릭하고 “대중교통”을 고릅니다. “출발”, “도착”과 출발 시간은 미리 채워집니다.',
  // change-transit-route
  'help.guide.change-transit-route.title': '계획된 연결편 열고 바꾸기',
  'help.guide.change-transit-route.goal': '연결편을 정류장 하나하나로 읽고, 이름을 바꾸거나, 경로를 다시 찾습니다.',
  'help.guide.change-transit-route.step.1':
    '“교통” 탭에서 계획된 연결편은 “자동 대중교통” 아래에 있습니다. 카드를 클릭합니다.',
  'help.guide.change-transit-route.step.2':
    '위에 “소요 시간”, “환승”, “도보”가 있습니다. 그 아래의 “여정”이 연결편을 정류장 하나하나로 훑고, 승강장과 노선 사이의 도보도 보여 줍니다.',
  'help.guide.change-transit-route.step.3':
    '“경로 변경”은 검색을 다시 실행합니다. 이 연결편의 양쪽 끝과 날짜는 이미 채워져 있습니다.',
  'help.guide.change-transit-route.step.4':
    '다른 연결편을 골라 “일정에 추가”를 클릭하면 옛것의 자리를 대신합니다. “경로 변경” 옆의 “세부 정보 편집”은 대신 보통의 교통 양식을 열고, 거기에 “예약 코드”, “상태”, 동행자, 파일이 있습니다.',
  'help.guide.change-transit-route.result':
    '그 경로는 새 여정을 담고, “교통” 탭의 카드는 새 노선과 시간을 보여 줍니다.',
  'help.guide.change-transit-route.tip.1':
    '경로의 제목은 글자일 뿐입니다. 옆의 연필은 경로를 건드리지 않고 이름만 바꿉니다. 아래의 “메모”는 markdown을 받고 “편집”과 “미리보기” 탭이 있습니다.',
  'help.guide.change-transit-route.tip.2':
    '경로 맨 아래의 “삭제”는 그 연결편을 여행에서 빼냅니다. 날짜는 장소들을 그대로 지킵니다.',
  // leg-travel-mode
  'help.guide.leg-travel-mode.title': '한 구간의 이동 방법 바꾸기',
  'help.guide.leg-travel-mode.goal':
    '나머지는 차로 가는 하루에서 한 구간만 걷거나, 그 구간을 대중교통 검색에 넘깁니다.',
  'help.guide.leg-travel-mode.step.1':
    '장소 사이의 연결선은 그날의 경로를 켜야 비로소 나타납니다. 날짜를 클릭해 열고, 장소들 아래의 “경로”를 누릅니다.',
  'help.guide.leg-travel-mode.step.2':
    '각 연결선은 그 구간의 이동 시간과 거리를 알려 주고, 경로를 계산한 수단의 아이콘을 답니다. 자동차면 차, 도보면 발입니다.',
  'help.guide.leg-travel-mode.step.3':
    '연결선을 클릭합니다. 메뉴는 “자동차”와 “도보”, “대중교통”, “하루 기본값 사용”을 내놓습니다.',
  'help.guide.leg-travel-mode.step.4': '“도보”를 고릅니다. 이 구간만 바뀌고, 그날의 나머지는 자기 수단을 지킵니다.',
  'help.guide.leg-travel-mode.result':
    '구간은 발 아이콘과 도보 시간을 보여 주고, 그날의 다른 구간들은 그날의 수단을 지킵니다.',
  'help.guide.leg-travel-mode.tip.1':
    '수단은 하루가 아니라 구간의 것입니다. 하루 전체의 “자동차”와 “도보” 버튼은 손으로 정한 구간을 결코 덮어쓰지 않습니다. “하루 기본값 사용”이 구간을 그 버튼들에 돌려줍니다.',
  'help.guide.leg-travel-mode.tip.2':
    '같은 메뉴의 “대중교통”은 바로 이 구간을 위한 연결편 검색을 열고, 양쪽 끝과 출발 시간은 이미 채워져 있습니다.',
  'help.guide.leg-travel-mode.tip.3':
    '시간은 실제 도로와 보행로 위에서 도는 공개 경로 계산기에서 옵니다. 답하지 못하는 구간은 직선을 그대로 두고 시간을 보여 주지 않습니다.',
  // edit-transport
  'help.guide.edit-transport.title': '교통 바꾸기 또는 삭제하기',
  'help.guide.edit-transport.goal': '시간, 플랫폼, 예약 코드를 고치거나, 그 이동을 여행에서 빼냅니다.',
  'help.guide.edit-transport.step.1': '일정에서 교통은 장소들 사이의 색 있는 행입니다. 그 행을 클릭합니다.',
  'help.guide.edit-transport.step.2':
    '양식은 그것을 만든 바로 그 양식이며, 제목 표시줄에 “교통 편집”이 나옵니다. 모두 바꿀 수 있습니다. 유형, 경로, 날짜와 시간, “예약 코드”, “상태”입니다.',
  'help.guide.edit-transport.step.3':
    '항공의 경로는 공항의 연쇄이고, 기차의 경로는 역의 연쇄입니다. “경유지 추가”가 그 사이에 하나를 더 넣고, 각 구간은 자기 시간과 자기 항공편 번호 또는 열차 번호를 지킵니다.',
  'help.guide.edit-transport.step.4':
    '“업데이트”를 클릭합니다. 교통을 아주 없애려면 “교통” 탭의 그 카드에 있는 휴지통을 쓰고 확인합니다.',
  'help.guide.edit-transport.result':
    '변경은 교통이 나타나는 모든 곳에 보입니다. “교통” 탭, 그것이 운행하는 날짜, 그리고 지도 위의 선입니다.',
  'help.guide.edit-transport.tip.1':
    '같은 양식이 양쪽에서 열립니다. “교통” 탭 카드의 연필과, 일정에 있는 교통 자신의 행입니다. 계획된 대중교통 연결편만 예외로, 그 행은 경로 화면을 열고 거기의 “세부 정보 편집”이 이 양식으로 이어집니다.',
  'help.guide.edit-transport.tip.2':
    '교통을 다른 날짜로 옮기는 데에는 양식이 전혀 필요 없습니다. 행을 한 날짜 카드에서 다음 카드로 끕니다.',
  // transport-on-map
  'help.guide.transport-on-map.title': '교통을 지도에 그리기',
  'help.guide.transport-on-map.goal': '항공편, 자동차 주행, 연결편이 실제로 어디를 지나는지 봅니다.',
  'help.guide.transport-on-map.step.1':
    '양쪽 끝이 정해진 교통은 일정의 그 행에 작은 경로 아이콘을 답니다. 그것을 클릭하면 이름표가 “예약 경로 숨기기”로 바뀝니다.',
  'help.guide.transport-on-map.step.2':
    '경로가 지도에 그려지고, 양쪽 끝에 교통의 아이콘을 단 알약 모양 표식이 붙습니다.',
  'help.guide.transport-on-map.step.3':
    '끝의 표식을 클릭하면 지도를 떠나지 않고 예약을 읽을 수 있습니다. 시간, “항공사”와 “항공편 번호”, “예약 코드”, 그리고 주소입니다. “닫기”가 시트를 치웁니다.',
  'help.guide.transport-on-map.step.4':
    '날짜들 위 도구 모음의 경로 아이콘은 여행 전체를 한 번에 다룹니다. “모든 예약 경로 표시”, 그리고 다시 지우려면 “모든 예약 경로 숨기기”입니다.',
  'help.guide.transport-on-map.step.5':
    '계획된 대중교통 연결편은 자기 아이콘이 없습니다. 그날의 “경로” 토글로 그려지므로, 그날의 경로가 켜져 있는 동안에는 “모든 예약 경로 숨기기”로도 지워지지 않습니다.',
  'help.guide.transport-on-map.result': '경로들은 양쪽 끝에 표식을 달고 지도에 남아, 다시 끌 때까지 그대로 있습니다.',
  'help.guide.transport-on-map.tip.1':
    '항공, 크루즈, 페리는 곡선으로 그려지고, 차량, 버스, 택시, 자전거는 실제 도로를 따르며, 기차나 계획된 연결편은 들르는 역들을 지나갑니다.',
  'help.guide.transport-on-map.tip.2':
    '“확정됨”인 예약은 실선, “대기 중”인 예약은 점선입니다. “예약 경로 레이블” 설정은 공항 코드나 역 이름을 끝 표식 안에 새깁니다.',
  'help.guide.transport-on-map.tip.3':
    '“모든 예약 경로 표시”는 층이 아니라 백지에서 다시 시작하는 것입니다. 개별 아이콘이 정해 둔 것을 버리므로, 두 번 누르면 전부 켜짐이거나 전부 꺼짐으로 남습니다.',
  // import-transport-file
  'help.guide.import-transport-file.title': 'e티켓에서 항공편 읽어 오기',
  'help.guide.import-transport-file.goal':
    '운송사가 보낸 티켓에서 TREK이 항공편, 기차, 페리를 끌어내게 하고, 저장하기 전에 확인합니다.',
  'help.guide.import-transport-file.step.1':
    '“교통” 탭 도구 모음의 “교통” 옆에 있는 “파일에서 가져오기”를 클릭합니다. “예약” 탭과 같은 대화 상자인 “예약 확인서 가져오기”가 열립니다.',
  'help.guide.import-transport-file.step.2':
    '티켓을 상자에 끌어다 놓거나, 상자를 클릭해 고릅니다. EML, PDF, PKPass, HTML, TXT를 쓸 수 있고, 파일당 10 MB로 최대 5개입니다. 고른 파일의 이름이 상자에 적힙니다.',
  'help.guide.import-transport-file.step.3':
    '“가져오기”를 클릭합니다. 대화 상자는 곧바로 닫히고, 읽는 일은 뒤에서 일어납니다.',
  'help.guide.import-transport-file.step.4':
    '오른쪽 아래의 카드가 파일 이름 아래에서 진행 상황을 알립니다. 읽기가 끝나면 “파일 분석 중…”이 체크 표시로 바뀌고, 카드가 “가져오기”를 내어 줍니다. 그것을 클릭합니다.',
  'help.guide.import-transport-file.step.5':
    '항공편이 “교통 추가”에 이미 채워진 채로 열립니다. “예약 유형”은 “항공”, “제목”에 항공사와 항공편 번호, “경로” 아래에 “출발”과 “도착”의 두 공항과 그 시간과 시간대, “항공사”와 “항공편 번호”, “예약 코드”, 그리고 “파일” 아래에 티켓입니다. 확인하고 “추가”를 클릭합니다.',
  'help.guide.import-transport-file.result':
    '항공편은 “교통” 탭의 “대기 중”에 카드로, 출발하는 날짜에 행으로 들어가고, “파일” 아래에 티켓이 있으며, 두 공항을 모두 알면 지도에 곡선을 그립니다.',
  'help.guide.import-transport-file.tip.1':
    '두 탭은 가져오기 하나를 함께 씁니다. 항공편과 호텔이 담긴 파일은 어느 탭에서 시작했든 항공편을 “교통 추가”에, 호텔을 “새 예약”에 차례로 엽니다.',
  'help.guide.import-transport-file.tip.2':
    '공항은 코드로 자리를 잡습니다. 읽기가 위치를 찾지 못한 역이나 항구는 카드에 호박색으로 적힙니다. “추가”를 클릭하기 전에 “경로” 아래에서 손으로 고르세요. 그러지 않으면 그 교통은 지도에 아무것도 그리지 않습니다.',
  // airtrail-import
  'help.guide.airtrail-import.title': 'AirTrail에서 항공편 가져오기',
  'help.guide.airtrail-import.goal':
    'AirTrail에 이미 두고 있는 항공편을 한 번에 여행으로 들여오고, 그때부터 AirTrail을 따르게 합니다.',
  'help.guide.airtrail-import.step.1':
    'AirTrail 애드온이 켜져 있고 “설정”의 “통합”에서 인스턴스가 연결되어 있으면, “교통” 탭의 도구 모음에 “교통” 옆으로 “AirTrail” 버튼이 있습니다. 클릭합니다.',
  'help.guide.airtrail-import.step.2':
    '“AirTrail에서 가져오기”는 계정의 항공편을 두 묶음으로 나열합니다. “이 여행 기간”에는 여행 안의 날짜인 것들이 이미 체크된 채로 있고, “기타 항공편”에는 나머지가 체크되지 않은 채로 있습니다. 이미 여행에 있는 항공편은 회색으로 흐려지고 “가져옴”으로 표시됩니다.',
  'help.guide.airtrail-import.step.3':
    '각 행은 항공사와 항공편 번호, 두 공항, 날짜가 있는 체크 상자입니다. 행을 클릭해 항공편을 넣거나 뺍니다. “기타 항공편” 아래의 것은 체크할 때만 들어옵니다.',
  'help.guide.airtrail-import.step.4':
    '이어지는 항공편, 즉 각각 앞 항공편이 착륙한 공항에서 하루 안에 출발하는 것들은 함께 테두리로 묶입니다. 그 아래의 체크, 그 공항 이름이 들어간 “… 경유 항공편 하나로 가져오기”는 이미 켜져 있습니다. 경유가 있는 예약 하나로 두려면 켠 채로 두고, 구간을 따로따로 항공편으로 가져오려면 끕니다.',
  'help.guide.airtrail-import.step.5':
    '“가져오기”를 클릭합니다. 버튼은 체크된 항공편을 세고, 뒤이은 메시지가 몇 개가 들어왔는지 알립니다.',
  'help.guide.airtrail-import.step.6':
    '항공편은 “확정됨” 아래의 카드가 되어 저마다 상태 옆에 파란 AirTrail 배지를 달고, 운항하는 날짜의 행이 됩니다. 묶인 연결편은 카드 하나이고, 경로는 경유지를 지나갑니다.',
  'help.guide.airtrail-import.result':
    'AirTrail에서 온 항공편은 “교통” 탭의 카드이자 해당 날짜의 행이고, 저마다 어디서 왔는지 말해 주는 AirTrail 배지를 달고 있습니다.',
  'help.guide.airtrail-import.tip.1':
    '같은 번호와 날짜로 이미 여행에 있는 항공편은 건너뛰고, 메시지가 몇 개였는지 알립니다. 일자 위 도구 모음의 “실행 취소”가 가져오기 전체를 되돌립니다.',
  'help.guide.airtrail-import.tip.2':
    'AirTrail이 계속 기준입니다. TREK은 여행을 열 때와 뒤에서 몇 분마다 그 변경을 읽습니다. 그쪽에서 삭제된 항공편은 카드를 유지하고 배지는 “동기화되지 않음”으로 바뀝니다. TREK에서 한 편집은 “통합”에서 “변경 사항을 AirTrail에 다시 기록”이 켜져 있을 때만 되돌아갑니다.',
  'help.guide.airtrail-import.tip.3':
    '묶인 연결편에는 따를 단일 AirTrail 항공편이 없으므로 한 번뿐인 가져오기입니다. 파란 배지는 유지되고, 배지에 마우스를 올리면 그렇게 말해 줍니다. 동기화된 항공편에 손으로 경유지를 주어도 같은 일이 일어납니다.',

  // ── Screen: trip-roadtrip ─────────────────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': '로드트립',
  'help.ctx.trip-roadtrip.summary':
    '계획을 하나의 주행으로 읽는 곳입니다. 같은 날짜와 같은 장소가 그 사이의 주행과 함께 경유지로 이어져, 왼쪽 열을 따라 내려가는 주행 목록과 지도에 놓입니다. 얼마나 멀고 얼마나 오래 걸리는지, 연료가 어디서 떨어지는지, 길가에 무엇이 있는지를 알려 줍니다.',
  'help.ctx.trip-roadtrip.bullet.1':
    '왼쪽 열 맨 위의 “일자별”과 “로드트립”이 일별 계획과 주행 사이를 전환합니다. 아무것도 복사되지 않고 아무것도 바뀌지 않습니다. “일자별”은 계획을 있던 그대로 되돌려 줍니다.',
  'help.ctx.trip-roadtrip.bullet.2':
    '주행 목록의 머리는 여행 전체를 합산합니다. “거리”, “운전 시간”, “경유지”입니다. 그 아래에는 하루에 카드 하나씩 놓이고, 그 날의 거리, 몇 곳을 위한 날인지, 무엇을 넘겼는지, 그리고 “트랙” 배지가 들어 있습니다.',
  'help.ctx.trip-roadtrip.bullet.3':
    '번호가 붙은 경유지는 그 날이 향하는 장소입니다. 주유, 충전, 휴게소 같은 중간 정차는 번호 대신 그 종류의 아이콘을 달고 수에 들어가지 않습니다. 번호를 클릭하면 어떤 것인지 바꾸고, “체류” 배지를 클릭하면 얼마나 걸리는지 정합니다.',
  'help.ctx.trip-roadtrip.bullet.4':
    '두 경유지 사이에서 주행 띠가 그 구간을 거리와 시간으로 보여 줍니다. 클릭하면 “이 구간을 가는 방법”이 열리고, 지도에 그려진 경로를 클릭하면 경유 지점을 거쳐 구간을 휘게 할 수 있습니다.',
  'help.ctx.trip-roadtrip.bullet.5':
    '오른쪽 열은 “경로 주변”이 됩니다. 날짜와 찾을 항목과 반경을 고른 다음 “검색”을 누릅니다. “추가”는 실제로 지나가는 지점에 결과를 주행 위에 놓습니다.',
  'help.ctx.trip-roadtrip.bullet.6':
    '그 아래의 “주행 설정”에는 한도, 차와 주행거리, 일일 이동 시간, 피할 것, 선을 그리는 방식이 들어 있습니다. 이것들은 여행에 속하므로 모두가 같은 차로 계획합니다.',
  // roadtrip-mode
  'help.guide.roadtrip-mode.title': '여행을 하나의 주행으로 읽기',
  'help.guide.roadtrip-mode.goal': '계획을 로드트립 모드로 바꾸고 주행 목록이 말해 주는 것을 읽습니다.',
  'help.guide.roadtrip-mode.step.1':
    '왼쪽 열 맨 위의 “일자별”과 “로드트립” 전환에서 “로드트립”을 클릭합니다. 일별 계획이 주행으로 바뀌고, 지도는 경로가 나온 모든 날을 그립니다.',
  'help.guide.roadtrip-mode.step.2': '주행 목록의 머리는 여행 전체를 합산합니다. “거리”, “운전 시간”, “경유지”입니다.',
  'help.guide.roadtrip-mode.step.3':
    '그 아래에는 하루에 카드 하나씩 놓입니다. 머리글에는 그 날의 번호와 날짜, 거리와 시간으로 나타낸 주행, 그리고 그 날이 몇 곳을 위한 날인지가 들어 있습니다.',
  'help.guide.roadtrip-mode.step.4':
    '카드 안에서 하루는 하나의 사슬입니다. 장소마다 번호가 붙은 경유지, 그 사이마다 주행 띠, 그리고 오른쪽 끝에 도착 시간입니다.',
  'help.guide.roadtrip-mode.step.5':
    '날짜의 머리글을 클릭하면 접힙니다. 접힌 날은 지도에서도 사라집니다. 머리글을 다시 클릭하면 돌아옵니다.',
  'help.guide.roadtrip-mode.result':
    '왼쪽 열은 주행이고 지도는 그 모든 날을 보여 줍니다. “일자별”은 곧바로 계획으로 되돌리며, 계획은 그대로입니다.',
  'help.guide.roadtrip-mode.tip.1':
    '이 선택은 브라우저 탭이 열려 있는 동안 여행마다 기억되므로, 새로 고쳐도 주행으로 돌아옵니다.',
  'help.guide.roadtrip-mode.tip.2':
    '이 전환은 관리자가 “관리자”의 “애드온”에서 “로드트립” 애드온을 켠 뒤에야 생깁니다.',
  'help.guide.roadtrip-mode.tip.3': '휴대폰에는 전환이 없습니다. 애드온이 “계획” 옆에 자체 “로드트립” 탭을 더합니다.',
  // roadtrip-stops
  'help.guide.roadtrip-stops.title': '중간 정차, 그리고 얼마나 머무는지',
  'help.guide.roadtrip-stops.goal': '주행 위의 장소를 중간 정차로 바꾸고, 정차마다 얼마나 걸리는지 정합니다.',
  'help.guide.roadtrip-stops.step.1':
    '주행 목록에서 경유지 앞의 번호를 클릭합니다. 이름은 “경유 정차로 변경”이고, “경유지 종류”가 열립니다.',
  'help.guide.roadtrip-stops.step.2':
    '종류를 고릅니다. “숙소”, “주유”, “충전”, “휴게소”, “캠핑장”, “식사”, “볼거리”입니다. 번호가 그 종류의 아이콘으로 바뀌고 아래의 경유지는 번호가 다시 매겨집니다.',
  'help.guide.roadtrip-stops.step.3': '중간 정차는 목적지가 아니므로 그 날의 머리글은 한 곳 적게 셉니다.',
  'help.guide.roadtrip-stops.step.4':
    '아이콘을 다시 클릭해 “정차 유형 변경”을 열고 “다시 목적지로”를 고르면 번호가 돌아옵니다.',
  'help.guide.roadtrip-stops.step.5':
    '모든 경유지에는 “체류” 배지가 있습니다. 클릭하면 “이 경유지 체류 시간”이 열립니다.',
  'help.guide.roadtrip-stops.step.6':
    '길이는 슬라이더로, 빼기와 더하기 버튼으로, 또는 미리 준비된 값 중 하나로 정하고, “도착”과 “출발”이 어떻게 바뀌는지 보고 “저장”을 클릭합니다.',
  'help.guide.roadtrip-stops.result':
    '시간을 정한 경유지는 “체류” 배지에 그 시각을 달고 그 뒤의 모든 도착 시간이 함께 움직였으며, 종류로 보냈다가 되돌린 경유지는 다시 번호가 붙은 목적지입니다.',
  'help.guide.roadtrip-stops.tip.1':
    '체류는 한 번의 방문이 아니라 장소에 속합니다. 이틀에 계획된 장소는 두 날 모두 같은 시간만큼 머뭅니다.',
  'help.guide.roadtrip-stops.tip.2':
    '중간 정차는 “일자별”에도 나옵니다. “주행 설정”의 “편의시설 경유지”에 있는 “일별 보기에도 표시”를 끄면 “로드트립”에만 남습니다.',
  'help.guide.roadtrip-stops.tip.3': '같은 대화상자의 “체류 없음”이 그 시간을 다시 없앱니다.',
  // roadtrip-corridor
  'help.guide.roadtrip-corridor.title': '경로를 따라 주유소, 음식, 잠자리 찾기',
  'help.guide.roadtrip-corridor.goal': '실제로 달리는 길을 검색하고, 찾은 것을 알맞은 구간에 놓습니다.',
  'help.guide.roadtrip-corridor.step.1': '“경로 주변” 맨 위에서 날짜를 고릅니다. 경로가 나온 날만 제시됩니다.',
  'help.guide.roadtrip-corridor.step.2':
    '“찾는 항목”에서 필요한 것을 체크합니다. “주유”, “충전”, “휴게소”, “캠핑장”, “숙소”, “식사”, “볼거리”를 함께 고를 수 있습니다.',
  'help.guide.roadtrip-corridor.step.3':
    '“반경”에서 길 양옆으로 얼마나 멀리 찾을지 2 km, 5 km, 10 km 중에 고르고 “검색”을 클릭합니다.',
  'help.guide.roadtrip-corridor.step.4':
    '결과는 종류별로 묶여 지나가는 순서대로 돌아오고, 각각 그 날의 어디쯤에 있는지와 경로에서 얼마나 떨어져 있는지가 붙습니다.',
  'help.guide.roadtrip-corridor.step.5':
    '결과의 “추가”는 “경유지로 추가”를 엽니다. 어느 날 몇 번째 자리에 들어가는지 알려 주고, 종류와 정차 시간을 묻고, “추가”가 주행에 올립니다.',
  'help.guide.roadtrip-corridor.result':
    '결과는 지나가는 순서대로 나열되어 지도에 그려지고, 추가한 것은 실제로 지나가는 지점에서 주행 위에 놓입니다.',
  'help.guide.roadtrip-corridor.tip.1':
    '“검색”을 누르기 전에는 아무것도 검색되지 않습니다. 한 번의 실행이 공유 서비스에 보내는 여러 요청이기 때문입니다.',
  'help.guide.roadtrip-corridor.tip.2':
    '“이름으로 필터”는 돌아온 결과를 다시 묻지 않고 좁히고, “결과 지우기”는 목록과 그 핀을 비웁니다. 결과를 클릭하면 지도에서 보입니다.',
  'help.guide.roadtrip-corridor.tip.3':
    '결과를 지도에서 그려진 경로 위로 끌어다 놓을 수도 있습니다. 같은 길을 두 번 달리는 곳에서 구간을 직접 고르는 방법입니다. “검색” 옆의 “직접 추가”는 대신 이름으로 장소를 찾습니다.',
  // roadtrip-via
  'help.guide.roadtrip-via.title': '경유 지점으로 구간 휘기',
  'help.guide.roadtrip-via.goal': '정차를 더하지 않고, 구간을 정말로 원하는 길로 보냅니다.',
  'help.guide.roadtrip-via.step.1':
    '원하는 구간을 화면에 띄웁니다. 주행 목록에서 경유지를 클릭한 다음, 지도 위에 열린 카드를 닫습니다.',
  'help.guide.roadtrip-via.step.2':
    '그려진 경로를 클릭합니다. 클릭한 구간에 경유 지점이 놓이고, 그 구간은 그곳을 거쳐 다시 경로가 계산됩니다.',
  'help.guide.roadtrip-via.step.3':
    '주행 목록이 따라옵니다. 그 날의 머리글에는 새 거리와 운전 시간이 들어가고, 경유 지점 뒤의 모든 도착 시간이 함께 움직입니다.',
  'help.guide.roadtrip-via.step.4':
    '손잡이에 커서를 올리면 무엇을 할 수 있는지 알려 줍니다. “끌어서 경로를 바꾸고, 오른쪽 클릭으로 삭제”입니다. 다른 곳으로 끌면 구간은 새 지점을 거쳐 다시 그려집니다.',
  'help.guide.roadtrip-via.step.5': '손잡이를 오른쪽 클릭하면 없어집니다. 구간은 다시 곧장 가는 길을 달립니다.',
  'help.guide.roadtrip-via.result': '구간은 고른 길을 따르고, 그 날의 거리와 운전 시간과 도착 시간이 다시 계산됩니다.',
  'help.guide.roadtrip-via.tip.1':
    '경유 지점은 들르는 곳이 아닙니다. 번호도 체류도 도착 시간도 없고, 그 날의 “경유지” 수에도 들어가지 않습니다.',
  'help.guide.roadtrip-via.tip.2': '손잡이는 확대 수준 9부터 그려지므로, 여행 전체에 맞춘 지도에서는 선만 보입니다.',
  'help.guide.roadtrip-via.tip.3':
    '그려진 어느 구간에서도 2킬로미터보다 멀리 떨어진 클릭은 무시되고, 항공편이나 기차나 여객선 위의 클릭도 마찬가지입니다.',
  // roadtrip-alternatives
  'help.guide.roadtrip-alternatives.title': '구간을 다르게 달려 보기',
  'help.guide.roadtrip-alternatives.goal': '한 구간에 대해 경로 엔진이 또 무엇을 제시하는지 보고 그것을 고릅니다.',
  'help.guide.roadtrip-alternatives.step.1':
    '주행 목록에서 주행 띠를 클릭합니다. 두 경유지 사이에서 구간을 거리와 시간으로 보여 주는 줄입니다. 이름은 “다른 경로”입니다.',
  'help.guide.roadtrip-alternatives.step.2':
    '“이 구간을 가는 방법”이 지도 위에 열립니다. 길마다 항목이 하나씩이고, 각각 지도에 자기 색으로 그려집니다.',
  'help.guide.roadtrip-alternatives.step.3':
    '항목에 커서를 올리면 그 길이 밝아집니다. “현재”는 지금 달리고 있는 길이고 “가장 빠름”은 제일 빠른 길이며, 나머지는 얼마나 더 느린지, 또는 어떤 도로 종류를 빼는지 알려 줍니다.',
  'help.guide.roadtrip-alternatives.step.4': '항목을 클릭하면 그 길로 달리고, “닫기”를 누르면 지금 길을 그대로 둡니다.',
  'help.guide.roadtrip-alternatives.result':
    '구간은 고른 길을 달리고, 주행 목록의 거리와 그 뒤의 도착 시간도 함께 바뀝니다.',
  'help.guide.roadtrip-alternatives.tip.1':
    '다른 길을 고르면 구간에 경유 지점이 놓이고 이미 있던 것은 대체됩니다. 경로 엔진 자신의 길을 고르면 그것들은 다시 없어집니다.',
  'help.guide.roadtrip-alternatives.tip.2':
    '“고속도로 제외”, “통행료 없음”, “페리 없음”은 자체 속도 모델을 가진 두 번째 엔진에서 나오므로, 그 시간은 나머지와 비교할 수 없습니다.',
  // roadtrip-limits
  'help.guide.roadtrip-limits.title': '차와 운전 한도 설정하기',
  'help.guide.roadtrip-limits.goal': '무엇으로 이동하는지, 한 번에 얼마나 오래 운전할 생각인지 TREK에 알려 줍니다.',
  'help.guide.roadtrip-limits.step.1':
    '“주행 설정”은 오른쪽 열의 검색 아래에 있습니다. 배지가 무엇이 설정되었는지 알려 주고, 클릭하면 열립니다.',
  'help.guide.roadtrip-limits.step.2':
    '“운전” 아래의 “연속 운전 최대”와 “하루 운전”은 분 단위입니다. 빈칸은 “끔”을 뜻하고, 아무것도 표시되지 않습니다.',
  'help.guide.roadtrip-limits.step.3':
    '“차량” 아래에서 무엇으로 이동하는지 정합니다. “연료”는 주유 정차에서만, “전기”는 충전 정차에서만, “둘 다”는 양쪽에서 채웁니다.',
  'help.guide.roadtrip-limits.step.4':
    '“1회 주유 주행거리”나 “한 번 충전 주행거리”는 직접 입력합니다. 그 아래의 “차량 데이터로 계산하기”는 “연료탱크”와 “소비량”, 또는 “배터리 용량”과 “소비량”을 받아 계산해 줍니다.',
  'help.guide.roadtrip-limits.step.5':
    '“가능하면 피하기”는 금지가 아니라 선호입니다. 우회로가 없는 날은 그래도 그 길을 쓰고, 머리글에서 그렇게 알려 줍니다.',
  'help.guide.roadtrip-limits.step.6':
    '대화상자를 닫습니다. 카드가 무엇이 설정되었는지 알려 주고, 주행 목록은 한도를 넘는 모든 구간과 모든 날에 표시를 남깁니다.',
  'help.guide.roadtrip-limits.result':
    '카드의 배지가 무엇이 설정되었는지 알려 주고, 한도를 넘은 구간과 날은 모두 주행 목록에서 배지를 답니다.',
  'help.guide.roadtrip-limits.tip.1': '설정은 여행에 속하므로, 참여한 모두가 같은 차와 같은 한도로 계획합니다.',
  'help.guide.roadtrip-limits.tip.2':
    '“충전 목표”는 정차에서 얼마나 채우는지 정합니다. 길 위에서 100 %까지 충전하는 사람은 없기 때문입니다. 주유나 충전 정차는 자기만 따로 정할 수 있습니다.',
  'help.guide.roadtrip-limits.tip.3':
    '“경로 선”은 주행을 어떻게 그릴지 정합니다. “날짜 잇기”는 두 날 사이의 밤을 경로로 잇고, “날짜별 색상”은 날마다 고유한 색을 줍니다.',
  // roadtrip-day-window
  'help.guide.roadtrip-day-window.title': '운전하는 하루에 시작과 끝 주기',
  'help.guide.roadtrip-day-window.goal': '직접 고른 시각에 운전을 멈추고, 하루가 어디서 끝나야 할지 정합니다.',
  'help.guide.roadtrip-day-window.step.1': '오른쪽 열에서 “주행 설정”을 열고 “일일 이동 시간”을 찾습니다.',
  'help.guide.roadtrip-day-window.step.2':
    '“하루 시작 시간”을 정합니다. 그것만으로는 아무 일도 없습니다. 아래 안내가 말하듯 두 시간이 모두 필요합니다.',
  'help.guide.roadtrip-day-window.step.3':
    '“하루 종료 시간”을 정합니다. 이제 주행은 그 시각에 멈추고 나머지를 다음 날 아침으로 넘기며, 주행 목록에 “하루 일정 종료” 줄과 “여행 계속” 줄이 생깁니다.',
  'help.guide.roadtrip-day-window.step.4':
    '“하루 종료 지점”에서, 종료 시각에 길 위에서 멈추는 “경로 중간”이나, 다음 주행이 그곳을 지나치기 전에 멈추는 “마지막 장소”를 고릅니다.',
  'help.guide.roadtrip-day-window.step.5': '대화상자를 닫습니다. “주행 설정” 카드가 두 시각을 배지로 답니다.',
  'help.guide.roadtrip-day-window.result':
    '주행은 정한 길이의 이동일로 잘리고, 들어가지 않는 것은 마지막 날 뒤의 계산된 날로 이어집니다. 내 날짜와 그 장소는 바뀌지 않습니다.',
  'help.guide.roadtrip-day-window.tip.1':
    '둘 중 한 시각을 비우면 전체가 다시 꺼집니다. 직접 경유지에 고정해 둔 시간은 언제나 우선합니다.',
  'help.guide.roadtrip-day-window.tip.2':
    '일일 이동 시간을 정하면 날은 언제나 이어집니다. 어떤 날의 마지막 경유지에서 다음 날 첫 경유지까지의 주행도 경로가 계산되고 수에 들어갑니다.',
  'help.guide.roadtrip-day-window.tip.3':
    '하루의 끝은 지도 위의 표시이기도 합니다. 날짜 번호가 붙은 달입니다. 경로를 따라, 또는 어떤 장소 위로 끌면 하루를 다른 곳에서 끝낼 수 있고, 오른쪽 클릭하면 자동 종료가 돌아오며, 이 대화상자의 “자동 하루 종료 복원”은 전부 되돌립니다.',
  // roadtrip-refuel
  'help.guide.roadtrip-refuel.title': '연료가 떨어지기 전에 채우기',
  'help.guide.roadtrip-refuel.goal': '차가 아직 갈 수 있는 구간에서 연료를 채울 곳을 찾아 주행에 올립니다.',
  'help.guide.roadtrip-refuel.step.1':
    '주행거리를 정해 두면, 주행 목록은 연료가 떨어지는 구간에 띠를 그립니다. “여기서 연료 소진”, 그리고 그 아래에 구간의 어디쯤인지가 나옵니다.',
  'help.guide.roadtrip-refuel.step.2':
    '띠 위의 등이 버튼입니다. “주유소 찾기”는 이미 달려 온 길을 따라 찾고, 찾는 동안에는 “경로를 따라 찾는 중…”이 나옵니다.',
  'help.guide.roadtrip-refuel.step.3':
    '최대 세 곳이 돌아오고, 각각 경로에서 얼마나 떨어져 있는지와 얼마만큼의 주행거리가 남을지가 붙습니다.',
  'help.guide.roadtrip-refuel.step.4':
    '제안의 더하기가 그것을 주유 정차로 더합니다. “경유지로 추가”가 종류와 시간이 이미 채워진 채 열리고, “추가”가 실제로 지나가는 지점에서 구간에 올립니다.',
  'help.guide.roadtrip-refuel.result':
    '그 정차는 알맞은 구간에 자기 아이콘으로 놓이고, 주행거리는 거기서부터 다시 세며, 띠는 사라집니다.',
  'help.guide.roadtrip-refuel.tip.1':
    '주행거리는 마지막 주유나 충전 정차에서부터 날을 넘겨 셉니다. 무엇으로 이동하는지가 어떤 정차를 세는지 정합니다. “연료”는 주유만, “전기”는 충전만입니다.',
  'help.guide.roadtrip-refuel.tip.2':
    '검색은 연료가 떨어지는 지점 앞의 길을 보고, 여유분을 남기고, 우회 거리를 두 번 세므로, 내놓는 것은 모두 실제로 닿을 수 있습니다.',
  'help.guide.roadtrip-refuel.tip.3':
    '빈 답이 막다른 길은 아닙니다. 등이 “다시 시도”로 바뀝니다. 장소 검색은 공유 서비스라 시간이 초과되기도 하기 때문입니다.',
  // roadtrip-track
  'help.guide.roadtrip-track.title': '하루를 가져온 트랙에 맞추기',
  'help.guide.roadtrip-track.goal': 'GPX나 KML 트랙으로 가져온 경치 좋은 길 위에 하루의 주행을 올립니다.',
  'help.guide.roadtrip-track.step.1': '날짜 머리글의 “트랙” 배지를 클릭합니다. 대화상자가 그 날로 열립니다.',
  'help.guide.roadtrip-track.step.2':
    '트랙을 고릅니다. 각각 길이가 얼마인지, 이 날을 따라 이어지는지 아니면 얼마나 떨어져 있는지 알려 주며 가까운 것부터 나옵니다.',
  'help.guide.roadtrip-track.step.3':
    '“이 트랙 따라가기”를 클릭합니다. TREK은 주행이 트랙에서 가장 멀어지는 곳에 경유 지점을 놓고, 회차를 거듭하며 경로를 다시 계산합니다.',
  'help.guide.roadtrip-track.step.4':
    '경유 지점을 몇 개 놓았는지, 주행이 이제 얼마나 가깝게 붙는지 알려 줍니다. 그 아래의 버튼은 그 경유 지점들을 다시 없애고 그 날을 경로 엔진에 돌려주며, 대화상자를 닫으면 트랙이 유지됩니다.',
  'help.guide.roadtrip-track.result':
    '그 날의 주행은 경로 엔진이 고른 길 대신 트랙을 따르고, “트랙” 배지에 불이 들어와 커서를 올리면 그 트랙의 이름을 알려 줍니다.',
  'help.guide.roadtrip-track.tip.1':
    '파일은 “일자별”에서 “파일 가져오기”로 들여오고, “경로”나 “트랙 (경로 형상 포함)”을 체크합니다. 여행에 하나가 들어오기 전까지는 어느 날도 이 배지를 달지 않습니다.',
  'help.guide.roadtrip-track.tip.2':
    '트랙을 따르면 그 날 구간들이 이미 가지고 있던 경유 지점이 대체되므로, 구간을 손으로 다듬는 일은 트랙 앞이 아니라 뒤에 하세요.',
};

export default help;
