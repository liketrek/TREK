import type { TranslationStrings } from '../types';

const native: TranslationStrings = {
  'native.connect.title': 'TREK에 연결',
  'native.connect.hint': '브라우저에서 TREK을 여는 주소를 입력하세요.',
  'native.connect.placeholder': 'trek.example.com',
  'native.connect.submit': '연결',
  'native.connect.checking': '확인 중…',
  'native.connect.errorInvalid': '웹 주소가 아닌 것 같습니다.',
  'native.connect.errorUnreachable': '이 주소에서 응답하는 서버가 없습니다. 주소와 연결 상태를 확인하세요.',
  'native.connect.errorNotTrek': '이 주소의 서버는 TREK이 아닙니다.',
  'native.connect.errorTooOld': '이 TREK 서버는 앱에서 사용하기에 너무 오래되었습니다. 먼저 업데이트가 필요합니다.',
  'native.offline.title': '서버에 연결할 수 없음',
  'native.offline.hint': 'TREK이 {server}에 연결하지 못했습니다. 연결 상태를 확인한 후 다시 시도하세요.',
  'native.offline.retry': '다시 시도',
  'native.changeServer': '서버 변경',
  'native.login.failed': '로그인하지 못했습니다. 다시 시도하세요.',
  'native.handoff.title': '앱에서 계속',
  'native.handoff.hint': '{name}(으)로 로그인되어 있습니다. TREK 앱을 열어 로그인을 완료하세요.',
  'native.handoff.open': 'TREK 앱 열기',
  'native.handoff.switchAccount': '다른 계정 사용',
  'native.settings.server': '서버',
  'native.settings.serverHint': '이 앱은 {server}에 연결되어 있습니다.',
};

export default native;
