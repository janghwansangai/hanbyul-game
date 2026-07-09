import { useEffect, useMemo, useRef, useState } from 'react'
import { QUIZ, TEMPT_NOTIS, REAL_NOTIS } from '../game/data.js'
import { sfx } from '../game/sound.js'

/* ========== 4일차 미드보스: 팝콘 브레인 몬스터 ========== */
export function MidBoss({ fast, onEnd }) {
  const [stage, setStage] = useState('intro') // intro | play | result
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(10)
  const [targets, setTargets] = useState([])
  const idRef = useRef(0)

  useEffect(() => {
    if (stage !== 'play') return
    const spawnMs = fast ? 420 : 550
    const life = fast ? 700 : 900
    const spawn = setInterval(() => {
      const id = ++idRef.current
      const t = { id, x: 6 + Math.random() * 78, y: 15 + Math.random() * 60, type: Math.random() < 0.28 ? 'phone' : 'star' }
      setTargets((ts) => [...ts, t])
      setTimeout(() => setTargets((ts) => ts.filter((v) => v.id !== id)), life)
    }, spawnMs)
    const timer = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000)
    const end = setTimeout(() => { setStage('result'); sfx.boss() }, 10000)
    return () => { clearInterval(spawn); clearInterval(timer); clearTimeout(end) }
  }, [stage, fast])

  const tap = (t) => {
    setTargets((ts) => ts.filter((v) => v.id !== t.id))
    if (t.type === 'star') { setScore((s) => s + 1); sfx.hit() }
    else { setScore((s) => s - 2); sfx.miss() }
  }

  const win = score >= 8

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 flex items-center justify-center anim-fadein">
      <div className="w-full max-w-[26rem] h-full relative flex flex-col items-center justify-center p-4 select-none">
        {stage === 'intro' && (
          <div className="text-center anim-pop">
            <div className="text-8xl anim-wobble">👾</div>
            <h2 className="text-2xl text-red-400 mt-4 anim-glitch">팝콘 브레인 몬스터 출현!</h2>
            <div className="bg-slate-800/80 rounded-2xl p-4 mt-4 text-left text-sm text-slate-200 leading-relaxed">
              <p className="text-center text-yellow-300 font-bold mb-2">📖 이렇게 하는 거야</p>
              <p>1️⃣ 화면 여기저기에 <b className="text-yellow-300">⭐(별)</b>이 나타났다 사라져.</p>
              <p>2️⃣ 별을 <b>빠르게 눌러서</b> 10초 동안 많이 모아!</p>
              <p>3️⃣ 가짜 유혹 <b className="text-red-400">📱(폰)</b>은 절대 누르지 마! 누르면 <b className="text-red-400">-2점</b>.</p>
              <p>4️⃣ <b className="text-yellow-300">⭐ 8개 이상</b> 모으면 몬스터를 물리쳐!</p>
              <div className="mt-2 pt-2 border-t border-slate-600 text-xs text-sky-300">
                💻 컴퓨터: <b>마우스로 클릭</b> · 📱 폰/태블릿: <b>손가락으로 톡톡</b>
              </div>
            </div>
            {fast && <p className="text-red-400 text-xs mt-2">⚠️ 팝콘 지수가 높아서 몬스터가 더 빠르다…!</p>}
            <button onClick={() => { setStage('play'); sfx.click() }}
              className="mt-5 px-8 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xl rounded-2xl shadow-lg active:scale-95 transition">
              ⚔️ 시작! (준비됐어)
            </button>
          </div>
        )}

        {stage === 'play' && (
          <div className="absolute inset-0">
            <div className="absolute top-6 left-0 right-0 flex flex-col items-center gap-1 z-10 pointer-events-none">
              <div className="text-5xl font-bold text-yellow-300">{timeLeft}</div>
              <div className="text-white text-lg">⭐ {score}점</div>
              <div className="w-56 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 transition-all duration-1000" style={{ width: `${timeLeft * 10}%` }} />
              </div>
              <div className="mt-1 bg-black/40 text-xs text-white px-3 py-1 rounded-full">⭐ 누르기! · 📱 누르지 마!</div>
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-6xl anim-wobble opacity-60 pointer-events-none">👾</div>
            {targets.map((t) => (
              <button key={t.id} onPointerDown={() => tap(t)}
                className="absolute text-4xl anim-pop cursor-pointer"
                style={{ left: `${t.x}%`, top: `${t.y}%` }}>
                {t.type === 'star' ? '⭐' : '📱'}
              </button>
            ))}
          </div>
        )}

        {stage === 'result' && (
          <div className="text-center anim-pop">
            <div className="text-8xl">{win ? '💥' : '😵'}</div>
            <h2 className={`text-2xl mt-4 ${win ? 'text-yellow-300' : 'text-red-400'}`}>
              {win ? '몬스터 격퇴!!' : '몬스터에게 흡수당했다…'}
            </h2>
            <p className="text-slate-300 mt-2">⭐ {score}점 {win ? '— 대단한 집중력이야!' : '— 다음엔 가짜 유혹(📱)을 조심해!'}</p>
            <p className={`mt-2 text-lg ${win ? 'text-green-400' : 'text-red-400'}`}>
              {win ? '🍿 팝콘 지수 -25 · 💰 +50P' : '🍿 팝콘 지수 +15'}
            </p>
            <button onClick={() => onEnd(win, score)}
              className="mt-6 px-8 py-3 bg-white text-slate-900 text-lg rounded-2xl shadow-lg active:scale-95 transition">
              확인
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ========== 7일차 최종보스: 도파민 대마왕 ========== */
export function FinalBoss({ popcorn, onEnd }) {
  const maxHp = 50 + popcorn
  const [stage, setStage] = useState('intro') // intro | r1 | r1res | r2 | r2res | r3 | r3res | final
  const [wins, setWins] = useState([]) // [true,false,...]
  const winCount = wins.filter(Boolean).length
  const hp = Math.max(0, Math.round(maxHp * (1 - winCount / 3)))
  const finalWin = winCount >= 2

  // ----- R1: 알림 폭탄 -----
  const [notis, setNotis] = useState([])
  const [r1Score, setR1Score] = useState(0)
  const [r1Time, setR1Time] = useState(10)
  const notiId = useRef(0)

  useEffect(() => {
    if (stage !== 'r1') return
    const spawn = setInterval(() => {
      const id = ++notiId.current
      const tempt = Math.random() < 0.68
      const pool = tempt ? TEMPT_NOTIS : REAL_NOTIS
      const n = { id, tempt, text: pool[Math.floor(Math.random() * pool.length)], x: 4 + Math.random() * 60 }
      setNotis((ns) => [...ns, n])
      setTimeout(() => setNotis((ns) => ns.filter((v) => v.id !== id)), 3400)
    }, 700)
    const timer = setInterval(() => setR1Time((t) => Math.max(0, t - 1)), 1000)
    const end = setTimeout(() => {
      clearInterval(spawn)
      setStage('r1res')
    }, 10500)
    return () => { clearInterval(spawn); clearInterval(timer); clearTimeout(end) }
  }, [stage])

  useEffect(() => {
    if (stage === 'r1res') {
      setWins((w) => [...w, r1Score >= 6])
      if (r1Score >= 6) sfx.good(); else sfx.bad()
    }
  }, [stage]) // eslint-disable-line

  const tapNoti = (n) => {
    setNotis((ns) => ns.filter((v) => v.id !== n.id))
    if (n.tempt) { setR1Score((s) => s + 1); sfx.hit() }
    else { setR1Score((s) => s - 1); sfx.miss() }
  }

  // ----- R2: OX 퀴즈 -----
  const questions = useMemo(() => [...QUIZ].sort(() => Math.random() - 0.5).slice(0, 3), [])
  const [qi, setQi] = useState(0)
  const [qTime, setQTime] = useState(5)
  const [qCorrect, setQCorrect] = useState(0)
  const [qFeedback, setQFeedback] = useState(null)

  useEffect(() => {
    if (stage !== 'r2' || qFeedback !== null) return
    if (qTime <= 0) { answerQ(null); return }
    const t = setTimeout(() => setQTime((v) => v - 1), 1000)
    return () => clearTimeout(t)
  }, [stage, qTime, qFeedback])

  const answerQ = (ans) => {
    const q = questions[qi]
    const correct = ans !== null && ans === q.a
    if (correct) { setQCorrect((c) => c + 1); sfx.good() } else sfx.bad()
    setQFeedback({ correct, expl: q.expl, timeout: ans === null })
  }

  const nextQ = () => {
    setQFeedback(null)
    if (qi >= 2) {
      setWins((w) => [...w, qCorrect >= 2])
      setStage('r2res')
    } else {
      setQi((i) => i + 1)
      setQTime(5)
    }
  }

  // ----- R3: 집중의 5초 -----
  const [holdMs, setHoldMs] = useState(0)
  const [holding, setHolding] = useState(false)
  const [r3Done, setR3Done] = useState(null) // null | true | false
  const holdRef = useRef(null)

  useEffect(() => {
    if (!holding || r3Done !== null) return
    holdRef.current = setInterval(() => {
      setHoldMs((m) => {
        if (m + 50 >= 5000) {
          clearInterval(holdRef.current)
          setR3Done(true)
          setWins((w) => [...w, true])
          sfx.good()
          return 5000
        }
        return m + 50
      })
    }, 50)
    return () => clearInterval(holdRef.current)
  }, [holding, r3Done])

  const releaseHold = () => {
    if (r3Done !== null) return
    setHolding(false)
    if (holdMs > 0 && holdMs < 5000) {
      setR3Done(false)
      setWins((w) => [...w, false])
      sfx.bad()
    }
  }

  const roundResult = (idx, title) => {
    const won = wins[idx]
    return (
      <div className="text-center anim-pop">
        <div className="text-7xl">{won ? '⚡' : '💜'}</div>
        <h2 className={`text-2xl mt-3 ${won ? 'text-yellow-300' : 'text-purple-300'}`}>
          {title} {won ? '승리!' : '패배…'}
        </h2>
        {won && <p className="text-slate-300 mt-2">대마왕이 비틀거린다! (HP -{Math.ceil(maxHp / 3)})</p>}
        {!won && <p className="text-slate-300 mt-2">대마왕이 낄낄 웃는다… 다음 라운드에서 만회하자!</p>}
        <button onClick={() => { setStage(idx === 0 ? 'r2' : idx === 1 ? 'r3' : 'final'); sfx.click(); if (idx === 2) (winCount >= 2 ? sfx.fanfare() : sfx.warn()) }}
          className="mt-6 px-8 py-3 bg-white text-slate-900 text-lg rounded-2xl shadow-lg active:scale-95 transition">
          {idx === 2 ? '결과 보기' : '다음 라운드 ▶'}
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-purple-950 via-slate-950 to-black flex items-center justify-center anim-fadein">
      <div className="w-full max-w-[26rem] h-full relative flex flex-col items-center justify-center p-4 select-none overflow-hidden">

        {/* 보스 HP 바 (인트로/최종 제외 상시 표시) */}
        {stage !== 'intro' && stage !== 'final' && (
          <div className="absolute top-4 left-4 right-4 z-20">
            <div className="flex items-center gap-2 text-white text-sm">
              <span className="text-2xl">👹</span>
              <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden border border-purple-500">
                <div className="h-full bg-gradient-to-r from-purple-500 to-red-500 transition-all duration-700" style={{ width: `${(hp / maxHp) * 100}%` }} />
              </div>
              <span>{hp}/{maxHp}</span>
            </div>
          </div>
        )}

        {stage === 'intro' && (
          <div className="text-center anim-pop">
            <div className="text-9xl anim-wobble">👹</div>
            <h2 className="text-3xl text-purple-300 mt-4 anim-glitch">도파민 대마왕</h2>
            <p className="text-slate-300 mt-3 text-sm leading-relaxed">
              "일주일 내내 지켜봤다, 한별아…<br />오늘 밤, 네 뇌는 내 것이다!"
            </p>
            <div className="mt-4 bg-slate-800/80 rounded-2xl p-3 text-left text-xs text-slate-300 leading-relaxed">
              <p>⚔️ <b className="text-white">3라운드 중 2번 이기면</b> 승리!</p>
              <p>1️⃣ 알림 폭탄 · 2️⃣ OX 퀴즈 · 3️⃣ 집중의 5초</p>
              <p>👹 보스 HP = 50 + 내 팝콘 지수 = <b className="text-red-400">{maxHp}</b></p>
              <p className="text-purple-300">일주일 동안 팝콘 지수를 잘 관리했다면 쉬운 싸움이 될 거야.</p>
              <p className="mt-1 pt-1 border-t border-slate-600 text-sky-300">💻 컴퓨터는 마우스로, 📱 폰은 손가락으로 하면 돼!</p>
            </div>
            <button onClick={() => { setStage('r1'); sfx.boss() }}
              className="mt-6 px-8 py-3 bg-gradient-to-r from-purple-500 to-red-500 text-white text-xl rounded-2xl shadow-lg active:scale-95 transition">
              ⚔️ 최종 결전!
            </button>
          </div>
        )}

        {stage === 'r1' && (
          <div className="absolute inset-0 pt-16">
            <div className="text-center text-white z-10 relative pointer-events-none">
              <p className="text-sm text-purple-300">ROUND 1 · 알림 폭탄</p>
              <p className="text-xs text-slate-400">📥 위에서 떨어지는 알림 중, <b className="text-pink-300">유혹 알림</b>만 눌러서 없애!<br /><b className="text-white">진짜 알림</b>(숙제·엄마)은 누르면 감점이야!</p>
              <div className="text-4xl font-bold text-yellow-300 mt-1">{r1Time}</div>
              <p className="text-lg">✅ {r1Score}점 <span className="text-xs text-slate-400">(6점 이상 승리)</span></p>
            </div>
            {notis.map((n) => (
              <button key={n.id} onPointerDown={() => tapNoti(n)}
                className={`absolute anim-fall px-3 py-2 rounded-xl text-xs shadow-lg whitespace-nowrap ${n.tempt ? 'bg-gradient-to-r from-pink-500 to-orange-400 text-white' : 'bg-white text-slate-800 border-2 border-blue-400'}`}
                style={{ left: `${n.x}%`, top: 0 }}>
                {n.text}
              </button>
            ))}
          </div>
        )}
        {stage === 'r1res' && roundResult(0, 'ROUND 1')}

        {stage === 'r2' && (
          <div className="w-full text-center">
            <p className="text-sm text-purple-300">ROUND 2 · 유혹 OX 퀴즈 ({qi + 1}/3)</p>
            {!qFeedback ? (
              <div className="anim-pop">
                <div className="text-4xl font-bold text-yellow-300 my-3">{qTime}</div>
                <div className="bg-white rounded-2xl p-5 text-slate-800 text-lg leading-relaxed shadow-xl">
                  {questions[qi].q}
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => answerQ(true)} className="flex-1 py-4 bg-blue-500 text-white text-3xl rounded-2xl shadow-lg active:scale-95 transition">O</button>
                  <button onClick={() => answerQ(false)} className="flex-1 py-4 bg-red-500 text-white text-3xl rounded-2xl shadow-lg active:scale-95 transition">X</button>
                </div>
              </div>
            ) : (
              <div className="anim-pop">
                <div className="text-6xl mt-2">{qFeedback.correct ? '⭕' : qFeedback.timeout ? '⏰' : '❌'}</div>
                <p className={`text-xl mt-2 ${qFeedback.correct ? 'text-green-400' : 'text-red-400'}`}>
                  {qFeedback.correct ? '정답!' : qFeedback.timeout ? '시간 초과!' : '땡!'}
                </p>
                <div className="bg-slate-800 rounded-2xl p-4 mt-3 text-sm text-slate-200">{qFeedback.expl}</div>
                <button onClick={nextQ} className="mt-4 px-8 py-3 bg-white text-slate-900 rounded-2xl shadow-lg active:scale-95 transition">
                  {qi >= 2 ? '라운드 결과' : '다음 문제 ▶'}
                </button>
              </div>
            )}
          </div>
        )}
        {stage === 'r2res' && roundResult(1, 'ROUND 2')}

        {stage === 'r3' && (
          <div className="w-full text-center relative">
            <p className="text-sm text-purple-300">ROUND 3 · 집중의 5초</p>
            <p className="text-xs text-slate-400 mb-1">아래 동그란 버튼을 <b className="text-white">5초 동안 계속 누르고 있어!</b></p>
            <p className="text-[0.6875rem] text-sky-300 mb-4">💻 마우스로 누른 채 그대로 · 📱 손가락으로 꾹 누른 채 그대로<br />중간에 광고가 튀어나와도 <b className="text-white">손을 떼지 마!</b></p>
            <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden mb-6">
              <div className="h-full bg-gradient-to-r from-green-400 to-yellow-300" style={{ width: `${(holdMs / 5000) * 100}%` }} />
            </div>
            {r3Done === null ? (
              <button
                onPointerDown={() => { setHolding(true); sfx.click() }}
                onPointerUp={releaseHold}
                onPointerLeave={releaseHold}
                className={`w-40 h-40 rounded-full text-white text-xl shadow-2xl transition mx-auto flex items-center justify-center ${holding ? 'bg-green-500 scale-95' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}`}>
                {holding ? `${((5000 - holdMs) / 1000).toFixed(1)}초` : '꾹 누르기'}
              </button>
            ) : (
              <div className="text-5xl anim-pop">{r3Done ? '🎯' : '😫'}</div>
            )}
            {/* 방해 팝업 (시각적 유혹) */}
            {holding && holdMs > 1200 && holdMs < 5000 && (
              <div className="absolute -top-2 right-2 bg-pink-500 text-white text-xs px-3 py-2 rounded-xl anim-pop shadow-lg rotate-6">🎁 잠깐! 이것 봐!</div>
            )}
            {holding && holdMs > 2800 && holdMs < 5000 && (
              <div className="absolute top-24 left-0 bg-orange-400 text-white text-xs px-3 py-2 rounded-xl anim-pop shadow-lg -rotate-6">🔥 초특가 아이템!!</div>
            )}
            {r3Done !== null && (
              <button onClick={() => { setStage('r3res'); sfx.click() }} className="mt-6 px-8 py-3 bg-white text-slate-900 rounded-2xl shadow-lg active:scale-95 transition">확인</button>
            )}
          </div>
        )}
        {stage === 'r3res' && roundResult(2, 'ROUND 3')}

        {stage === 'final' && (
          <div className="text-center anim-pop">
            {finalWin ? (
              <>
                <div className="text-9xl" style={{ animation: 'sparkleSpin 1.6s ease-in forwards' }}>👹</div>
                <h2 className="text-3xl text-yellow-300 mt-4">대마왕 격파!!</h2>
                <p className="text-slate-300 mt-3 text-sm leading-relaxed">
                  "이럴 수가… 균형 잡힌 뇌에겐<br />내 유혹이 통하지 않아…!"<br />
                  <span className="text-yellow-200">대마왕이 픽셀 조각이 되어 흩어졌다!</span>
                </p>
                <p className="text-green-400 mt-3 text-lg">🍿 팝콘 지수 -30 · 🏆 도파민 정복자!</p>
              </>
            ) : (
              <>
                <div className="text-9xl anim-wobble">👹</div>
                <h2 className="text-3xl text-red-400 mt-4">패배…</h2>
                <p className="text-slate-300 mt-3 text-sm leading-relaxed">
                  "크크… 하지만 일주일간의 노력이<br />전부 사라지는 건 아니야."<br />
                  <span className="text-purple-300">대마왕은 그림자 속으로 사라졌다.</span>
                </p>
                <p className="text-red-400 mt-3 text-lg">🍿 팝콘 지수 +20</p>
              </>
            )}
            <button onClick={() => onEnd(finalWin)}
              className="mt-6 px-8 py-3 bg-white text-slate-900 text-lg rounded-2xl shadow-lg active:scale-95 transition">
              7일의 결과 보기 ▶
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
