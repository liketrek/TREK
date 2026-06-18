import type { TranslationStrings } from '../types';

const system_notice: TranslationStrings = {
  'system_notice.v3_photos.title': '3.0에서 사진이 이동했습니다',
  'system_notice.v3_photos.body':
    '여행 플래너의 **사진** 기능이 제거되었습니다. 사진은 안전합니다 — TREK은 Immich 또는 Synology 라이브러리를 수정하지 않았습니다.\n\n사진은 이제 **Journey** 애드온에 있습니다. Journey는 선택 사항입니다 — 아직 사용할 수 없다면 관리자에게 관리자 → 애드온에서 활성화를 요청하세요.',
  'system_notice.v3_journey.title': 'Journey를 만나보세요 — 여행 일지',
  'system_notice.v3_journey.body':
    '타임라인, 사진 갤러리, 인터랙티브 지도가 있는 풍부한 여행 이야기로 여행을 기록하세요.',
  'system_notice.v3_journey.cta_label': 'Journey 열기',
  'system_notice.v3_journey.highlight_timeline': '일별 타임라인 및 갤러리',
  'system_notice.v3_journey.highlight_photos': 'Immich 또는 Synology에서 가져오기',
  'system_notice.v3_journey.highlight_share': '공개 공유 — 로그인 불필요',
  'system_notice.v3_journey.highlight_export': 'PDF 사진 책으로 내보내기',
  'system_notice.v3_features.title': '3.0의 더 많은 하이라이트',
  'system_notice.v3_features.body': '이번 릴리스에서 알아두면 좋은 몇 가지 더.',
  'system_notice.v3_features.highlight_dashboard': '모바일 우선 대시보드 재설계',
  'system_notice.v3_features.highlight_offline': 'PWA로 완전한 오프라인 모드',
  'system_notice.v3_features.highlight_search': '실시간 장소 검색 자동완성',
  'system_notice.v3_features.highlight_import': 'KMZ/KML 파일에서 장소 가져오기',
  'system_notice.v3_mcp.title': 'MCP: OAuth 2.1 업그레이드',
  'system_notice.v3_mcp.body':
    'MCP 통합이 완전히 개선되었습니다. OAuth 2.1이 이제 권장 인증 방법입니다. 기존 정적 토큰 (trek_…)은 더 이상 사용되지 않으며 향후 릴리스에서 제거될 예정입니다.',
  'system_notice.v3_mcp.highlight_oauth': 'OAuth 2.1 권장 (mcp-remote)',
  'system_notice.v3_mcp.highlight_scopes': '24개 세분화된 권한 범위',
  'system_notice.v3_mcp.highlight_deprecated': '정적 trek_ 토큰 더 이상 사용 안 됨',
  'system_notice.v3_mcp.highlight_tools': '확장된 도구 모음 및 프롬프트',
  'system_notice.v3_thankyou.title': '개인적인 감사 인사',
  'system_notice.v3_thankyou.body':
    '떠나시기 전에 잠깐 시간을 내주세요.\n\nTREK은 제 자신의 여행을 위해 만든 사이드 프로젝트로 시작했습니다. 4,000명이 넘는 분들이 모험을 계획하는 데 신뢰해 주실 줄은 상상도 못 했습니다. 모든 별, 모든 이슈, 모든 기능 요청 — 저는 다 읽고, 그것들이 풀타임 직장과 대학 사이의 늦은 밤을 버티게 해줍니다.\n\n알아주셨으면 합니다: TREK은 항상 오픈 소스이고, 항상 자체 호스팅이며, 항상 여러분의 것입니다. 추적 없음, 구독 없음, 조건 없음. 그저 여러분만큼 여행을 사랑하는 누군가가 만든 도구입니다.\n\n[jubnl](https://github.com/jubnl)에게 특별한 감사를. 당신은 훌륭한 협력자가 되었습니다. 3.0을 훌륭하게 만든 많은 부분에 당신의 손길이 담겨 있습니다. 거칠던 초기에 이 프로젝트를 믿어줘서 고맙습니다.\n\n그리고 버그를 제출하고, 문자열을 번역하고, TREK을 친구에게 공유하거나, 단순히 여행 계획에 사용해 주신 모든 분들께 — **감사합니다**. 여러분이 바로 이것이 존재하는 이유입니다.\n\n함께하는 더 많은 모험을 위해.\n\n— Maurice\n\n---\n\n[Discord 커뮤니티에 참여하세요](https://discord.gg/7Q6M6jDwzf)\n\nTREK이 여행을 더 즐겁게 만들어 준다면, [커피 한 잔](https://ko-fi.com/mauriceboe)으로 불을 켜두는 데 도움이 됩니다.',
  'system_notice.v3014_whitespace_collision.title': '조치 필요: 사용자 계정 충돌',
  'system_notice.v3014_whitespace_collision.body':
    '3.0.14 업그레이드 중 저장된 계정의 앞뒤 공백으로 인한 사용자 이름 또는 이메일 충돌이 감지되었습니다. 영향받은 계정은 자동으로 이름이 변경되었습니다. 검토가 필요한 계정을 확인하려면 **[migration] WHITESPACE COLLISION**으로 시작하는 줄의 서버 로그를 확인하세요.',
  'system_notice.welcome_v1.title': 'TREK에 오신 것을 환영합니다',
  'system_notice.welcome_v1.body':
    '올인원 여행 플래너. 일정을 만들고, 친구들과 여행을 공유하고, 온라인 또는 오프라인으로 체계적으로 유지하세요.',
  'system_notice.welcome_v1.cta_label': '여행 계획',
  'system_notice.welcome_v1.hero_alt': 'TREK 계획 UI 오버레이가 있는 아름다운 여행지',
  'system_notice.welcome_v1.highlight_plan': '모든 여행을 위한 일별 일정',
  'system_notice.welcome_v1.highlight_share': '여행 파트너와 협업',
  'system_notice.welcome_v1.highlight_offline': '모바일에서 오프라인으로 작동',
  'system_notice.dev_test_modal.title': '[Dev] 테스트 공지',
  'system_notice.dev_test_modal.body': '개발 전용 테스트 공지입니다.',
  'system_notice.pager.prev': '이전 공지',
  'system_notice.pager.next': '다음 공지',
  'system_notice.pager.counter': '{current} / {total}',
  'system_notice.pager.goto': '{n}번 공지로 이동',
  'system_notice.pager.position': '공지 {current}/{total}',
};
export default system_notice;
