// ===== 게임 데이터 (기획서 v2 수치 기준) =====

export const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일']

export const TITLES = [
  { xp: 0, icon: '🌱', name: '디지털 새싹' },
  { xp: 50, icon: '🔰', name: '절제 견습생' },
  { xp: 120, icon: '⚖️', name: '균형 수련생' },
  { xp: 220, icon: '🗡️', name: '집중력 용사' },
  { xp: 350, icon: '👑', name: '디지털 마스터' },
]

export const levelOf = (xp) => {
  let lv = 1
  TITLES.forEach((t, i) => { if (xp >= t.xp) lv = i + 1 })
  return lv
}
export const titleOf = (xp) => TITLES[levelOf(xp) - 1]

// ===== 아침 이벤트 카드 (§6-1) =====
// good: 콤보/XP/포인트 대상, trap: 함정형(3일차 확률 2배, 모바일펜스 방어 대상)
export const EVENTS = [
  {
    id: 1, text: '친구가 신작 게임을 추천했어요!', icon: '🎮',
    a: { label: '바로 해본다', fx: { popcorn: 10, happy: 8 }, msg: '재밌긴 한데… 머릿속이 팝콘팝콘! 🍿' },
    b: { label: '숙제 먼저 한다', fx: { selfcare: 10 }, good: true, msg: '할 일 먼저 끝내는 멋짐! ✨' },
  },
  {
    id: 2, text: '엄마가 같이 산책 가자고 하셨어요', icon: '🚶',
    a: { label: '따라간다', fx: { health: 10, happy: 8 }, good: true, msg: '바람이 시원하다~ 기분 최고!' },
    b: { label: '거절한다', fx: { popcorn: 5 }, msg: '방에서 뒹굴뒹굴… 좀 심심한데.' },
  },
  {
    id: 3, text: '숏폼 영상이 자동재생되고 있어요', icon: '📱', trap: true,
    a: { label: '끈다', fx: { selfcare: 15 }, good: true, adDodge: true, msg: '오늘의 나, 좀 강한데? 💪' },
    b: { label: '계속 본다', fx: { popcorn: 20 }, time: 1, msg: '어?! 벌써 1시간이 사라졌어…' },
  },
  {
    id: 4, text: '체육 시간에 친구가 축구하자고 해요', icon: '⚽',
    a: { label: '같이 한다', fx: { health: 15, happy: 5 }, good: true, msg: '땀 흘리니까 개운해!' },
    b: { label: '피곤해서 쉰다', fx: {}, msg: '벤치에서 구경만 했다.' },
  },
  {
    id: 5, text: "'무료' 아이템 뽑기 광고가 떴어요!", icon: '🎁', trap: true,
    a: { label: '닫는다', fx: { selfcare: 10 }, good: true, adDodge: true, msg: '🕵️ 저건 광고다. 속지 않아!' },
    b: { label: '뽑는다', fx: {}, special: 'gacha', msg: '꽝! …무료가 아니었잖아! (-20P)' },
  },
  {
    id: 6, text: '단톡방이 쉴 새 없이 울려요', icon: '💬',
    a: { label: '알림 끄고 할 일 하기', fx: { selfcare: 10 }, good: true, msg: '조용하니까 집중이 잘 된다.' },
    b: { label: '30분 수다 떨기', fx: { popcorn: 8, happy: 3 }, msg: '재밌긴 한데 시간이 훌쩍!' },
  },
  {
    id: 7, text: '새벽에 깼는데 머리맡에 폰이 있어요…', icon: '🌙',
    a: { label: '다시 잔다', fx: {}, good: true, msg: '꿀잠 성공! 좋은 선택이야. 😴' },
    b: { label: '잠깐만 본다', fx: { health: -15, popcorn: 10 }, msg: '…새벽 3시까지 봐버렸다. 😵' },
  },
  {
    id: 8, text: '도서관에서 재밌어 보이는 만화책 발견!', icon: '📚',
    a: { label: '읽어 본다', fx: { selfcare: 5, happy: 8 }, good: true, msg: '재밌는 책도 있잖아?!' },
    b: { label: '그냥 지나친다', fx: {}, msg: '그냥 지나쳤다.' },
  },
  {
    id: 9, text: '친구들이 보드게임 하자고 해요', icon: '🎲',
    a: { label: '같이 한다', fx: { happy: 12, popcorn: -5 }, good: true, msg: '게임인데 팝콘이 줄었다?!' },
    b: { label: '폰게임 하자고 우긴다', fx: { popcorn: 10 }, msg: '친구들이 시무룩해졌다…' },
  },
  {
    id: 10, text: '엄마 몰래 폰 가져갈 찬스!', icon: '🤫',
    a: { label: '참는다', fx: { selfcare: 10 }, good: true, msg: '참은 내가 대견하다!' },
    b: { label: '가져간다', fx: {}, special: 'sneak', msg: '' },
  },
]

