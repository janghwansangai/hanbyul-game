import { useEffect, useState } from 'react'

/*
 * 한별이 캐릭터.
 * 1) 기본은 아래 SVG로 그린 캐릭터가 나옵니다 (외부 파일 불필요, 오프라인 작동).
 * 2) public/characters/ 폴더에 아래 이름의 이미지를 넣으면 자동으로 그 이미지로 교체됩니다.
 *      - hanbyul_happy.png   (컨디션 좋음)
 *      - hanbyul_normal.png  (보통)
 *      - hanbyul_popcorn.png (팝콘 브레인 높음)
 *      - hanbyul_tired.png   (지치고 졸림)
 *    실사 사진, 직접 그린 그림, 웹툰 장면, AI로 만든 그림 등 무엇이든 됩니다.
 */

const BASE = import.meta.env.BASE_URL // 배포 경로(예: '/hanbyul-game/') 또는 로컬 '/'
const FILES = {
  good: 'hanbyul_happy.png',
  normal: 'hanbyul_normal.png',
  popcorn: 'hanbyul_popcorn.png',
  tired: 'hanbyul_tired.png',
}

// 화면에 깨진 이미지 아이콘이 잠깐 뜨는 걸 막기 위해, 보이지 않는 곳에서 먼저 로딩을 시도한다.
const available = {} // mood -> true (PNG 로딩 성공이 확인된 것만)
let probed = false
function probeImages(onReady) {
  if (probed) return
  probed = true
  Object.entries(FILES).forEach(([mood, file]) => {
    const img = new Image()
    img.onload = () => { if (img.naturalWidth > 0) { available[mood] = true; onReady() } }
    img.src = `${BASE}characters/${file}`
  })
}

// ===== 성장 외형: 플레이 스타일에 따라 한별이 모습이 달라진다 =====
// exercise(운동)·reading(공부)·totalGames(게임) 누적치로 결정.
export function computeLook(counters = {}) {
  const s = { fit: counters.exercise || 0, smart: counters.reading || 0, messy: counters.totalGames || 0 }
  const max = Math.max(s.fit, s.smart, s.messy)
  if (max < 3) return { type: 'normal', level: 0, key: 'normal:0' }
  const tops = Object.keys(s).filter((k) => s[k] === max)
  if (tops.length > 1) return { type: 'normal', level: 0, key: 'normal:0' } // 골고루 = 균형
  const type = tops[0]
  const level = max >= 8 ? 2 : 1
  return { type, level, key: `${type}:${level}` }
}

export const LOOK_NICK = {
  'normal:0': '한별이',
  'fit:1': '튼튼 한별이 💪', 'fit:2': '운동왕 한별이 💪🔥',
  'smart:1': '책벌레 한별이 📚', 'smart:2': '박사 한별이 🎓',
  'messy:1': '꾀죄죄 한별이 😅', 'messy:2': '거지꼴 한별이 🫥',
}

export const GROWTH_MSG = {
  'fit:1': '💪 몸이 탄탄해지고 있어!',
  'fit:2': '💪🔥 우와, 운동왕 몸짱이 됐어!',
  'smart:1': '📚 한별이가 점점 똑똑해지고 있어!',
  'smart:2': '🎓 완전 박사님이 다 됐네!',
  'messy:1': '😅 씻지도 않고 게임만… 꾀죄죄해지고 있어.',
  'messy:2': '🫥 이런, 거지꼴이 됐어! 좀 씻고 나가 놀자!',
}

export function Hanbyul({ mood = 'normal', look = 'normal', level = 0, className = '', style }) {
  const [, tick] = useState(0)
  useEffect(() => { probeImages(() => tick((n) => n + 1)) }, [])

  if (available[mood]) {
    return (
      <img src={`${BASE}characters/${FILES[mood]}`} alt="한별이"
        className={`object-contain ${className}`} style={style}
        onError={() => { available[mood] = false; tick((n) => n + 1) }} />
    )
  }
  return <HanbyulSVG mood={mood} look={look} level={level} className={className} style={style} />
}

/* ---------- SVG로 그린 한별이 (성장 외형 지원) ---------- */

