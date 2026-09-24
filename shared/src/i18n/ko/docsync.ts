import type { TranslationStrings } from '../types';

const docsync: TranslationStrings = {
  'docsync.title': '문서 동기화',
  'docsync.noProviders': '사용할 수 있는 문서 저장소가 없습니다',
  'docsync.noProvidersHint': '인스턴스 관리자가 관리 → 애드온 → 문서에서 켤 수 있습니다.',
  'docsync.addProvider': '저장소 연결',
  'docsync.test': '연결 테스트',
  'docsync.connect.optional': '선택 사항',
  'docsync.connected': '연결됨',
  'docsync.chooseFolder': '폴더 선택',
  'docsync.noFolders': '이 인스턴스에서 아직 아무것도 찾지 못했습니다.',
  'docsync.newFolderPlaceholder': '새 폴더 이름',
  'docsync.syncNow': '지금 동기화',
  'docsync.unlink': '연결 해제',
  'docsync.confirmUnlink': '문서는 TREK과 저장소에 그대로 남습니다. 둘 사이의 연결만 사라집니다.',
  'docsync.syncEnabled': '자동으로 동기화',
  'docsync.deletePolicy': '문서가 삭제될 때',
  'docsync.deleteUnlink': '양쪽 사본 유지',
  'docsync.deleteTrash': '휴지통으로 이동',
  'docsync.conflictPolicy': '양쪽이 모두 바뀌었을 때',
  'docsync.onConflict.manual': '물어보기',
  'docsync.onConflict.trek_wins': 'TREK 사본 유지',
  'docsync.onConflict.provider_wins': '저장소 사본 유지',
  'docsync.webhookHint':
    '이 URL을 저장소에 붙여넣으면 변경 사항이 바로 전달됩니다. 설정하지 않으면 TREK이 주기적으로 확인합니다.',

  // 연결 양식의 항목. 키는 document_provider_fields의 `label` 열과 짝을 이루며,
  // 이 열에는 문구가 아니라 키의 뒷부분만 저장됩니다.
  'docsync.providerUrl': '주소',
  'docsync.providerApiToken': 'API 토큰',
  'docsync.providerApiKey': 'API 키',
  'docsync.providerAppPassword': '앱 비밀번호',
  'docsync.providerAppToken': '앱 토큰',
  'docsync.providerUsername': '사용자 이름',
  'docsync.providerPassword': '비밀번호',
  'docsync.providerOrganization': '조직 ID',
  'docsync.providerBasePath': '기준 폴더',
  'docsync.providerOTP': '2단계 인증 코드',
  'docsync.allowInsecureTls': '자체 서명 인증서 허용',

  'docsync.hintPaperlessToken': 'Paperless의 My Profile에서 만듭니다. 해당 계정의 모든 권한을 그대로 가집니다.',
  'docsync.hintPapraKey': 'Papra의 API keys에서 만듭니다. Papra 키는 언제나 소속된 모든 조직에 접근합니다.',
  'docsync.hintPapraOrg': 'Papra 주소 표시줄에 있는 org_… 아이디입니다.',
  'docsync.hintNextcloudLogin': 'Nextcloud 로그인 이름입니다. 이메일 주소가 아닙니다.',
  'docsync.hintNextcloudAppPassword':
    '설정 → 보안 → 새 앱 비밀번호 만들기에서 발급합니다. 계정 비밀번호는 쓰지 마세요.',
  'docsync.hintOpenCloudToken': 'OpenCloud의 앱 토큰에서 만듭니다.',
  'docsync.hintBasePath': 'TREK이 여행 폴더를 찾는 위치입니다. 기본값은 /TREK입니다.',
  'docsync.hintSynologyUrl': '포트까지 포함하세요. 예: https://nas.example.com:5001',
  'docsync.hintSynologyUser': '이 공유 폴더에만 접근할 수 있는 전용 DSM 계정을 권장합니다.',
  'docsync.hintSynologyOtp': '계정에서 2단계 인증을 사용하는 경우 처음 한 번만 필요합니다.',

  'docsync.linkState.never': '아직 동기화하지 않았습니다',
  'docsync.linkState.ok': '동기화됨',
  'docsync.linkState.partial': '일부만 동기화됨',
  'docsync.linkState.failed': '실패',
  'docsync.linkState.needs_reauth': '다시 로그인하세요',
  'docsync.linkState.scope_lost': '폴더가 사라졌습니다',
  'docsync.linkState.orphaned': '소유자가 여행에서 나갔습니다',

  'docsync.state.pending': '대기 중',
  'docsync.state.synced': '동기화됨',
  'docsync.state.conflict': '충돌',
  'docsync.state.rejected_type': '허용되지 않는 형식',
  'docsync.state.too_large': '용량 초과',
  'docsync.state.error': '오류',
  'docsync.state.remote_missing': '저장소에 없음',
  'docsync.state.local_deleted': 'TREK에서 삭제됨',
  'docsync.state.scope_drift': '폴더 밖으로 이동됨',

  'docsync.conflict.resolve': "{count}건 해결",

  'docsync.conflict.title': '양쪽 사본이 모두 바뀌었습니다',
  'docsync.conflict.keepTrek': 'TREK 버전 유지',
  'docsync.conflict.keepProvider': '저장소 버전 유지',
  'docsync.conflict.keepBoth': '둘 다 유지',

  // 실패 사유는 코드로 전달하며, 저장소가 보낸 문구를 그대로 쓰지 않습니다. 상대는
  // 영어로 답하거나 프록시의 로그인 화면 HTML을 돌려주기도 합니다.
  'docsync.error.unreachable': '저장소에 연결하지 못했습니다.',
  'docsync.error.tls_untrusted': '인증서가 거부되었습니다. 이 인스턴스를 신뢰한다면 자체 서명 인증서를 허용하세요.',
  'docsync.error.unauthorized': '인증 정보가 거부되었습니다.',
  'docsync.error.forbidden': '이 계정에는 그럴 권한이 없습니다.',
  'docsync.error.not_found': '저장소에서 찾을 수 없습니다.',
  'docsync.error.scope_missing': '연결된 폴더가 더 이상 존재하지 않습니다.',
  'docsync.error.rate_limited': '저장소가 요청 속도를 제한하고 있습니다. TREK이 나중에 다시 시도합니다.',
  'docsync.error.too_large': '저장소가 허용하는 크기보다 파일이 큽니다.',
  'docsync.error.unsupported_type': '저장소가 이 파일 형식을 받지 않습니다.',
  'docsync.error.quota_exceeded': '저장소에 남은 공간이 없습니다.',
  'docsync.error.conflict': '이 문서가 양쪽에서 바뀌었습니다.',
  'docsync.error.checksum_mismatch': '전송된 내용이 온전하지 않습니다.',
  'docsync.error.provider_error': '저장소가 오류를 반환했습니다.',
  'docsync.error.timeout': '저장소의 응답이 너무 오래 걸렸습니다.',
  'docsync.error.ssrf_blocked': '허용되지 않는 주소입니다.',
  'docsync.error.mass_delete_guard':
    '많은 문서가 한꺼번에 사라져 아무것도 변경하지 않았습니다. 폴더가 아직 마운트되어 있는지 확인하세요.',
  'docsync.error.unknown': '문제가 발생했습니다.',

  // ── 대화 상자 ──────────────────────────────────────────────────────────────
  'docsync.sidebar.connected': '이 여행',
  'docsync.addAnother': '더 추가',
  'docsync.syncing': '동기화 중',
  'docsync.card.pickFolder': '연결됨, 폴더를 고르세요',

  'docsync.empty.title': '아직 연결된 저장소가 없습니다',
  'docsync.empty.hintOwner':
    '왼쪽에서 저장소를 고르세요. TREK은 모든 문서의 사본을 따로 보관하므로 저장소가 사라져도 잃는 것은 없습니다.',
  'docsync.empty.hintMember': '이 설정은 여행 소유자가 합니다. 어느 쪽이든 문서는 TREK에 그대로 남습니다.',

  // 제품마다 문서를 정리하는 방식. 다음 화면에서 물어볼 내용이라 연결하기 전에
  // 미리 보여 줍니다.
  'docsync.model.paperless': '태그로 정리',
  'docsync.model.papra': '조직 안에서 태그로 정리',
  'docsync.model.nextcloud': '폴더에 정리',
  'docsync.model.opencloud': '스페이스에 정리',
  'docsync.model.synologydrive': 'NAS의 폴더에 정리',

  // ── 흐름 표시줄 ────────────────────────────────────────────────────────────
  'docsync.flow.trek': 'TREK',
  'docsync.flow.toProvider': '저장소로 내보내기',
  'docsync.flow.toTrek': '저장소에서 가져오기',
  'docsync.flow.documents': '문서',
  'docsync.flow.summary.both': '문서가 양방향으로 오갑니다.',
  'docsync.flow.summary.pull': '문서가 들어오기만 합니다.',
  'docsync.flow.summary.push': '문서가 나가기만 합니다.',
  'docsync.flow.summaryEditable.both': '양방향으로 오갑니다. 한쪽을 누르면 멈춥니다.',
  'docsync.flow.summaryEditable.pull': '들어오기만 합니다. 반대쪽을 누르면 내보내기도 합니다.',
  'docsync.flow.summaryEditable.push': '나가기만 합니다. 반대쪽을 누르면 가져오기도 합니다.',

  // ── 연결 하나 ──────────────────────────────────────────────────────────────
  'docsync.binding.settings': '설정',
  'docsync.binding.folder': '폴더',
  'docsync.binding.lastRun': '마지막 실행',
  'docsync.binding.autoOff': '일시 중지됨',
  'docsync.binding.neverRun': '아직 실행 안 함',
  'docsync.binding.deleteHint': '반대쪽 사본을 어떻게 할지 정합니다.',
  'docsync.binding.conflictHint': '양쪽에서 편집된 문서 중 어느 사본을 남길지.',
  'docsync.binding.autoHint': '백그라운드에서 변경 사항을 확인합니다.',
  'docsync.binding.webhookTitle': '즉시 업데이트',
  'docsync.binding.copy': '복사',
  'docsync.binding.copied': '복사됨',

  // ── 연결하기 ───────────────────────────────────────────────────────────────
  'docsync.connect.submit': '연결',
  'docsync.connect.testing': '연결을 시도하는 중',
  'docsync.connect.okAs': '연결됐습니다. {account} 계정으로 로그인했습니다',
  'docsync.connect.insecureHint': '자체 서명 인증서를 쓰는 내부 네트워크 인스턴스용입니다.',
  'docsync.connect.about.paperless': 'TREK은 이 여행을 전용 태그로 정리하며 보관함의 나머지는 건드리지 않습니다.',
  'docsync.connect.about.papra': '이 여행이 속할 조직을 고르세요. TREK은 그 안에서 전용 태그로 정리합니다.',
  'docsync.connect.about.nextcloud':
    '계정 비밀번호 대신 앱 비밀번호를 쓰세요. 2단계 인증에도 영향을 받지 않고 따로 취소할 수 있습니다.',
  'docsync.connect.about.opencloud': 'TREK은 이 여행 전용 스페이스를 받아 다른 자료와 분리합니다.',
  'docsync.connect.about.synologydrive': '이 여행이 쓸 공유 폴더에만 접근하는 DSM 계정을 권장합니다.',

  // ── 저장 위치 고르기 ───────────────────────────────────────────────────────
  'docsync.scope.title': '{provider}의 어디에 이 여행을 둘까요?',
  'docsync.scope.intro': '여기에 있는 것만 동기화됩니다. 저장소의 나머지는 TREK에 들어오지 않습니다.',
  'docsync.scope.createTitle': '새로 만들기',
  'docsync.scope.createAction': '만들기',
  'docsync.scope.pickTitle': '또는 이미 있는 것 사용하기',
  'docsync.scope.search': '검색',
  'docsync.scope.noMatch': '일치하는 항목이 없습니다.',

  // ── 사람이 정해야 하는 것 ──────────────────────────────────────────────────
  'docsync.issues.title': '확인이 필요합니다',
  'docsync.issues.conflict': '양쪽에서 바뀌었습니다. 어느 쪽을 남길지 고르세요.',
  'docsync.issues.remote_missing': '저장소에서 사라졌습니다. TREK 사본은 그대로 있습니다.',
  'docsync.issues.rejected_type': '여기서는 허용되지 않는 파일 형식입니다.',
  'docsync.issues.too_large': '허용 크기를 넘습니다.',
  'docsync.issues.error': '전송이 완료되지 않았습니다.',

  'docsync.error.unknown_provider': '이 저장소는 이 인스턴스에서 사용할 수 없습니다.',
  'docsync.error.provider_disabled': '일시 중지됨: 관리자가 이 저장소를 껐습니다. 다시 켜지면 동기화가 재개됩니다.',
  'docsync.binding.reconnect': '다시 연결',
};

export default docsync;