// 6일차(토) 고정 이벤트
export const FAMILY_EVENT = {
  id: 99, text: '주말이다! 엄마가 가족 나들이 가자고 하셨어요 🚗', icon: '🌳',
  a: { label: '따라나선다', fx: { health: 15, happy: 15 }, time: 3, good: true, msg: '오랜만의 나들이, 완전 재충전!' },
  b: { label: '집에서 게임할래', fx: { popcorn: 10 }, msg: '집은 편하지만… 좀 아쉽네.' },
}

// ===== 상점 아이템 (§8-3) =====
export const ITEMS = [
  { id: 'familylink', icon: '🛡️', name: '구글 패밀리 링크', price: 80, desc: '게임 3연속 차단 (2연속까지만 허용)' },
  { id: 'screentime', icon: '⏳', name: 'Apple 스크린 타임', price: 60, desc: '밤 9시 이후 게임 버튼 잠금' },
  { id: 'fence', icon: '🚧', name: '모바일펜스', price: 70, desc: '함정 이벤트를 하루 1번 자동 방어' },
  { id: 'ball', icon: '⚽', name: '새 축구공', price: 50, desc: '운동 체력 획득 +50%' },
  { id: 'manga', icon: '📚', name: '만화 전집', price: 50, desc: '책읽기에 행복 +6 추가' },
  { id: 'clock', icon: '⏰', name: '알람시계', price: 40, desc: '아침 이벤트 좋은 선택지에 ✨ 힌트' },
  { id: 'blanket', icon: '🛏️', name: '구름 이불', price: 60, desc: '취침 회복 +10, 충동 폭발 확률 절반' },
]

// ===== 뱃지 (§8-4) =====
export const BADGES = [
  { id: 'earlybird', icon: '🌅', name: '얼리버드', desc: '22시 이전 취침 3회' },
  { id: 'sport', icon: '⚽', name: '체육왕', desc: '축구/줄넘기 5회' },
  { id: 'reader', icon: '📚', name: '독서광', desc: '책읽기 5회' },
  { id: 'talker', icon: '💬', name: '효자손', desc: '엄마와 대화 5회' },
  { id: 'quitter', icon: '🧘', name: '절제왕', desc: "'한 판 더?' 팝업에서 그만하기 5회" },
  { id: 'adhunter', icon: '🕵️', name: '광고 헌터', desc: '함정 이벤트 3회 간파' },
  { id: 'missionking', icon: '📵', name: '진짜 미션왕', desc: '현실 미션 3회 완료' },
  { id: 'slayer', icon: '🐉', name: '몬스터 슬레이어', desc: '4일차 미드보스 승리' },
  { id: 'conqueror', icon: '🏆', name: '도파민 정복자', desc: '최종보스 승리' },
  { id: 'balance', icon: '⚖️', name: '밸런스 마스터', desc: '하루 안에 게임+운동+독서 모두 하기', hidden: true },
]