function spiralPath(cx, cy) {
  let d = `M ${cx} ${cy}`
  const turns = 2.3, steps = 44, maxR = 7
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    const a = t * turns * Math.PI * 2
    const r = t * maxR
    d += ` L ${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`
  }
  return d
}

function HanbyulSVG({ mood, look = 'normal', level = 0, className, style }) {
  const line = '#5b4636', hair = '#3b2a1e', hairHi = '#6b4f38'
  const blush = '#ff8fa3', outline = '#e8a97e'
  const showBlink = mood !== 'tired' // 자는 눈엔 깜빡임 없음
  const isFit = look === 'fit', isSmart = look === 'smart', isMessy = look === 'messy'

  return (
    <svg viewBox="0 0 160 176" className={`overflow-visible ${className}`} style={style} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="skinG" cx="42%" cy="34%" r="72%">
          <stop offset="0%" stopColor="#ffe8d1" />
          <stop offset="70%" stopColor="#ffd6b0" />
          <stop offset="100%" stopColor="#f6c096" />
        </radialGradient>
        <linearGradient id="shirtG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c83ff" />
          <stop offset="100%" stopColor="#5b52e6" />
        </linearGradient>
        <radialGradient id="eyeG" cx="50%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#6b5a8a" />
          <stop offset="55%" stopColor="#3a2f52" />
          <stop offset="100%" stopColor="#241d33" />
        </radialGradient>
      </defs>

      {/* ===== 몸 (숨쉬는 애니메이션) — 성장 스타일에 따라 달라짐 ===== */}
      <g className="anim-breathe">
        {isFit && (
          <>
            {/* 팔 근육(알통) */}
            <ellipse cx="23" cy="152" rx="15" ry="20" fill="url(#skinG)" stroke={outline} strokeWidth="1.5" />
            <ellipse cx="137" cy="152" rx="15" ry="20" fill="url(#skinG)" stroke={outline} strokeWidth="1.5" />
            <path d="M16 148 q7 -7 14 0" stroke="#e8a87c" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M130 148 q7 -7 14 0" stroke="#e8a87c" strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* 넓은 어깨의 빨간 운동 셔츠 */}
            <path d="M20 176 Q18 120 80 116 Q142 120 140 176 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="1.5" />
            <path d="M42 176 Q36 140 54 126" fill="none" stroke="#b91c1c" strokeWidth="2" opacity="0.5" />
            <path d="M118 176 Q124 140 106 126" fill="none" stroke="#b91c1c" strokeWidth="2" opacity="0.5" />
            <path d="M80 138 l3.6 7.3 8 1.1-5.8 5.7 1.4 8-7.2-3.8-7.2 3.8 1.4-8-5.8-5.7 8-1.1z" fill="#fff" stroke="#e5e7eb" strokeWidth="1" />
          </>
        )}
        {isSmart && (
          <>
            {/* 흰 셔츠 + 스웨터 조끼 + 넥타이 */}
            <path d="M26 176 Q24 126 80 121 Q136 126 134 176 Z" fill="#f8fafc" stroke={outline} strokeWidth="1.5" />
            <path d="M34 176 Q32 130 80 124 Q128 130 126 176 Z" fill="#12a89c" stroke="#0f766e" strokeWidth="1.2" />
            <path d="M67 126 L80 146 L93 126" fill="#f8fafc" stroke="#0f766e" strokeWidth="1.5" />
            <path d="M80 146 l-4 7 4 15 4 -15 z" fill="#ef4444" />
            <path d="M76 141 l8 0 -4 6 z" fill="#dc2626" />
            <path d="M104 150 l2.4 4.9 5.4 .7-3.9 3.8 .9 5.4-4.8-2.5-4.8 2.5 .9-5.4-3.9-3.8 5.4-.7z" fill="#ffe14d" stroke="#f5b800" strokeWidth="0.8" />
          </>
        )}
        {isMessy && (
          <>
            {/* 꼬질꼬질 회녹색 셔츠 + 얼룩 + 주름 */}
            <path d="M26 176 Q24 126 80 121 Q136 126 134 176 Z" fill="#7d7f6b" stroke="#5f6152" strokeWidth="1.5" />
            <path d="M40 150 q10 6 20 0 M92 156 q10 -6 20 0 M50 168 q14 5 28 -1" stroke="#5f6152" strokeWidth="2" fill="none" opacity="0.55" strokeLinecap="round" />
            <ellipse cx="58" cy="160" rx="11" ry="7.5" fill="#5b4a2a" opacity="0.55" />
            <ellipse cx="104" cy="150" rx="6" ry="5" fill="#5b4a2a" opacity="0.45" />
            {level >= 2 && <ellipse cx="84" cy="168" rx="7" ry="5" fill="#4d5a2a" opacity="0.5" />}
            <path d="M80 139 l3.6 7.3 8 1.1-5.8 5.7 1.4 8-7.2-3.8-7.2 3.8 1.4-8-5.8-5.7 8-1.1z" fill="#c9bd6a" stroke="#a89b50" strokeWidth="1" opacity="0.7" />
          </>
        )}
        {!isFit && !isSmart && !isMessy && (
          <>
            <path d="M26 176 Q24 126 80 121 Q136 126 134 176 Z" fill="url(#shirtG)" stroke={outline} strokeWidth="1.5" />
            <path d="M26 176 Q26 146 44 135 L46 176 Z" fill="#4f46e5" opacity="0.35" />
            <path d="M116 135 Q134 146 134 176 L114 176 Z" fill="#4f46e5" opacity="0.35" />
            <path d="M66 124 Q80 134 94 124" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
            <path d="M80 139 l3.6 7.3 8 1.1-5.8 5.7 1.4 8-7.2-3.8-7.2 3.8 1.4-8-5.8-5.7 8-1.1z" fill="#ffe14d" stroke="#f5b800" strokeWidth="1" />
          </>
        )}
        {/* 목 */}
        <rect x="70" y="110" width="20" height="16" rx="9" fill="#f3bd93" />
      </g>

      {/* ===== 귀 ===== */}
      <circle cx="32" cy="82" r="10" fill="url(#skinG)" stroke={outline} strokeWidth="1.2" />
      <circle cx="128" cy="82" r="10" fill="url(#skinG)" stroke={outline} strokeWidth="1.2" />

      {/* ===== 얼굴 ===== */}
      <ellipse cx="80" cy="78" rx="48" ry="46" fill="url(#skinG)" stroke={outline} strokeWidth="1.5" />

      {/* ===== 머리카락 (살랑임) ===== */}
      <g className="anim-hair">
        {/* 게임중독 = 삐죽삐죽 헝클어진 머리 (기본 머리 위에 뻗친 머리 추가) */}
        {isMessy && (
          <g fill={hair}>
            <path d="M40 40 l-10 -14 6 16 z" />
            <path d="M58 30 l-4 -18 10 16 z" />
            <path d="M80 26 l-6 -16 12 14 z" />
            <path d="M100 30 l6 -17 -1 18 z" />
            <path d="M120 42 l12 -12 -7 17 z" />
            {level >= 2 && <path d="M48 24 l-8 -10 3 14 z" />}
            {level >= 2 && <path d="M92 22 l8 -12 -1 15 z" />}
          </g>
        )}
        <path d="M31 80 Q22 28 80 24 Q138 28 129 80 Q123 52 108 49 Q114 37 95 38 Q99 27 80 30 Q61 27 65 38 Q46 37 52 49 Q37 52 31 80 Z"
          fill={hair} />
        {/* 앞머리 결 */}
        <path d="M80 30 Q70 40 60 48" stroke={hairHi} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.55" />
        <path d="M88 31 Q96 40 104 49" stroke={hairHi} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.55" />
        {/* 머리 윤기 (공부왕은 단정하게 반짝) */}
        <path d="M58 40 Q70 33 84 35" stroke={isSmart ? '#b58a5a' : '#8a6a4a'} strokeWidth={isSmart ? 5 : 4} fill="none" strokeLinecap="round" opacity={isSmart ? 0.75 : 0.5} />
        {isSmart && <path d="M80 28 L80 48" stroke="#2a1d12" strokeWidth="2" opacity="0.4" strokeLinecap="round" />}
        {/* 운동왕 = 빨간 머리띠 */}
        {isFit && (
          <>
            <path d="M30 66 Q80 52 130 66 L130 76 Q80 62 30 76 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
            <path d="M126 70 l12 -5 -2 10 z" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
          </>
        )}
      </g>

      {/* ===== 볼터치 ===== */}
      {mood !== 'tired' && (
        <>
          <ellipse cx="50" cy="92" rx="9" ry="5.5" fill={blush} opacity={mood === 'good' ? 0.7 : 0.45} />
          <ellipse cx="110" cy="92" rx="9" ry="5.5" fill={blush} opacity={mood === 'good' ? 0.7 : 0.45} />
        </>
      )}
      {mood === 'popcorn' && (
        <>
          <ellipse cx="50" cy="92" rx="8" ry="5" fill="#f97316" opacity="0.35" />
          <ellipse cx="110" cy="92" rx="8" ry="5" fill="#f97316" opacity="0.35" />
        </>
      )}

      {/* 코 */}
      <path d="M80 82 q3.5 4 -1 6.5" stroke="#e8a87c" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* ===== 눈썹 ===== */}
      {mood === 'good' && (
        <>
          <path d="M48 56 Q60 50 71 55" stroke={line} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M89 55 Q100 50 112 56" stroke={line} strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      )}
      {mood === 'normal' && (
        <>
          <path d="M49 58 Q60 55 70 57" stroke={line} strokeWidth="2.8" fill="none" strokeLinecap="round" />
          <path d="M90 57 Q100 55 111 58" stroke={line} strokeWidth="2.8" fill="none" strokeLinecap="round" />
        </>
      )}
      {mood === 'popcorn' && (
        <>
          <path d="M49 54 Q60 58 70 55" stroke={line} strokeWidth="2.8" fill="none" strokeLinecap="round" />
          <path d="M90 55 Q100 58 111 54" stroke={line} strokeWidth="2.8" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* ===== 큰 눈망울 (애니메이션체) ===== */}
      {(mood === 'good' || mood === 'normal') && (
        <>
          {[58, 102].map((cx, i) => (
            <g key={cx}>
              <ellipse cx={cx} cy="74" rx={mood === 'good' ? 9.5 : 8.5} ry={mood === 'good' ? 12 : 11} fill="url(#eyeG)" />
              <circle cx={cx + 3} cy="69" r="3.4" fill="#fff" className="anim-shine" />
              <circle cx={cx - 3} cy="79" r="1.8" fill="#fff" opacity="0.85" />
              {mood === 'good' && (
                <path d={`M${cx - 2} 65 l1.2 2.4 2.6 .3-1.9 1.8 .5 2.6-2.4-1.3-2.4 1.3 .5-2.6-1.9-1.8 2.6-.3z`} fill="#fff" />
              )}
              {/* 윗속눈썹 라인 */}
              <path d={`M${cx - 10} 66 Q${cx} 60 ${cx + 10} 66`} stroke={line} strokeWidth="2.6" fill="none" strokeLinecap="round" />
            </g>
          ))}
        </>
      )}
      {mood === 'popcorn' && (
        <>
          <path d={spiralPath(58, 74)} stroke={line} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d={spiralPath(102, 74)} stroke={line} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          {/* 땀방울 */}
          <path d="M122 62 q-5 9 0 12 q5 -3 0 -12 Z" fill="#7dd3fc" stroke="#38bdf8" strokeWidth="0.8" />
        </>
      )}
      {mood === 'tired' && (
        <>
          <path d="M48 74 Q58 80 68 74" stroke={line} strokeWidth="3.2" fill="none" strokeLinecap="round" />
          <path d="M92 74 Q102 80 112 74" stroke={line} strokeWidth="3.2" fill="none" strokeLinecap="round" />
          <path d="M50 81 Q58 84 66 81" stroke="#d9a679" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M94 81 Q102 84 110 81" stroke="#d9a679" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* ===== 눈 깜빡임 눈꺼풀 (좋음/보통일 때만) ===== */}
      {showBlink && (mood === 'good' || mood === 'normal') && (
        <>
          <path d="M47 74 Q58 62 69 74 Q58 76 47 74 Z" fill="url(#skinG)" className="anim-blink" />
          <path d="M91 74 Q102 62 113 74 Q102 76 91 74 Z" fill="url(#skinG)" className="anim-blink b2" />
        </>
      )}

      {/* ===== 입 ===== */}
      {mood === 'good' && (
        <>
          <path d="M60 97 Q80 120 100 97 Q80 106 60 97 Z" fill="#b93b3b" />
          <path d="M72 105 Q80 110 88 105" fill="#ff8b8b" />
        </>
      )}
      {mood === 'normal' && (
        <path d="M69 101 Q80 109 91 101" stroke={line} strokeWidth="3.2" fill="none" strokeLinecap="round" />
      )}
      {mood === 'popcorn' && (
        <path d="M64 102 q4 -6 8 0 q4 6 8 0 q4 -6 8 0" stroke={line} strokeWidth="3.2" fill="none" strokeLinecap="round" />
      )}
      {mood === 'tired' && (
        <ellipse cx="80" cy="104" rx="8.5" ry="11" fill="#b93b3b" />
      )}

      {/* ===== 표정별 장식 ===== */}
      {mood === 'tired' && (
        <>
          <text x="120" y="48" fontSize="13" fill="#94a3b8" fontFamily="Jua, sans-serif" className="anim-idle">z</text>
          <text x="128" y="34" fontSize="18" fill="#cbd5e1" fontFamily="Jua, sans-serif">Z</text>
        </>
      )}
      {mood === 'popcorn' && (
        <>
          <text x="22" y="34" fontSize="16">🍿</text>
          <text x="120" y="26" fontSize="13">🍿</text>
        </>
      )}
      {mood === 'good' && (
        <>
          <text x="20" y="42" fontSize="14" className="anim-shine">✨</text>
          <text x="122" y="52" fontSize="12" className="anim-shine">✨</text>
        </>
      )}

      {/* ===== 성장 스타일 액세서리 ===== */}
      {/* 공부왕: 동그란 안경 */}
      {isSmart && (
        <g stroke="#2f2a45" strokeWidth="3" fill="rgba(180,220,255,0.22)">
          <circle cx="58" cy="75" r="15" />
          <circle cx="102" cy="75" r="15" />
          <line x1="73" y1="73" x2="87" y2="73" />
          <line x1="43" y1="72" x2="33" y2="70" />
          <line x1="117" y1="72" x2="127" y2="70" />
          <line x1="50" y1="66" x2="62" y2="69" stroke="#fff" strokeWidth="2" opacity="0.7" />
        </g>
      )}
      {/* 운동왕: 땀방울 + 활기찬 반짝 */}
      {isFit && (
        <>
          <path d="M120 58 q-4 8 0 11 q4 -3 0 -11 Z" fill="#7dd3fc" stroke="#38bdf8" strokeWidth="0.8" />
          <text x="18" y="46" fontSize="14" className="anim-shine">✨</text>
          {level >= 2 && <text x="120" y="40" fontSize="15">🔥</text>}
        </>
      )}
      {/* 게임중독: 다크서클 + 볼 때꼽 + 냄새선 + 파리 */}
      {isMessy && (
        <>
          <path d="M50 82 Q58 86 66 82" stroke="#9a8a6a" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M94 82 Q102 86 110 82" stroke="#9a8a6a" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M103 93 q4 2 8 -1" stroke="#6b5a3a" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
          <circle cx="52" cy="96" r="1.5" fill="#6b5a3a" opacity="0.6" />
          {/* 냄새선 */}
          <path d="M34 22 q-5 -6 0 -11 q5 -5 0 -11" stroke="#9acd32" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.8" />
          <path d="M126 24 q5 -6 0 -11 q-5 -5 0 -11" stroke="#9acd32" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.8" />
          <text x="120" y="20" fontSize="13" className="anim-idle">🪰</text>
          {level >= 2 && <text x="24" y="18" fontSize="12" className="anim-idle">🪰</text>}
          {level >= 2 && (
            <g transform="translate(100 96) rotate(12)"><rect x="-7" y="-4" width="14" height="8" rx="2" fill="#f4d58d" stroke="#d9b45a" strokeWidth="0.8" /><line x1="0" y1="-4" x2="0" y2="4" stroke="#d9b45a" strokeWidth="0.8" /></g>
          )}
        </>
      )}
    </svg>
  )
}
