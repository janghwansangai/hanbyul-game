import { useEffect, useRef, useState } from 'react'
import { sfx } from '../game/sound.js'

/*
 * 게임하기 미니게임: "별보석 팡팡!"
 * 한별이가 하는 게임을 내가 대신 플레이한다. 보석을 탭해서 점수를 모으고 💣은 피한다.
 * tier(연속 게임 횟수)에 따라 끝나고 나서 "재미가 줄어드는" 메시지를 보여줘
 * 게임을 오래 할수록 시들해지고 팝콘만 오른다는 걸 미니게임 안에서 체감하게 한다.
 */

const GEMS = ['💎', '⭐', '🍬', '🎈', '🍭', '🏆', '🍎']
const DUR = 8

export default function ArcadeGame({ tier = 0, onEnd }) {
  const [stage, setStage] = useState('intro') // intro | play | result
  const [score, setScore] = useState(0)
  const [time, setTime] = useState(DUR)
  const [items, setItems] = useState([])
  const [pops, setPops] = useState([])
  const idRef = useRef(0)

  useEffect(() => {
    if (stage !== 'play') return
    const spawn = setInterval(() => {
      const id = ++idRef.current
      const bomb = Math.random() < 0.16
      const it = { id, x: 8 + Math.random() * 72, y: 14 + Math.random() * 60, bomb, icon: bomb ? '💣' : GEMS[Math.floor(Math.random() * GEMS.length)] }
      setItems((a) => [...a, it])
      setTimeout(() => setItems((a) => a.filter((v) => v.id !== id)), 1400)
    }, 620)
    const timer = setInterval(() => setTime((t) => Math.max(0, t - 1)), 1000)
    const end = setTimeout(() => { setStage('result'); sfx.good() }, DUR * 1000)
    return () => { clearInterval(spawn); clearInterval(timer); clearTimeout(end) }
  }, [stage])

  const tap = (it) => {
    setItems((a) => a.filter((v) => v.id !== it.id))
    const pid = ++idRef.current
    setPops((p) => [...p, { id: pid, x: it.x, y: it.y, bomb: it.bomb }])
    setTimeout(() => setPops((p) => p.filter((v) => v.id !== pid)), 500)
    if (it.bomb) { setScore((s) => Math.max(0, s - 2)); sfx.miss() }
    else { setScore((s) => s + 1); sfx.hit() }
  }

  const resultMsg = [
    { face: '😆', title: '완전 재밌었어!', desc: '역시 게임은 신나! 행복이 쑥 올랐어.' },
    { face: '😐', title: '음… 아까보단 덜 재밌네', desc: '똑같은 걸 반복하니 좀 시들해졌어. 그래도 자꾸 하고 싶어…' },
    { face: '😵', title: '눈 아프고 지겨운데 멈추기 힘들어', desc: '재미는 별로 없는데 손이 계속 가네. 이게 팝콘 브레인이야!' },
  ][tier]

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900 flex items-center justify-center anim-fadein">
      <div className="w-full max-w-[26rem] h-full relative flex flex-col items-center justify-center p-4 select-none">

        {stage === 'intro' && (
          <div className="text-center anim-pop">
            <div className="text-7xl anim-bouncey">🎮</div>
            <h2 className="text-2xl text-white mt-4">한별이의 게임: 별보석 팡팡!</h2>
            <div className="bg-white/10 rounded-2xl p-4 mt-4 text-left text-sm text-slate-200 leading-relaxed">
              <p>💎 나타나는 <b className="text-yellow-300">보석을 탭</b>해서 점수를 모아! (8초)</p>
              <p>💣 <b className="text-red-400">폭탄</b>을 누르면 -2점, 조심!</p>
              <p className="mt-2 pt-2 border-t border-white/20 text-sky-300 text-xs">💻 컴퓨터: 마우스 클릭 · 📱 폰: 손가락 탭</p>
            </div>
            {tier >= 1 && <p className="text-amber-300 text-xs mt-3">🔁 {tier + 1}번째 연속 게임… 재밌을까?</p>}
            <button onClick={() => { setStage('play'); sfx.click() }}
              className="mt-5 px-8 py-3 bg-gradient-to-r from-pink-500 to-yellow-400 text-white text-xl rounded-2xl shadow-lg active:scale-95 transition">
              ▶ 게임 시작!
            </button>
          </div>
        )}

        {stage === 'play' && (
          <div className="absolute inset-0">
            <div className="absolute top-6 left-0 right-0 flex flex-col items-center gap-1 z-10 pointer-events-none">
              <div className="text-5xl font-bold text-yellow-300">{time}</div>
              <div className="text-white text-lg">💎 {score}점</div>
            </div>
            {items.map((it) => (
              <button key={it.id} onPointerDown={() => tap(it)}
                className="absolute text-5xl anim-pop cursor-pointer active:scale-90"
                style={{ left: `${it.x}%`, top: `${it.y}%` }}>
                {it.icon}
              </button>
            ))}
            {pops.map((p) => (
              <div key={p.id} className="absolute text-4xl anim-punch pointer-events-none" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
                {p.bomb ? '💥' : '✨'}
              </div>
            ))}
          </div>
        )}

        {stage === 'result' && (
          <div className="text-center anim-pop">
            <div className="text-7xl">{resultMsg.face}</div>
            <h2 className="text-2xl text-white mt-3">{resultMsg.title}</h2>
            <p className="text-slate-300 mt-2 text-sm px-4">💎 {score}점 — {resultMsg.desc}</p>
            <button onClick={() => onEnd(score)}
              className="mt-6 px-8 py-3 bg-white text-slate-900 text-lg rounded-2xl shadow-lg active:scale-95 transition">
              게임 끝내기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
