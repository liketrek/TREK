import type { NotificationLocale } from '../externalNotifications/types';

const ko: NotificationLocale = {
  email: {
    footer: 'TREK에서 알림을 활성화했기 때문에 이 이메일을 받으셨습니다.',
    manage: '설정에서 환경설정 관리',
    madeWith: 'Made with',
    openTrek: 'TREK 열기',
  },
  events: {
    trip_invite: (p) => ({
      title: `"${p.trip}" 여행 초대`,
      body: `${p.actor}이(가) ${p.invitee || '멤버'}를 "${p.trip}" 여행에 초대했습니다.`,
    }),
    booking_change: (p) => ({
      title: `새 예약: ${p.booking}`,
      body: `${p.actor}이(가) "${p.trip}"에 "${p.booking}" (${p.type}) 예약을 추가했습니다.`,
    }),
    trip_reminder: (p) => ({
      title: `여행 알림: ${p.trip}`,
      body: `"${p.trip}" 여행이 곧 시작됩니다!`,
    }),
    todo_due: (p) => ({
      title: `할 일 마감: ${p.todo}`,
      body: `"${p.trip}"의 "${p.todo}"은(는) ${p.due}에 마감됩니다.`,
    }),
    vacay_invite: (p) => ({
      title: 'Vacay Fusion 초대',
      body: `${p.actor}이(가) 휴가 계획을 합치도록 초대했습니다. TREK을 열어 수락하거나 거절하세요.`,
    }),
    collection_invite: (p) => ({
      title: '컬렉션 초대',
      body: `${p.actor}이(가) 컬렉션 공유에 초대했습니다. TREK을 열어 수락하거나 거절하세요.`,
    }),
    photos_shared: (p) => ({
      title: `${p.count}장의 사진이 공유되었습니다`,
      body: `${p.actor}이(가) "${p.trip}"에서 ${p.count}장의 사진을 공유했습니다.`,
    }),
    collab_message: (p) => ({
      title: `"${p.trip}"의 새 메시지`,
      body: `${p.actor}: ${p.preview}`,
    }),
    packing_tagged: (p) => ({
      title: `짐 꾸리기: ${p.category}`,
      body: `${p.actor}이(가) "${p.trip}"의 "${p.category}" 카테고리에 당신을 할당했습니다.`,
    }),
    version_available: (p) => ({
      title: '새 TREK 버전 사용 가능',
      body: `TREK ${p.version}을 사용할 수 있습니다. 관리자 패널에서 업데이트하세요.`,
    }),
    synology_session_cleared: () => ({
      title: 'Synology 세션이 초기화되었습니다',
      body: 'Synology 계정 또는 URL이 변경되었습니다. Synology Photos에서 로그아웃되었습니다.',
    }),
    plugin_notification: (p) => ({ title: p.title ?? '', body: p.body ?? '' }),
  },
  passwordReset: {
    subject: '비밀번호 재설정',
    greeting: '안녕하세요',
    body: 'TREK 계정 비밀번호 재설정 요청을 받았습니다. 아래 버튼을 클릭하여 새 비밀번호를 설정하세요.',
    ctaIntro: '비밀번호 재설정',
    expiry: '이 링크는 60분 후에 만료됩니다.',
    ignore: '본인이 요청하지 않으셨다면 이 이메일을 무시하셔도 됩니다 — 비밀번호는 변경되지 않습니다.',
  },
};

export default ko;
