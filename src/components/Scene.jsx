/*
 * 배경 장면. 한별이가 지내는 공간을 보여준다.
 *  - scene='room'  : 한별이의 방 (게임/독서/대화/휴식)
 *  - scene='park'  : 밖 (축구/줄넘기 등 운동)
 * 시간대(hour)에 따라 창밖/하늘이 아침·낮·저녁·밤으로 바뀐다.
 *
 * 화면 위쪽은 상태창 카드, 아래쪽은 행동 버튼이 덮으므로
 * 창문·가구·바닥 같은 볼거리는 화면 '가운데 띠'(viewBox y≈230~560)에 모아 배치한다.
 */

const GY = 470 // 바닥선 (벽/바닥 경계)

function timeOfDay(hour, day) {
  if (day === 7 && hour >= 14 && hour < 20) return { key: 'battle', sky: ['#3b2f7a', '#c05a9e'], cel: 'moon', celColor: '#ffd1f0', night: true }
  if (hour < 10) return { key: 'morning', sky: ['#ffd6e8', '#bfe3ff'], cel: 'sun', celColor: '#ffe07a', night: false }
  if (hour < 17) return { key: 'day', sky: ['#8fd3ff', '#daf0ff'], cel: 'sun', celColor: '#ffe27a', night: false }
  if (hour < 20) return { key: 'evening', sky: ['#ff9d6c', '#a97bd6'], cel: 'sun', celColor: '#ffb347', night: false }
  return { key: 'night', sky: ['#1b1f52', '#080a1f'], cel: 'moon', celColor: '#f3f4c7', night: true }
}

function Cloud({ x, y, s = 1, o = 0.9 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      <ellipse cx="0" cy="0" rx="22" ry="14" fill="#fff" />
      <ellipse cx="20" cy="4" rx="18" ry="12" fill="#fff" />
      <ellipse cx="-18" cy="4" rx="15" ry="10" fill="#fff" />
    </g>
  )
}

function Stars({ seed = 1, count = 14, w = 120, h, x = 0, y = 0 }) {
  const hh = h ?? w * 0.9
  const stars = []
  let s = seed * 9301 + 49297
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280 }
  for (let i = 0; i < count; i++) {
    stars.push(<circle key={i} cx={x + rnd() * w} cy={y + rnd() * hh} r={rnd() > 0.7 ? 1.7 : 1} fill="#fff" opacity={0.5 + rnd() * 0.5} />)
  }
  return <g className="anim-twinkle">{stars}</g>
}

