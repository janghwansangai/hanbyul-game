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
  const skin = '#ffd9b3', skinShade = '#f2b98c', hair = '#3f2d20'
  const blush = '#ff9aa2', line = '#4a3728', shirt = '#6366f1', shirtDark = '#4f46e5'

  return (
    <svg viewBox="0 0 160 172" className={className} style={style} xmlns="http://www.w3.org/2000/svg">
      {/* 몸/어깨 (별이 그려진 티셔츠) */}
      <path d="M30 172 Q30 128 80 124 Q130 128 130 172 Z" fill={shirt} />
      <path d="M30 172 Q30 148 46 138 L46 172 Z" fill={shirtDark} opacity="0.5" />
      <path d="M114 138 Q130 148 130 172 L114 172 Z" fill={shirtDark} opacity="0.5" />
      <path d="M80 138 l3.4 7 7.7 1-5.6 5.4 1.3 7.6-6.8-3.6-6.8 3.6 1.3-7.6-5.6-5.4 7.7-1z" fill="#fde047" />

      {/* 목 */}
      <rect x="70" y="112" width="20" height="16" rx="8" fill={skinShade} />

      {/* 귀 */}
      <circle cx="34" cy="80" r="9" fill={skin} />
      <circle cx="126" cy="80" r="9" fill={skin} />

      {/* 머리 */}
      <circle cx="80" cy="76" r="46" fill={skin} />
      {/* 머리카락 */}
      <path d="M34 74 Q30 30 80 28 Q130 30 126 74 Q120 52 108 50 Q112 40 96 40 Q98 32 80 34 Q62 32 64 40 Q48 40 52 50 Q40 52 34 74 Z" fill={hair} />
      <path d="M64 40 Q74 46 92 42" stroke={hair} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6" />

      {/* 볼터치 (좋음/보통일 때) */}
      {(mood === 'good' || mood === 'normal') && (
        <>
          <ellipse cx="52" cy="90" rx="8" ry="5" fill={blush} opacity="0.55" />
          <ellipse cx="108" cy="90" rx="8" ry="5" fill={blush} opacity="0.55" />
        </>
      )}

      {/* 코 */}
      <path d="M80 82 q3 4 -1 6" stroke={skinShade} strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* ===== 표정별 눈 ===== */}
      {mood === 'good' && (
        <>
          <circle cx="60" cy="72" r="8" fill={line} />
          <circle cx="100" cy="72" r="8" fill={line} />
          <circle cx="63" cy="69" r="2.6" fill="#fff" />
          <circle cx="103" cy="69" r="2.6" fill="#fff" />
          <path d="M50 60 Q60 54 70 60" stroke={line} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M90 60 Q100 54 110 60" stroke={line} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      )}
      {mood === 'normal' && (
        <>
          <ellipse cx="60" cy="73" rx="5" ry="6.5" fill={line} />
          <ellipse cx="100" cy="73" rx="5" ry="6.5" fill={line} />
          <circle cx="62" cy="70" r="1.8" fill="#fff" />
          <circle cx="102" cy="70" r="1.8" fill="#fff" />
        </>
      )}
      {mood === 'popcorn' && (
        <>
          <path d={spiralPath(60, 73)} stroke={line} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d={spiralPath(100, 73)} stroke={line} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          {/* 땀방울 */}
          <path d="M120 60 q-5 8 0 11 q5 -3 0 -11 Z" fill="#7dd3fc" />
        </>
      )}
      {mood === 'tired' && (
        <>
          <path d="M52 74 Q60 79 68 74" stroke={line} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M92 74 Q100 79 108 74" stroke={line} strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* 다크서클 */}
          <path d="M54 80 Q60 83 66 80" stroke={skinShade} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M94 80 Q100 83 106 80" stroke={skinShade} strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* ===== 표정별 입 ===== */}
      {mood === 'good' && (
        <path d="M62 96 Q80 116 98 96 Q80 104 62 96 Z" fill="#c0392b" />
      )}
      {mood === 'normal' && (
        <path d="M70 100 Q80 107 90 100" stroke={line} strokeWidth="3" fill="none" strokeLinecap="round" />
      )}
      {mood === 'popcorn' && (
        <path d="M66 101 q4 -6 8 0 q4 6 8 0 q4 -6 8 0" stroke={line} strokeWidth="3" fill="none" strokeLinecap="round" />
      )}
      {mood === 'tired' && (
        <ellipse cx="80" cy="103" rx="8" ry="10" fill="#c0392b" />
      )}

      {/* ===== 표정별 장식 ===== */}
      {mood === 'tired' && (
        <>
          <text x="118" y="46" fontSize="13" fill="#94a3b8" fontFamily="Jua, sans-serif">z</text>
          <text x="126" y="34" fontSize="17" fill="#cbd5e1" fontFamily="Jua, sans-serif">Z</text>
        </>
      )}
      {mood === 'popcorn' && (
        <>
          <text x="24" y="34" fontSize="15">🍿</text>
          <text x="118" y="28" fontSize="13">🍿</text>
        </>
      )}
    </svg>
  )
}
