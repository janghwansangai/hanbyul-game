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

export function Hanbyul({ mood = 'normal', className = '', style }) {
  const [, tick] = useState(0)
  useEffect(() => { probeImages(() => tick((n) => n + 1)) }, [])

  if (available[mood]) {
    return (
      <img src={`${BASE}characters/${FILES[mood]}`} alt="한별이"
        className={`object-contain ${className}`} style={style}
        onError={() => { available[mood] = false; tick((n) => n + 1) }} />
    )
  }
  return <HanbyulSVG mood={mood} className={className} style={style} />
}

/* ---------- SVG로 그린 한별이 ---------- */

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

function HanbyulSVG({ mood, className, style }) {
  const line = '#5b4636', hair = '#3b2a1e', hairHi = '#6b4f38'
  const blush = '#ff8fa3', shirt = 'url(#shirtG)', outline = '#e8a97e'
  const showBlink = mood !== 'tired' // 자는 눈엔 깜빡임 없음

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

      {/* ===== 몸 (숨쉬는 애니메이션) ===== */}
      <g className="anim-breathe">
        <path d="M26 176 Q24 126 80 121 Q136 126 134 176 Z" fill={shirt} stroke={outline} strokeWidth="1.5" />
        <path d="M26 176 Q26 146 44 135 L46 176 Z" fill="#4f46e5" opacity="0.35" />
        <path d="M116 135 Q134 146 134 176 L114 176 Z" fill="#4f46e5" opacity="0.35" />
        {/* 옷깃 */}
        <path d="M66 124 Q80 134 94 124" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
        {/* 가슴의 별 */}
        <path d="M80 139 l3.6 7.3 8 1.1-5.8 5.7 1.4 8-7.2-3.8-7.2 3.8 1.4-8-5.8-5.7 8-1.1z" fill="#ffe14d" stroke="#f5b800" strokeWidth="1" />
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
        <path d="M31 80 Q22 28 80 24 Q138 28 129 80 Q123 52 108 49 Q114 37 95 38 Q99 27 80 30 Q61 27 65 38 Q46 37 52 49 Q37 52 31 80 Z"
          fill={hair} />
        {/* 앞머리 결 */}
        <path d="M80 30 Q70 40 60 48" stroke={hairHi} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.55" />
        <path d="M88 31 Q96 40 104 49" stroke={hairHi} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.55" />
        {/* 머리 윤기 */}
        <path d="M58 40 Q70 33 84 35" stroke="#8a6a4a" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.5" />
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
    </svg>
  )
}