/* ================= 방 ================= */
function Room({ t }) {
  const wall = t.night ? '#3b3357' : '#fbe6cf'
  const wallLow = t.night ? '#322b4a' : '#f0cba4'
  const floor = t.night ? '#5a4a53' : '#d99f66'
  const floorLine = t.night ? '#4a3c45' : '#c6884d'
  const wood = t.night ? '#6b5560' : '#b9793f'

  return (
    <g>
      <defs>
        <linearGradient id="roomWin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={t.sky[0]} /><stop offset="100%" stopColor={t.sky[1]} />
        </linearGradient>
        <clipPath id="winClip"><rect x="163" y="253" width="94" height="104" rx="6" /></clipPath>
      </defs>

      {/* 벽 / 바닥 */}
      <rect x="0" y="0" width="420" height={GY} fill={wall} />
      <rect x="0" y={GY - 16} width="420" height="16" fill={wallLow} />
      <rect x="0" y={GY} width="420" height={820 - GY} fill={floor} />
      {[GY + 55, GY + 120, GY + 195, GY + 275].map((y) => <line key={y} x1="0" y1={y} x2="420" y2={y} stroke={floorLine} strokeWidth="2" opacity="0.5" />)}
      {[70, 210, 350].map((x) => <line key={x} x1={x} y1={GY} x2={x - 45} y2="820" stroke={floorLine} strokeWidth="2" opacity="0.35" />)}

      {/* 창문 (창밖 하늘) — 가운데 위 */}
      <g>
        <rect x="155" y="245" width="110" height="120" rx="10" fill="#8a6a4a" />
        <rect x="163" y="253" width="94" height="104" rx="6" fill="url(#roomWin)" />
        <g clipPath="url(#winClip)">
          {t.cel === 'sun'
            ? <circle cx="185" cy="282" r="14" fill={t.celColor} />
            : <g><circle cx="238" cy="280" r="13" fill={t.celColor} /><circle cx="232" cy="276" r="11" fill="url(#roomWin)" /></g>}
          {t.night ? <Stars seed={3} count={12} w={94} h={104} x={163} y={253} /> : <><Cloud x={212} y={296} s={0.65} /><Cloud x={185} y={332} s={0.5} o={0.8} /></>}
        </g>
        <line x1="210" y1="253" x2="210" y2="357" stroke="#8a6a4a" strokeWidth="5" />
        <line x1="163" y1="305" x2="257" y2="305" stroke="#8a6a4a" strokeWidth="5" />
      </g>

      {/* 왼쪽 벽: 선반 + 책 */}
      <rect x="18" y="330" width="92" height="9" rx="3" fill="#a9805a" />
      {[{ x: 24, h: 34, c: '#ef6f6c' }, { x: 38, h: 40, c: '#f7c948' }, { x: 52, h: 30, c: '#57c4b8' }, { x: 64, h: 38, c: '#6ea8ff' }, { x: 78, h: 32, c: '#c78bff' }, { x: 92, h: 36, c: '#7ed957' }].map((b, i) =>
        <rect key={i} x={b.x} y={330 - b.h} width="11" height={b.h} rx="1.5" fill={b.c} />)}

      {/* 오른쪽 벽: 벽시계 + 액자 */}
      <circle cx="350" cy="285" r="23" fill="#fff" stroke="#8a6a4a" strokeWidth="4" />
      <line x1="350" y1="285" x2="350" y2="271" stroke="#5b4636" strokeWidth="3" strokeLinecap="round" />
      <line x1="350" y1="285" x2="361" y2="290" stroke="#5b4636" strokeWidth="3" strokeLinecap="round" />
      <circle cx="350" cy="285" r="2.5" fill="#5b4636" />
      <rect x="305" y="330" width="58" height="46" rx="4" fill="#fff" stroke="#a9805a" strokeWidth="4" />
      <path d="M334 340 l3 6 6.4 .9-4.7 4.5 1.1 6.4-5.8-3.1-5.8 3.1 1.1-6.4-4.7-4.5 6.4-.9z" fill="#ffd84d" />

      {/* 러그 */}
      <ellipse cx="210" cy={GY + 90} rx="150" ry="44" fill={t.night ? '#4b5b7a' : '#8fd0e8'} opacity="0.55" />
      <ellipse cx="210" cy={GY + 90} rx="118" ry="32" fill="none" stroke={t.night ? '#6b7ba0' : '#bfe8f5'} strokeWidth="4" opacity="0.6" />

      {/* 침대 (왼쪽 아래) */}
      <g>
        <rect x="-10" y={GY + 40} width="150" height="80" rx="10" fill={t.night ? '#7a6f8f' : '#cdb2f0'} />
        <rect x="-10" y={GY} width="26" height="120" rx="8" fill={t.night ? '#5f5677' : '#a98fd6'} />
        <rect x="4" y={GY + 40} width="58" height="38" rx="8" fill="#fff" opacity="0.9" />
        <rect x="58" y={GY + 52} width="82" height="68" rx="8" fill={t.night ? '#8f83ad' : '#e6d8ff'} />
      </g>

      {/* 책상 (오른쪽 아래) + 노트북 + 스탠드 */}
      <g>
        <rect x="300" y={GY + 58} width="130" height="14" rx="4" fill={wood} />
        <rect x="312" y={GY + 72} width="10" height="90" fill={wood} />
        <rect x="408" y={GY + 72} width="10" height="90" fill={wood} />
        <rect x="330" y={GY + 30} width="48" height="30" rx="3" fill="#3a3352" />
        <rect x="334" y={GY + 34} width="40" height="22" rx="2" fill={t.night ? '#6ea8ff' : '#bfe3ff'} />
        <rect x="324" y={GY + 58} width="60" height="6" rx="2" fill="#5b5273" />
        <line x1="404" y1={GY + 58} x2="404" y2={GY + 26} stroke="#8a6a4a" strokeWidth="4" />
        <path d={`M404 ${GY + 26} l-14 6 6 10 14 -6 z`} fill="#f7c948" />
        {t.night && <circle cx="398" cy={GY + 44} r="26" fill="#fff3c4" opacity="0.35" />}
      </g>

      {/* 화분 */}
      <g transform={`translate(272 ${GY + 8})`}>
        <path d="M0 20 h30 l-4 30 h-22 z" fill="#e07a5f" />
        <path d="M15 20 C 2 6 -2 -10 4 -14 C 12 -8 15 4 15 20 Z" fill="#57b85a" />
        <path d="M15 20 C 28 6 32 -10 26 -14 C 18 -8 15 4 15 20 Z" fill="#4aa84d" />
        <path d="M15 22 C 15 2 15 -12 15 -18 C 15 -12 15 4 15 22 Z" fill="#63c766" />
      </g>

      {t.night && <rect x="0" y="0" width="420" height="820" fill="#1a1830" opacity="0.28" />}
    </g>
  )
}

