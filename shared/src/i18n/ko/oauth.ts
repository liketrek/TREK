import type { TranslationStrings } from '../types';

const oauth: TranslationStrings = {
  'oauth.scope.group.trips': '여행',
  'oauth.scope.group.places': '장소',
  'oauth.scope.group.atlas': 'Atlas',
  'oauth.scope.group.packing': '짐 목록',
  'oauth.scope.group.todos': '할 일',
  'oauth.scope.group.budget': '예산',
  'oauth.scope.group.reservations': '예약',
  'oauth.scope.group.collab': '협업',
  'oauth.scope.group.notifications': '알림',
  'oauth.scope.group.vacay': '휴가',
  'oauth.scope.group.geo': '지리',
  'oauth.scope.group.weather': '날씨',
  'oauth.scope.group.journey': 'Journey',
  'oauth.scope.trips:read.label': '여행 및 일정 보기',
  'oauth.scope.trips:read.description': '여행, 날, 일별 메모, 멤버 읽기',
  'oauth.scope.trips:write.label': '여행 및 일정 편집',
  'oauth.scope.trips:write.description': '여행, 날, 메모 만들기 및 업데이트, 멤버 관리',
  'oauth.scope.trips:delete.label': '여행 삭제',
  'oauth.scope.trips:delete.description': '전체 여행 영구 삭제 — 이 작업은 되돌릴 수 없습니다',
  'oauth.scope.trips:share.label': '공유 링크 관리',
  'oauth.scope.trips:share.description': '여행의 공개 공유 링크 만들기, 업데이트, 취소',
  'oauth.scope.places:read.label': '장소 및 지도 데이터 보기',
  'oauth.scope.places:read.description': '장소, 날 배정, 태그, 카테고리 읽기',
  'oauth.scope.places:write.label': '장소 관리',
  'oauth.scope.places:write.description': '장소, 배정, 태그 만들기, 업데이트, 삭제',
  'oauth.scope.atlas:read.label': 'Atlas 보기',
  'oauth.scope.atlas:read.description': '방문한 나라, 지역, 버킷 리스트 읽기',
  'oauth.scope.atlas:write.label': 'Atlas 관리',
  'oauth.scope.atlas:write.description': '방문한 나라 및 지역 표시, 버킷 리스트 관리',
  'oauth.scope.packing:read.label': '짐 목록 보기',
  'oauth.scope.packing:read.description': '짐 항목, 가방, 카테고리 배정 읽기',
  'oauth.scope.packing:write.label': '짐 목록 관리',
  'oauth.scope.packing:write.description': '짐 항목 및 가방 추가, 업데이트, 삭제, 체크, 순서 변경',
  'oauth.scope.todos:read.label': '할 일 목록 보기',
  'oauth.scope.todos:read.description': '여행 할 일 항목 및 카테고리 배정 읽기',
  'oauth.scope.todos:write.label': '할 일 목록 관리',
  'oauth.scope.todos:write.description': '할 일 항목 만들기, 업데이트, 체크, 삭제, 순서 변경',
  'oauth.scope.budget:read.label': '예산 보기',
  'oauth.scope.budget:read.description': '예산 항목 및 지출 내역 읽기',
  'oauth.scope.budget:write.label': '예산 관리',
  'oauth.scope.budget:write.description': '예산 항목 만들기, 업데이트, 삭제',
  'oauth.scope.reservations:read.label': '예약 보기',
  'oauth.scope.reservations:read.description': '예약 및 숙박 상세 정보 읽기',
  'oauth.scope.reservations:write.label': '예약 관리',
  'oauth.scope.reservations:write.description': '예약 만들기, 업데이트, 삭제, 순서 변경',
  'oauth.scope.collab:read.label': '협업 보기',
  'oauth.scope.collab:read.description': '협업 메모, 투표, 메시지 읽기',
  'oauth.scope.collab:write.label': '협업 관리',
  'oauth.scope.collab:write.description': '협업 메모, 투표, 메시지 만들기, 업데이트, 삭제',
  'oauth.scope.notifications:read.label': '알림 보기',
  'oauth.scope.notifications:read.description': '앱 내 알림 및 읽지 않은 수 읽기',
  'oauth.scope.notifications:write.label': '알림 관리',
  'oauth.scope.notifications:write.description': '알림 읽음 표시 및 응답',
  'oauth.scope.vacay:read.label': '휴가 계획 보기',
  'oauth.scope.vacay:read.description': '휴가 계획 데이터, 항목, 통계 읽기',
  'oauth.scope.vacay:write.label': '휴가 계획 관리',
  'oauth.scope.vacay:write.description': '휴가 항목, 공휴일, 팀 계획 만들기 및 관리',
  'oauth.scope.geo:read.label': '지도 및 지오코딩',
  'oauth.scope.geo:read.description': '위치 검색, 지도 URL 확인, 좌표 역지오코딩',
  'oauth.scope.weather:read.label': '날씨 예보',
  'oauth.scope.weather:read.description': '여행 위치 및 날짜의 날씨 예보 가져오기',
  'oauth.scope.journey:read.label': 'Journey 보기',
  'oauth.scope.journey:read.description': 'Journey, 항목, 기여자 목록 읽기',
  'oauth.scope.journey:write.label': 'Journey 관리',
  'oauth.scope.journey:write.description': 'Journey 및 항목 만들기, 업데이트, 삭제',
  'oauth.scope.journey:share.label': 'Journey 링크 관리',
  'oauth.scope.journey:share.description': 'Journey의 공개 공유 링크 만들기, 업데이트, 취소',
  'oauth.authorize.authorizing': 'Authorizing…', // en-fallback
  'oauth.authorize.loading': 'Loading…', // en-fallback
  'oauth.authorize.errorTitle': 'Authorization Error', // en-fallback
  'oauth.authorize.loginTitle': 'Sign in to continue', // en-fallback
  'oauth.authorize.loginDescription': '{client} wants access to your TREK account. Please sign in first.', // en-fallback
  'oauth.authorize.loginButton': 'Sign in to TREK', // en-fallback
  'oauth.authorize.requestLabel': 'Authorization Request', // en-fallback
  'oauth.authorize.requestDescription': 'This application is requesting access to your TREK account.', // en-fallback
  'oauth.authorize.trustNote': 'Only grant access to applications you trust. Your data stays on your server.', // en-fallback
  'oauth.authorize.selectScope': 'Select at least one scope', // en-fallback
  'oauth.authorize.approveOneScope': 'Approve ({count} scope)', // en-fallback
  'oauth.authorize.approveManyScopes': 'Approve ({count} scopes)', // en-fallback
  'oauth.authorize.approveAccess': 'Approve Access', // en-fallback
  'oauth.authorize.deny': 'Deny', // en-fallback
  'oauth.authorize.choosePermissions': 'Choose which permissions to grant', // en-fallback
  'oauth.authorize.permissionsRequested': 'Permissions requested', // en-fallback
  'oauth.authorize.alwaysIncluded': 'Always included', // en-fallback
  'oauth.authorize.alwaysTool.listTrips': 'List your trips so the AI can discover trip IDs', // en-fallback
  'oauth.authorize.alwaysTool.getTripSummary': 'Read a trip overview needed to use any other tool', // en-fallback
};
export default oauth;