// ===== OX 퀴즈 풀 (일기 복습 + 최종보스 R2) =====
export const QUIZ = [
  { id: 1, eventId: 3, q: '숏폼 자동재생은 내가 끄기 전까지 계속된다.', a: true, expl: '자동재생은 나를 붙잡아 두려는 장치야. 끄는 건 나만 할 수 있어!' },
  { id: 2, eventId: 5, q: "'무료 뽑기'는 정말 공짜다.", a: false, expl: '무료라고 해놓고 내 시간과 돈을 노리는 광고가 많아.' },
  { id: 3, q: '숏폼을 오래 보면 뇌가 강한 자극에만 반응하게 된다.', a: true, expl: '그게 바로 팝콘 브레인! 잔잔한 재미가 시시해져 버려.' },
  { id: 4, q: '게임은 무조건 나쁘다.', a: false, expl: '문제는 게임이 아니라 멈추지 못하는 것. 균형이 답이야!' },
  { id: 5, q: '운동을 하면 팝콘 브레인 회복에 도움이 된다.', a: true, expl: '몸을 움직이면 뇌도 건강한 자극을 받아.' },
  { id: 6, eventId: 7, q: '자기 전에 스마트폰을 보면 잠드는 데 더 오래 걸린다.', a: true, expl: '화면의 빛이 뇌를 깨워서 꿀잠을 방해해.' },
  { id: 7, q: '앱 회사들은 내가 화면에 오래 머물수록 돈을 번다.', a: true, expl: '그래서 온갖 수법으로 나를 붙잡으려는 거야.' },
  { id: 8, q: "'한 판만 더'는 보통 정말 한 판으로 끝난다.", a: false, expl: '한 판이 두 판, 세 판… 그래서 처음에 멈추는 게 제일 쉬워.' },
]

// ===== 지우의 조언 =====
export const JIWOO_TIPS = [
  '나도 예전엔 팝콘 브레인이었어. 매일 30분 줄넘기했더니 나아지더라!',
  '알림을 꺼두면 폰 볼 일이 확 줄어들어. 진짜야!',
  "'무료'라고 쓰여 있으면 일단 의심해 봐. 세상에 공짜는 없대.",
  '팝콘 지수가 80을 넘으면 책이 눈에 안 들어온대. 조심해!',
  '행복이 너무 낮으면 밤에 폭발할 수도 있어. 놀 땐 놀아야 해!',
  '22시 전에 자면 다음 날 체력이 꽉 차. 얼리버드가 답이야!',
]

export const JIWOO_GAME_WARN = '야, 나 예전에 이러다 밤샜잖아. 눈 안 아프냐? 오늘은 그만하자!'
export const JIWOO_TRAP_WARN = '오늘따라 폰이 자꾸 유혹할 거야. 함정 조심해!'

// ===== 진짜 미션 (현실 연계) =====
export const MISSIONS = [
  '오늘 밥 먹을 때 폰 안 보기',
  '자기 전 30분, 폰을 방 밖에 두기',
  '엘리베이터 대신 계단 이용하기',
  '10분 동안 창밖 보며 멍때리기 (숏폼 없이!)',
  '가족에게 오늘 있었던 일 한 가지 이야기하기',
]

// ===== 최종보스 R1 알림 =====
export const TEMPT_NOTIS = ['🎁 무료 뽑기 찬스!', '🔥 신작 게임 출시!', '📺 네가 좋아할 영상', '⚡ 지금 접속하면 2배!', '💎 한정 아이템 획득!']
export const REAL_NOTIS = ['📚 숙제 제출 마감', '👩 엄마: 저녁 먹자~', '⏰ 내일 준비물 챙기기']

// ===== 초기 상태 =====
export const initialGame = {
  day: 1,
  hour: 8,
  stats: { popcorn: 50, health: 70, selfcare: 20, happy: 60 },
  xp: 0,
  level: 1,
  points: 0,
  combo: 0,
  consecGames: 0,
  talkToday: 0,
  fenceUsedToday: false,
  counters: { earlyBird: 0, exercise: 0, reading: 0, talk: 0, quitWins: 0, adDodges: 0, missionsDone: 0, totalGames: 0 },
  todayActions: [],
  todayEvent: null,
  badges: [],
  balanceDone: false,
  owned: [],
  equipped: [],
  points_: 0,
  mission: null,
  pendingMissionCheck: null,
  pledge: null,
  activeBuff: null,
  yesterday: null,
  sleepEarly: false,
  forcedSleep: false,
  sleepAfterBoss: false,
  midBossDone: false,
  midBossWon: false,
  finalDone: false,
  finalWon: false,
  phase: 'normal', // normal | midboss | finalboss | ended
  ending: null,
  modals: [],
  shopSeen: false,
  tab: 'home',
}