/* ================= 공원 (운동) ================= */
function Park({ t }) {
  const grass = t.night ? '#2f5d3a' : '#7ec850'
  const grassDark = t.night ? '#264c30' : '#5fb03e'
  const hill = t.night ? '#274f31' : '#9bd86a'

  return (
    <g>
      <defs>
        <linearGradient id="parkSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={t.sky[0]} /><stop offset="100%" stopColor={t.sky[1]} />
        </linearGradient>
      </defs>

      {/* 하늘 */}
      <rect x="0" y="0" width="420" height={GY} fill="url(#parkSky)" />
      {t.cel === 'sun'
        ? <g><circle cx="345" cy="235" r="30" fill={t.celColor} /><circle cx="345" cy="235" r="42" fill={t.celColor} opacity="0.25" /></g>
        : <g><circle cx="345" cy="235" r="26" fill={t.celColor} /><circle cx="336" cy="229" r="22" fill="url(#parkSky)" /></g>}
      {t.night ? <Stars seed={7} count={20} w={420} h={GY} x={0} y={0} />
        : <><Cloud x={90} y={250} s={1.05} /><Cloud x={235} y={300} s={0.75} /><Cloud x={150} y={210} s={0.6} o={0.7} /></>}

      {/* 언덕 */}
      <ellipse cx="90" cy={GY + 20} rx="220" ry="90" fill={hill} />
      <ellipse cx="360" cy={GY + 20} rx="200" ry="80" fill={hill} />

      {/* 잔디밭 */}
      <rect x="0" y={GY} width="420" height={820 - GY} fill={grass} />
      <path d={`M0 ${GY} Q210 ${GY - 26} 420 ${GY} L420 ${GY + 60} L0 ${GY + 60} Z`} fill={grassDark} opacity="0.5" />
      {[30, 95, 300, 380, 200].map((x, i) => (
        <g key={i} stroke={grassDark} strokeWidth="3" strokeLinecap="round">
          <line x1={x} y1={GY + 130} x2={x - 6} y2={GY + 116} /><line x1={x} y1={GY + 130} x2={x} y2={GY + 112} /><line x1={x} y1={GY + 130} x2={x + 6} y2={GY + 116} />
        </g>
      ))}

      {/* 축구 골대 (왼쪽) */}
      <g stroke="#f4f4f5" strokeWidth="5" fill="none" opacity="0.95">
        <rect x="18" y={GY - 90} width="96" height="70" rx="2" />
        <line x1="18" y1={GY - 90} x2="34" y2={GY - 74} /><line x1="114" y1={GY - 90} x2="98" y2={GY - 74} />
        <line x1="18" y1={GY - 20} x2="34" y2={GY - 36} /><line x1="114" y1={GY - 20} x2="98" y2={GY - 36} />
        {[34, 50, 66, 82, 98].map((x) => <line key={x} x1={x} y1={GY - 74} x2={x} y2={GY - 36} strokeWidth="1.5" opacity="0.6" />)}
        {[GY - 66, GY - 52, GY - 38].map((y) => <line key={y} x1="34" y1={y} x2="98" y2={y} strokeWidth="1.5" opacity="0.6" />)}
      </g>

      {/* 축구공 */}
      <g transform={`translate(120 ${GY + 66})`}>
        <ellipse cx="0" cy="24" rx="20" ry="6" fill="#000" opacity="0.15" />
        <circle cx="0" cy="0" r="21" fill="#fff" stroke="#334155" strokeWidth="2" />
        <path d="M0 -9 l9 6 -3.5 10 h-11 l-3.5 -10 z" fill="#334155" />
        <path d="M0 -21 l0 12 M9 -3 l10 -6 M-9 -3 l-10 -6 M5.5 7 l6 11 M-5.5 7 l-6 11" stroke="#334155" strokeWidth="2" />
      </g>

      {/* 나무 (오른쪽) */}
      <g transform={`translate(362 ${GY - 60})`}>
        <rect x="-8" y="30" width="16" height="90" rx="4" fill={t.night ? '#4a3b2a' : '#8a5a3a'} />
        <circle cx="0" cy="6" r="44" fill={t.night ? '#2f5d3a' : '#5fae3e'} />
        <circle cx="-28" cy="28" r="30" fill={t.night ? '#274f31' : '#6ec24a'} />
        <circle cx="28" cy="28" r="30" fill={t.night ? '#274f31' : '#6ec24a'} />
      </g>

      {/* 벤치 (왼쪽 아래) */}
      <g transform={`translate(34 ${GY + 108})`} stroke={t.night ? '#5a4a3a' : '#a9805a'} strokeWidth="6" strokeLinecap="round">
        <line x1="0" y1="0" x2="72" y2="0" /><line x1="0" y1="14" x2="72" y2="14" />
        <line x1="6" y1="14" x2="6" y2="34" /><line x1="66" y1="14" x2="66" y2="34" />
      </g>

      {t.night && <rect x="0" y="0" width="420" height="820" fill="#0e1230" opacity="0.30" />}
    </g>
  )
}

export default function Scene({ scene, hour, day, className = '' }) {
  const t = timeOfDay(hour, day)
  return (
    <div className={`absolute inset-0 -z-10 overflow-hidden pointer-events-none ${className}`}>
      <svg viewBox="0 0 420 820" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        {scene === 'park' ? <Park t={t} /> : <Room t={t} />}
      </svg>
    </div>
  )
}
