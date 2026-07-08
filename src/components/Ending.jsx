import { useEffect, useMemo, useState } from 'react'
import { BADGES, TITLES, titleOf } from '../game/data.js'
import { sfx } from '../game/sound.js'

export function Confetti({ n = 60 }) {
  const pieces = useMemo(() =>
    Array.from({ length: n }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2.5,
      dur: 2.5 + Math.random() * 2.5,
      size: 6 + Math.random() * 8,
      color: ['#f472b6', '#facc15', '#4ade80', '#38bdf8', '#a78bfa', '#fb923c'][i % 6],
      rot: Math.random() > 0.5,
    })), [n])
  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {pieces.map((p) => (
        <div key={p.id} className="anim-confetti absolute"
          style={{
            left: `${p.left}%`, top: '-5vh',
            width: p.size, height: p.size * (p.rot ? 0.5 : 1),
            background: p.color, borderRadius: p.rot ? 1 : '50%',
            animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s`,
          }} />
      ))}
    </div>
  )
}

function StatRow({ icon, label, value, color, invert }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-5">{icon}</span>
      <span className="w-24 text-left">{label}</span>
      <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="w-8 text-right font-bold">{value}</span>
    </div>
  )
}

function ReportCard({ g, accent }) {
  const [pledgeText, setPledgeText] = useState('')
  const [engraved, setEngraved] = useState(false)
  const t = titleOf(g.xp)
  const c = g.counters

  return (
    <div className={`bg-white rounded-3xl shadow-2xl p-5 text-slate-800 w-full`} style={{ borderTop: `10px solid ${accent}` }}>
      <h3 className="text-xl text-center">📋 한별이의 7일 성적표</h3>
      <p className="text-center text-2xl mt-2">{t.icon} <b>{t.name}</b> <span className="text-sm text-slate-500">Lv.{g.level}</span></p>

      <div className="mt-4 space-y-2">
        <StatRow icon="🍿" label="팝콘 브레인" value={g.stats.popcorn} color="#ef4444" />
        <StatRow icon="💪" label="체력" value={g.stats.health} color="#22c55e" />
        <StatRow icon="🧠" label="자기관리" value={g.stats.selfcare} color="#3b82f6" />
        <StatRow icon="😊" label="행복" value={g.stats.happy} color="#eab308" />
      </div>

      <div className="mt-4 grid grid-cols-4 gap-1 text-center text-xs bg-slate-50 rounded-2xl p-3">
        <div><div className="text-lg">🎮</div>게임 {c.totalGames}회</div>
        <div><div className="text-lg">⚽</div>운동 {c.exercise}회</div>
        <div><div className="text-lg">📖</div>독서 {c.reading}회</div>
        <div><div className="text-lg">🧘</div>절제 {c.quitWins}회</div>
      </div>

      <div className="mt-4">
        <p className="text-sm text-slate-500 mb-2">🏅 획득한 뱃지 ({g.badges.length}/{BADGES.length})</p>
        <div className="grid grid-cols-5 gap-2">
          {BADGES.map((b) => (
            <div key={b.id} title={b.name}
              className={`aspect-square rounded-xl flex items-center justify-center text-2xl ${g.badges.includes(b.id) ? 'bg-yellow-50 border-2 border-yellow-300' : 'bg-slate-100 opacity-30 grayscale'}`}>
              {b.icon}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        {engraved ? (
          <div className="bg-gradient-to-r from-indigo-50 to-pink-50 border-2 border-dashed rounded-2xl p-3 text-center anim-pop" style={{ borderColor: accent }}>
            <p className="text-xs text-slate-400">나의 다짐</p>
            <p className="text-lg mt-1">"{pledgeText}"</p>
          </div>
        ) : (
          <div className="flex gap-2">
            <input value={pledgeText} onChange={(e) => setPledgeText(e.target.value)}
              placeholder="나의 한 줄 다짐 쓰기…" maxLength={30}
              className="flex-1 border-2 border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400" />
            <button onClick={() => { if (pledgeText.trim()) { setEngraved(true); sfx.good() } }}
              className="px-3 py-2 rounded-xl text-white text-sm active:scale-95 transition" style={{ background: accent }}>
              새기기
            </button>
          </div>
        )}
      </div>
      <p className="text-center text-[10px] text-slate-400 mt-3">📸 캡처해서 친구들과 비교해 봐!</p>
    </div>
  )
}

function useTyping(text, speed = 45) {
  const [out, setOut] = useState('')
  useEffect(() => {
    let i = 0
    const t = setInterval(() => {
      i++
      setOut(text.slice(0, i))
      if (i >= text.length) clearInterval(t)
    }, speed)
    return () => clearInterval(t)
  }, [text, speed])
  return out
}

const NORMAL_TIPS = [
  { key: 'exercise', limit: 3, tip: '⚽ 운동은 팝콘 지수를 낮추는 특효약! 하루 30분만 몸을 움직여 봐.' },
  { key: 'earlyBird', limit: 3, tip: '🌙 22시 전에 자면 다음 날 집중력이 완전히 달라져.' },
  { key: 'quitWins', limit: 3, tip: "🧘 '한 판만 더'가 들리면 딱 3초만 참아 봐. 그 3초가 승부처야." },
  { key: 'reading', limit: 3, tip: '📚 하루 20분 독서는 뇌를 천천히 즐기는 연습이야.' },
  { key: 'talk', limit: 3, tip: '💬 가족과의 수다는 최고의 스트레스 해소제!' },
]

export default function Ending({ g, onRestart }) {
  const type = g.ending

  useEffect(() => {
    if (type === 'balance' || type === 'happy') sfx.fanfare()
    else if (type === 'bad') sfx.warn()
  }, [type])

  const badText = useTyping(type === 'bad'
    ? '경고: 팝콘 브레인 지수가 위험 수준입니다.\n뇌가 강한 자극에만 반응하고 있어요.\n하지만… 아직 늦지 않았어요.' : '')

  const tips = useMemo(() => {
    const list = NORMAL_TIPS.filter((t) => g.counters[t.key] < t.limit).map((t) => t.tip)
    while (list.length < 3) list.push('😊 잘하고 있는 것들은 계속 이어가면 돼!')
    return list.slice(0, 3)
  }, [g])

  if (type === 'bad') {
    return (
      <div className="min-h-screen bg-black flex justify-center anim-flicker" style={{ filter: 'grayscale(0.9)' }}>
        <div className="w-full max-w-[420px] p-6 flex flex-col items-center justify-center text-center min-h-screen">
          <div className="text-8xl anim-wobble">🍿</div>
          <h1 className="text-3xl text-red-500 mt-6 anim-glitch">BAD ENDING</h1>
          <p className="text-slate-300 mt-6 whitespace-pre-line text-sm leading-loose min-h-24 font-mono">{badText}<span className="animate-pulse">▌</span></p>
          <div className="mt-8 w-full"><ReportCard g={g} accent="#64748b" /></div>
          <p className="text-purple-400 text-sm mt-8 italic anim-fadein">
            👹 "괜찮아… 처음부터 다시 하면 되잖아? <br />한 판만 더 하자…"
          </p>
          <p className="text-slate-500 text-xs mt-2">…어? 이 말투, 어디서 많이 들어봤는데?</p>
          <button onClick={onRestart}
            className="mt-6 w-full py-4 bg-red-600 text-white text-xl rounded-2xl shadow-lg active:scale-95 transition">
            🔄 다시 도전하기
          </button>
        </div>
      </div>
    )
  }

  const conf = {
    balance: {
      bg: 'linear-gradient(160deg,#fecdd3,#fef3c7,#bbf7d0,#bfdbfe,#e9d5ff)',
      icon: '🌈', title: '밸런스 마스터!', accent: '#8b5cf6',
      sub: '게임도 즐기고, 운동도 하고, 잠도 잘 잤어.\n유혹을 아는 사람만이 유혹을 이길 수 있지.\n너는 게임을 "즐길 줄 아는" 진짜 마스터야!',
      confetti: 90,
    },
    happy: {
      bg: 'linear-gradient(160deg,#fef9c3,#bae6fd)',
      icon: '🌟', title: '해피 엔딩!', accent: '#f59e0b',
      sub: '팝콘 브레인을 완벽하게 다스렸어!\n인터넷 중독 예방 마스터의 탄생이야.',
      confetti: 60,
    },
    normal: {
      bg: 'linear-gradient(160deg,#e0e7ff,#fce7f3)',
      icon: '🙂', title: '조금만 더!', accent: '#6366f1',
      sub: '일주일 동안 수고했어.\n아래 3가지만 기억하면 다음엔 분명 더 잘할 거야!',
      confetti: 0,
    },
  }[type] || {}

  return (
    <div className="min-h-screen flex justify-center" style={{ background: conf.bg }}>
      {conf.confetti > 0 && <Confetti n={conf.confetti} />}
      <div className="w-full max-w-[420px] p-5 flex flex-col items-center text-center">
        <div className="text-8xl mt-10 anim-pop">{conf.icon}</div>
        <h1 className="text-3xl mt-4 text-slate-800 anim-pop">{conf.title}</h1>
        <p className="text-slate-600 mt-3 text-sm whitespace-pre-line leading-relaxed">{conf.sub}</p>

        {type === 'balance' && (
          <div className="mt-3 bg-white/70 rounded-2xl px-4 py-2 text-xs text-purple-700 anim-pop">
            🎮 게임 {g.counters.totalGames}회를 하고도 팝콘 지수 {g.stats.popcorn}! 이게 바로 균형이다!
          </div>
        )}

        {type === 'normal' && (
          <div className="mt-4 w-full space-y-2">
            {tips.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl shadow p-3 text-sm text-slate-700 text-left anim-pop" style={{ animationDelay: `${i * 0.15}s` }}>
                {t}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 w-full"><ReportCard g={g} accent={conf.accent} /></div>

        <button onClick={onRestart}
          className="mt-6 mb-10 w-full py-4 bg-slate-800 text-white text-lg rounded-2xl shadow-lg active:scale-95 transition">
          🔄 처음부터 다시 하기
        </button>
      </div>
    </div>
  )
}
