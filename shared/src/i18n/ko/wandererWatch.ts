import type { TranslationStrings } from '../types';

const wandererWatch: TranslationStrings = {
  'wanderer.watch.label': '내 트레일 변경 확인',
  'wanderer.watch.hint': '가져온 트레일이 바뀌었을 수 있을 때 알림을 받습니다.',
  'wanderer.watch.info':
    'TREK은 가져온 각 트레일의 짧은 기록을 하루 최대 한 번 읽으며 GPX 파일은 읽지 않습니다. 알림만 보내며, 변경을 반영할지는 투어의 소스 확인에서 직접 결정합니다.',
  'wanderer.watch.notConnected': '먼저 wanderer를 연결하세요',
  'wanderer.watch.on': '백그라운드 확인을 켰습니다',
  'wanderer.watch.off': '백그라운드 확인을 껐습니다',
  'wanderer.watch.failed': '백그라운드 확인을 전환하지 못했습니다',
  'wanderer.watch.lastRun': '마지막 확인 {date}',
  'wanderer.watch.neverRun': '아직 확인하지 않음',
  'wanderer.watch.paused': '{time}까지 일시 중지',
  'wanderer.watch.pausedHint':
    'wanderer가 응답하지 않았습니다. 실패할 때마다 TREK은 다시 묻기 전에 더 오래 기다립니다.',
  'wanderer.watch.blocked': '토큰 거부됨',
  'wanderer.watch.blockedHint':
    'wanderer가 API 토큰을 거부했습니다. 연결 테스트가 통과하거나 새 토큰을 저장하면 확인이 다시 시작됩니다.',
  'wanderer.watch.hints': '알림',
  'wanderer.watch.hintsCount': '열린 알림 {count}개',
  'wanderer.watch.empty': '열린 알림이 없습니다',
  'wanderer.watch.dialogTitle': '내 트레일에 관한 알림',
  'wanderer.watch.openTour': '투어 열기',
  'wanderer.watch.checkedAt': '확인 {date}',
  'wanderer.watch.noticeLabel': '백그라운드 확인',
  'wanderer.watch.state.possible_change': '바뀌었을 수 있음',
  'wanderer.watch.state.changed': '변경됨',
  'wanderer.watch.state.unverifiable': '확인 불가',
  'wanderer.watch.stateHint.possible_change':
    'wanderer에서 트레일의 타임스탬프가 바뀌었습니다. 내용이 다른지는 소스 확인으로만 알 수 있습니다.',
  'wanderer.watch.stateHint.changed':
    'wanderer 기록에 다른 이름이나 설명이 있습니다. 소스 확인에서 바뀐 내용을 모두 볼 수 있습니다.',
  'wanderer.watch.stateHint.unverifiable':
    'TREK이 이 트레일을 판단할 수 없어 변경 여부에 대해 아무것도 말하지 않습니다.',
  'wanderer.watch.reason.unavailable': '트레일에 접근할 수 없음',
  'wanderer.watch.reason.no_change_time': '타임스탬프 없음',
};
export default wandererWatch;
