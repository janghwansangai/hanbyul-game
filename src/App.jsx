import { useEffect, useMemo, useRef, useState } from 'react'
import {
  WEEKDAYS, TITLES, levelOf, titleOf,
  EVENTS, FAMILY_EVENT, ITEMS, BADGES, QUIZ,
  JIWOO_TIPS, JIWOO_GAME_WARN, JIWOO_TRAP_WARN, MISSIONS,
  initialGame,
} from './game/data.js'
import { sfx } from './game/sound.js'
import { MidBoss, FinalBoss } from './components/Boss.jsx'
import Ending, { Confetti } from './components/Ending.jsx'
import { Hanbyul, computeLook, GROWTH_MSG, LOOK_NICK } from './components/Character.jsx'
import Scene from './components/Scene.jsx'
import ArcadeGame from './components/ArcadeGame.jsx'

const SAVE_KEY = 'hanbyul-save-v2'
const clamp = (v) => Math.max(0, Math.min(100, Math.round(v)))
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)]
const clone = (o) => JSON.parse(JSON.stringify(o))

const STAT_META = {
  popcorn: { icon: '🍿', label: '팝콘 브레인', color: '#ef4444', goodWhenLow: true },
  health: { icon: '💪', label: '체력', color: '#22c55e' },
  selfcare: { icon: '🧠', label: '자기관리', color: '#3b82f6' },
  happy: { icon: '😊', label: '행복', color: '#eab308' },
}

/* ================= 순수 게임 로직 헬퍼 (s: 상태 draft, out: 연출 큐) ================= */

function applyFx(s, out, fx) {
  for (const [k, v] of Object.entries(fx || {})) {
    if (!v) continue
    s.stats[k] = clamp(s.stats[k] + v)
    const beneficial = k === 'popcorn' ? v < 0 : v > 0
    out.floats.push({ text: `${STAT_META[k].icon}${v > 0 ? '+' : ''}${Math.round(v)}`, good: beneficial })
  }
}

function gainXp(s, out, n) {
  s.xp += n
  const lv = levelOf(s.xp)
  if (lv > s.level) {
    s.level = lv
    const t = TITLES[lv - 1]
    out.toasts.push(`🎉 레벨업! ${t.icon} ${t.name}`)
    out.sfx.push('levelup')
    out.sparkle = true
  }
}

// 좋은 선택 공통 보상: 콤보+XP+포인트
function goodPick(s, out, { points = 5 } = {}) {
  s.combo += 1
  gainXp(s, out, s.combo >= 2 ? 15 : 10)
  s.points += points
  if (s.combo >= 3 && s.combo % 3 === 0) {
    s.points += 10
    out.toasts.push('🔥 콤보 보너스 +10P!')
  }
  if (s.combo >= 2) out.sfx.push('combo')
}

function breakCombo(s, out) {
  if (s.combo >= 2) out.toasts.push('💧 콤보가 끊겼다…')
  s.combo = 0
}

const BADGE_CONDS = {
  earlybird: (s) => s.counters.earlyBird >= 3,
  sport: (s) => s.counters.exercise >= 5,
  reader: (s) => s.counters.reading >= 5,
  talker: (s) => s.counters.talk >= 5,
  quitter: (s) => s.counters.quitWins >= 5,
  adhunter: (s) => s.counters.adDodges >= 3,
  missionking: (s) => s.counters.missionsDone >= 3,
  slayer: (s) => s.midBossWon,
  conqueror: (s) => s.finalWon,
  balance: (s) => s.balanceDone,
}

function checkBadges(s, out) {
  for (const b of BADGES) {
    if (!s.badges.includes(b.id) && BADGE_CONDS[b.id](s)) {
      s.badges.push(b.id)
      s.modals.push({ type: 'badge', badge: b })
      out.sfx.push('badge')
    }
  }
  // 성장 외형 변화 감지 → 토스트로 알림
  const look = computeLook(s.counters)
  if (look.key !== s.lookKey) {
    s.lookKey = look.key
    if (look.type !== 'normal' && GROWTH_MSG[look.key]) {
      out.toasts.push(GROWTH_MSG[look.key])
      out.sfx.push(look.type === 'messy' ? 'bad' : 'levelup')
    }
  }
}

function schoolLines(y) {
  const lines = []
  if (y.health >= 60) lines.push({ t: '⚽ 체육: 발이 깃털처럼 가볍다! 선생님께 칭찬받았다.', fx: { happy: 10 }, p: 5, ok: true })
  else if (y.health <= 30) lines.push({ t: '⚽ 체육: 시작 5분 만에 헉헉… 벤치 신세였다.', fx: { happy: -5 }, ok: false })
  else lines.push({ t: '⚽ 체육: 무난하게 잘 마쳤다.', ok: true })
  if (y.popcorn <= 30) lines.push({ t: '📖 수업: 선생님 말씀이 쏙쏙 들어온다!', fx: { selfcare: 5 }, ok: true })
  else if (y.popcorn >= 70) lines.push({ t: '📖 수업: 자꾸 딴생각… 내용이 하나도 기억 안 난다.', fx: { selfcare: -5 }, ok: false })
  else lines.push({ t: '📖 수업: 그럭저럭 집중했다.', ok: true })
  return lines
}

function drawEvent(s, out) {
  if (s.day === 6) return FAMILY_EVENT
  let pool = [...EVENTS]
  if (s.day === 3) pool = pool.concat(EVENTS.filter((e) => e.trap)) // 함정의 날: 함정 가중치 2배
  let ev = rand(pool)
  if (ev.trap && s.equipped.includes('fence') && !s.fenceUsedToday) {
    s.fenceUsedToday = true
    out.toasts.push('🚧 모바일펜스가 함정을 차단했어요!')
    ev = rand(EVENTS.filter((e) => !e.trap))
  }
  return ev
}

function buildMorning(s, out) {
  if (s.day === 1) s.modals.push({ type: 'tutorial' })
  if (s.day === 2 && !s.shopSeen) s.modals.push({ type: 'shopOpen' })
  if (s.day >= 2 && s.day <= 5 && s.yesterday) s.modals.push({ type: 'school', lines: schoolLines(s.yesterday) })
  if (s.day === 5) {
    const pass = s.stats.selfcare >= 50
    s.modals.push({ type: 'mathtest', pass, fx: pass ? { happy: 10 } : { happy: -5 }, points: pass ? 15 : 0 })
  }
  if (s.pendingMissionCheck) {
    s.modals.push({ type: 'missioncheck', mission: s.pendingMissionCheck })
    s.pendingMissionCheck = null
  }
  const mission = rand(MISSIONS)
  s.mission = mission
  s.modals.push({ type: 'missionnew', mission })
  s.modals.push({ type: 'event', ev: drawEvent(s, out) })
  if (s.day === 3) out.jiwoo = JIWOO_TRAP_WARN
  if (s.day === 7) out.toasts.push('⚡ 오늘 밤… 무언가 큰 게 온다.')
}

function beginNight(s, out, { forced = false } = {}) {
  s.sleepEarly = !forced && s.hour < 22
  s.forcedSleep = forced
  s.yesterday = { ...s.stats }
  const a = s.todayActions
  if (a.includes('game') && (a.includes('soccer') || a.includes('jump')) && a.includes('read')) s.balanceDone = true
  checkBadges(s, out)
  if (forced) out.toasts.push('😴 자정이 넘었어… 쓰러지듯 잠들었다.')
  s.modals.push({ type: 'diary' })
}

function finishNight(s, out) {
  // 어젯밤 다짐(일찍 자기) 보너스 판정
  if (s.activeBuff === 'sleep' && s.sleepEarly) {
    gainXp(s, out, 15)
    applyFx(s, out, { happy: 5 })
    out.toasts.push('🌙 다짐 성공! 일찍 잤다 (+15XP)')
  }
  if (s.sleepEarly) s.counters.earlyBird += 1
  let hp = s.forcedSleep ? 70 : s.sleepEarly ? 100 : 80
  if (s.equipped.includes('blanket')) hp = Math.min(100, hp + 10)
  s.stats.health = hp
  s.activeBuff = s.pledge || null
  s.pledge = null
  s.day += 1
  s.hour = 8
  s.scene = 'room'
  s.consecGames = 0
  s.talkToday = 0
  s.fenceUsedToday = false
  s.pendingMissionCheck = s.mission
  s.mission = null
  s.todayActions = []
  s.todayEvent = null
  checkBadges(s, out)
  buildMorning(s, out)
  out.sfx.push('good')
}

function afterAction(s, out) {
  if (s.day === 4 && s.hour >= 22 && !s.midBossDone) { s.phase = 'midboss'; out.sfx.push('boss'); return }
  if (s.day === 7 && s.hour >= 22 && !s.finalDone) { s.phase = 'finalboss'; out.sfx.push('boss'); return }
  if (s.hour >= 24) { beginNight(s, out, { forced: true }); return }
  if (Math.random() < 0.2 && !out.jiwoo) out.jiwoo = rand(JIWOO_TIPS)
}

function calcEnding(s) {
  if (s.finalWon && s.stats.popcorn <= 30 && s.stats.happy >= 60 && s.counters.totalGames >= 3) return 'balance'
  if (s.finalWon && s.stats.popcorn <= 30) return 'happy'
  if (s.stats.popcorn >= 70) return 'bad'
  return 'normal'
}

/* ================= 메인 컴포넌트 ================= */

export default function App() {
  const [g, setG] = useState(null)
  const [hasSave, setHasSave] = useState(() => !!localStorage.getItem(SAVE_KEY))
  const [floats, setFloats] = useState([])
  const [toasts, setToasts] = useState([])
  const [jiwoo, setJiwoo] = useState(null)
  const [sparkleAt, setSparkleAt] = useState(0)
  const idRef = useRef(0)
  const jiwooTimer = useRef(null)
  const gRef = useRef(g)
  gRef.current = g

  // 자동 저장
  useEffect(() => {
    if (g) localStorage.setItem(SAVE_KEY, JSON.stringify(g))
  }, [g])

  // 개발/시연용 훅 (콘솔에서 상태 점프 가능)
  useEffect(() => {
    window.__getG = () => gRef.current
    window.__setG = (obj) => setG(obj)
  }, [])

  const S = () => clone(g)
  const O = () => ({ floats: [], toasts: [], sfx: [], jiwoo: null, sparkle: false })

  function flush(out) {
    out.floats.forEach((f, i) => {
      setTimeout(() => {
        const id = ++idRef.current
        setFloats((fs) => [...fs, { ...f, id, x: 20 + Math.random() * 55 }])
        setTimeout(() => setFloats((fs) => fs.filter((v) => v.id !== id)), 1350)
      }, i * 180)
    })
    out.toasts.forEach((t, i) => {
      setTimeout(() => {
        const id = ++idRef.current
        setToasts((ts) => [...ts, { id, text: t }])
        setTimeout(() => setToasts((ts) => ts.filter((v) => v.id !== id)), 2600)
      }, i * 350)
    })
    out.sfx.forEach((k, i) => setTimeout(() => sfx[k] && sfx[k](), i * 120))
    if (out.jiwoo) {
      clearTimeout(jiwooTimer.current)
      setJiwoo(out.jiwoo)
      jiwooTimer.current = setTimeout(() => setJiwoo(null), 4000)
    }
    if (out.sparkle) setSparkleAt(Date.now())
  }

  /* ---------- 시작/재시작 ---------- */
  function startNew() {
    const s = clone(initialGame)
    const out = O()
    buildMorning(s, out)
    setG(s)
    flush(out)
    sfx.good()
  }
  function continueGame() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY))
      if (s) setG(s)
    } catch { startNew() }
  }
  function restart() {
    localStorage.removeItem(SAVE_KEY)
    setHasSave(false)
    setG(null)
    setFloats([]); setToasts([]); setJiwoo(null)
  }

  /* ---------- 행동 ---------- */
  // 게임하기: 막혀있지 않으면 실제 미니게임(아케이드)을 띄운다. 성공 시 true.
  function tryLaunchGame(s, out) {
    if (s.equipped.includes('screentime') && s.hour >= 21) {
      out.toasts.push('⏳ 스크린 타임: 21시 이후엔 게임 잠금!'); out.sfx.push('bad'); return false
    }
    if (s.equipped.includes('familylink') && s.consecGames >= 2) {
      out.toasts.push('🛡️ 패밀리 링크가 3연속 게임을 막았어요!'); out.sfx.push('bad'); return false
    }
    if (s.consecGames >= 2) out.jiwoo = JIWOO_GAME_WARN
    s.scene = 'room'
    s.phase = 'arcade'
    out.sfx.push('click')
    return true
  }

  // 미니게임이 끝난 뒤 실제 스탯/연속 효과를 적용 (하면 할수록 재미↓ 팝콘↑)
  function applyGamePlay(s, out) {
    const tier = Math.min(s.consecGames, 2)
    const fx = [
      { happy: 15, popcorn: 8, health: -5 },
      { happy: 7, popcorn: 15, health: -5 },
      { happy: 0, popcorn: 25, health: -10 },
    ][tier]
    applyFx(s, out, fx)
    if (tier === 1) out.toasts.push('🎮 어… 아까보다 재미가 덜한 것 같다?')
    if (tier === 2) out.toasts.push('😵 눈이 아프고 머리가 멍하다…')
    if (tier > 0) breakCombo(s, out)
    s.consecGames += 1
    s.counters.totalGames += 1
    s.todayActions.push('game')
    s.hour += 1
    afterAction(s, out)
    if (s.phase === 'normal' && s.hour < 24) s.modals.push({ type: 'oneMore' })
  }

  function act(kind) {
    if (!g || g.modals.length > 0 || g.phase !== 'normal') return
    const s = S(); const out = O()
    const buff = (b) => (s.activeBuff === b ? 1.2 : 1)

    // 행동에 맞춰 배경 장면 전환 (운동은 공원, 나머지는 방)
    if (kind === 'soccer' || kind === 'jump') s.scene = 'park'
    else if (kind !== 'sleep') s.scene = 'room'

    if (kind === 'game') {
      tryLaunchGame(s, out)
      setG(s); flush(out)
      return
    } else if (kind === 'soccer' || kind === 'jump') {
      if (s.stats.health < 30) { out.toasts.push('😩 너무 지쳐서 운동을 못 하겠어…'); setG(s); flush(out); return }
      const base = kind === 'soccer' ? { health: 15, popcorn: -10, happy: 8 } : { health: 8, popcorn: -6, happy: 4 }
      const ballMul = s.equipped.includes('ball') ? 1.5 : 1
      applyFx(s, out, { ...base, health: Math.round(base.health * ballMul * buff('exercise')) })
      s.counters.exercise += 1
      s.consecGames = 0
      s.todayActions.push(kind)
      s.hour += kind === 'soccer' ? 2 : 1
      goodPick(s, out)
      out.sfx.push('good')
      afterAction(s, out)
    } else if (kind === 'read') {
      const dizzy = s.stats.popcorn >= 80
      let fx = { selfcare: Math.round(10 * buff('reading')), popcorn: -5, happy: 4 + (s.equipped.includes('manga') ? 6 : 0) }
      if (dizzy) {
        fx = { selfcare: Math.ceil(fx.selfcare / 2), popcorn: Math.round(fx.popcorn / 2), happy: Math.ceil(fx.happy / 2) }
        out.toasts.push('😵 글자가 눈에 안 들어와… (팝콘 과다: 효과 절반)')
      }
      applyFx(s, out, fx)
      s.counters.reading += 1
      s.consecGames = 0
      s.todayActions.push('read')
      s.hour += 2
      goodPick(s, out)
      out.sfx.push('good')
      afterAction(s, out)
    } else if (kind === 'talk') {
      s.consecGames = 0
      s.todayActions.push('talk')
      s.hour += 1
      if (s.talkToday < 2) {
        applyFx(s, out, { happy: 10, selfcare: 5 })
        s.talkToday += 1
        s.counters.talk += 1
        goodPick(s, out)
        out.sfx.push('good')
      } else {
        out.toasts.push('💬 엄마가 바쁘셔서 대화를 길게 못 했다.')
      }
      afterAction(s, out)
    } else if (kind === 'sleep') {
      if (s.hour < 21) return
      if (s.day === 4 && !s.midBossDone) {
        s.sleepAfterBoss = true
        s.phase = 'midboss'
        out.toasts.push('잠들려는 순간… 무언가 나타났다?!')
        out.sfx.push('boss')
        setG(s); flush(out); return
      }
      if (s.day === 7 && !s.finalDone) {
        s.phase = 'finalboss'
        out.toasts.push('잠들 수 없다… 결전의 기운이 느껴진다!')
        out.sfx.push('boss')
        setG(s); flush(out); return
      }
      beginNight(s, out)
    }
    checkBadges(s, out)
    setG(s); flush(out)
  }

  /* ---------- 모달 핸들러 ---------- */
  function ackModal() {
    const m = g.modals[0]
    const s = S(); const out = O()
    s.modals.shift()
    switch (m.type) {
      case 'school':
        m.lines.forEach((l) => { if (l.fx) applyFx(s, out, l.fx); if (l.p) s.points += l.p })
        break
      case 'mathtest':
        applyFx(s, out, m.fx)
        if (m.points) s.points += m.points
        out.sfx.push(m.pass ? 'good' : 'bad')
        break
      case 'impulse':
        applyFx(s, out, { popcorn: 20 })
        out.sfx.push('bad')
        finishNight(s, out)
        break
      case 'diary': {
        const pool = QUIZ.filter((q) => q.eventId === s.todayEvent)
        const q = pool.length ? pool[0] : rand(QUIZ)
        s.modals.push({ type: 'quiz', q })
        break
      }
      case 'shopOpen':
        s.shopSeen = true
        s.tab = 'shop'
        break
      default:
        break
    }
    setG(s); flush(out)
    sfx.click()
  }

  function chooseEvent(key) {
    const m = g.modals[0]
    const ev = m.ev
    const c = ev[key]
    const s = S(); const out = O()
    s.modals.shift()
    if (c.special === 'gacha') {
      s.points = Math.max(0, s.points - 20)
      applyFx(s, out, c.fx)
    } else if (c.special === 'sneak') {
      if (Math.random() < 0.5) { applyFx(s, out, { happy: -10 }); out.toasts.push('😱 들켰다! 엄마가 실망하셨다…') }
      else { applyFx(s, out, { popcorn: 10 }); out.toasts.push('🤫 스릴 있지만… 마음이 좀 불편하다.') }
    } else {
      applyFx(s, out, c.fx)
    }
    if (c.time) s.hour += c.time
    if (c.good) {
      goodPick(s, out, { points: 10 })
      if (c.adDodge) s.counters.adDodges += 1
      out.sfx.push('good')
    } else {
      breakCombo(s, out)
      out.sfx.push('bad')
    }
    s.todayEvent = ev.id
    checkBadges(s, out)
    setG(s); flush(out)
  }

  function oneMore() {
    const s = S(); const out = O()
    s.modals.shift()
    tryLaunchGame(s, out) // "한 판 더!" → 미니게임 다시 실행 (막히면 토스트만)
    checkBadges(s, out)
    setG(s); flush(out)
  }

  // 게임하기 미니게임 종료 → 스탯 적용
  function arcadeEnd() {
    const s = S(); const out = O()
    s.phase = 'normal'
    applyGamePlay(s, out)
    checkBadges(s, out)
    setG(s); flush(out)
  }

  function quitGamePopup() {
    const s = S(); const out = O()
    s.modals.shift()
    s.counters.quitWins += 1
    gainXp(s, out, 10)
    out.toasts.push('🛡️ 유혹을 이겼다! +10XP')
    out.sfx.push('good')
    checkBadges(s, out)
    setG(s); flush(out)
  }

  function quizDone(correct) {
    const s = S(); const out = O()
    s.modals.shift()
    if (correct) gainXp(s, out, 10)
    s.modals.push({ type: 'pledge' })
    setG(s); flush(out)
  }

  function pickPledge(k) {
    const s = S(); const out = O()
    s.modals.shift()
    s.pledge = k
    out.sfx.push('click')
    if (s.stats.happy < 20 && (!s.equipped.includes('blanket') || Math.random() < 0.5)) {
      s.modals.push({ type: 'impulse' })
      out.sfx.push('warn')
    } else {
      finishNight(s, out)
    }
    setG(s); flush(out)
  }

  function missionCheck(did) {
    const s = S(); const out = O()
    s.modals.shift()
    if (did) {
      s.points += 30
      s.counters.missionsDone += 1
      out.toasts.push('📵 진짜 미션 성공! +30P')
      out.sfx.push('good')
      checkBadges(s, out)
    } else {
      out.toasts.push('괜찮아, 오늘 다시 도전!')
    }
    setG(s); flush(out)
  }

  /* ---------- 보스 종료 ---------- */
  function midBossEnd(win) {
    const s = S(); const out = O()
    s.midBossDone = true
    s.midBossWon = win
    s.phase = 'normal'
    if (win) {
      applyFx(s, out, { popcorn: -25 })
      s.points += 50
      gainXp(s, out, 30)
      out.sfx.push('fanfare')
    } else {
      applyFx(s, out, { popcorn: 15 })
      out.sfx.push('bad')
    }
    checkBadges(s, out)
    if (s.sleepAfterBoss) {
      s.sleepAfterBoss = false
      beginNight(s, out)
    } else if (s.hour >= 24) {
      beginNight(s, out, { forced: true })
    }
    setG(s); flush(out)
  }

  function finalBossEnd(win) {
    const s = S(); const out = O()
    s.finalDone = true
    s.finalWon = win
    if (win) { applyFx(s, out, { popcorn: -30 }); gainXp(s, out, 30) }
    else applyFx(s, out, { popcorn: 20 })
    checkBadges(s, out)
    s.modals = []
    s.ending = calcEnding(s)
    s.phase = 'ended'
    setG(s); flush(out)
  }

  /* ---------- 상점 ---------- */
  function buyItem(item) {
    const s = S(); const out = O()
    if (s.owned.includes(item.id)) return
    if (s.points < item.price) { out.toasts.push('💰 포인트가 부족해!'); out.sfx.push('bad'); setG(s); flush(out); return }
    s.points -= item.price
    s.owned.push(item.id)
    s.equipped.push(item.id)
    out.toasts.push(`${item.icon} ${item.name} 구매 & 장착!`)
    out.sfx.push('good')
    setG(s); flush(out)
  }
  function toggleEquip(id) {
    const s = S()
    s.equipped = s.equipped.includes(id) ? s.equipped.filter((v) => v !== id) : [...s.equipped, id]
    setG(s)
    sfx.click()
  }
  function setTab(tab) {
    const s = S(); s.tab = tab; setG(s); sfx.click()
  }

  /* ================= 렌더 ================= */

  if (!g) return <TitleScreen hasSave={hasSave} onNew={startNew} onContinue={continueGame} />
  if (g.phase === 'ended') return <Ending g={g} onRestart={restart} />

  const modal = g.modals[0]
  const isNight = g.hour >= 20
  const charSparkle = Date.now() - sparkleAt < 1600

  return (
    <div className="min-h-screen flex justify-center transition-all duration-1000" style={{ background: skyOf(g.hour, g.day) }}>
      {isNight && g.tab !== 'home' && <NightStars />}

      <div className={`w-full max-w-[26rem] min-h-screen flex flex-col p-3 pb-20 relative isolate ${g.stats.popcorn > 70 ? 'anim-softshake' : ''}`}>

        {/* ===== 배경 장면 (방 / 공원) ===== */}
        {g.tab === 'home' && <Scene scene={g.scene} hour={g.hour} day={g.day} />}

        {/* ===== 상단 정보 ===== */}
        <div className="bg-white/90 rounded-2xl shadow-lg p-3">
          <div className="flex items-center justify-between text-sm text-slate-700">
            <span className="font-bold">{g.day}일차 ({WEEKDAYS[g.day - 1]}) · {String(g.hour).padStart(2, '0')}:00</span>
            <span className="text-amber-600 font-bold">💰 {g.points}P</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{titleOf(g.xp).icon} {titleOf(g.xp).name}</span>
            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-400 transition-all duration-500" style={{ width: `${xpPct(g.xp)}%` }} />
            </div>
            <span className="text-[0.625rem] text-slate-400">Lv.{g.level}</span>
          </div>
          <div className="mt-2 space-y-1.5">
            {Object.entries(STAT_META).map(([k, m]) => (
              <div key={k} className="flex items-center gap-2">
                <span className="text-sm w-5">{m.icon}</span>
                <div className={`flex-1 h-3 bg-slate-200 rounded-full overflow-hidden ${k === 'popcorn' && g.stats.popcorn >= 80 ? 'anim-danger' : ''}`}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${g.stats[k]}%`, background: m.color }} />
                </div>
                <span className="text-xs w-7 text-right text-slate-600 font-bold">{g.stats[k]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ===== 탭 내용 ===== */}
        {g.tab === 'home' && (
          <>
            {/* 캐릭터 */}
            <div className="flex-1 flex flex-col items-center justify-end pb-2 relative min-h-56">
              {g.combo >= 2 && (
                <div key={g.combo} className="anim-combo absolute top-2 bg-orange-500 text-white px-4 py-1 rounded-full shadow-lg text-lg z-10">
                  🔥 {g.combo}연속 콤보!
                </div>
              )}
              <CharacterFace stats={g.stats} sparkle={charSparkle} counters={g.counters} />
              {g.day === 7 && g.hour >= 14 && (
                <p className="text-purple-200 text-xs mt-2 anim-fadein bg-black/30 px-3 py-1 rounded-full">⚡ 결전의 기운이 감돈다…</p>
              )}
              {/* 플로팅 텍스트 */}
              {floats.map((f) => (
                <div key={f.id} className={`anim-float absolute text-lg font-bold pointer-events-none ${f.good ? 'text-green-300' : 'text-red-400'}`}
                  style={{ left: `${f.x}%`, top: '38%', textShadow: '0 1px 3px rgba(0,0,0,.5)' }}>
                  {f.text}
                </div>
              ))}
            </div>

            {/* 행동 버튼 */}
            <div className="grid grid-cols-3 gap-2">
              <ActionBtn icon="🎮" label="게임하기" sub="+행복 · 1h" onClick={() => act('game')}
                disabled={(g.equipped.includes('screentime') && g.hour >= 21)}
                note={g.equipped.includes('screentime') && g.hour >= 21 ? '⏳잠금' : g.consecGames >= 1 ? `${g.consecGames}연속째` : null} />
              <ActionBtn icon="⚽" label="축구하기" sub="+체력 · 2h" onClick={() => act('soccer')} disabled={g.stats.health < 30} note={g.stats.health < 30 ? '지침' : null} />
              <ActionBtn icon="🤸" label="줄넘기" sub="+체력 · 1h" onClick={() => act('jump')} disabled={g.stats.health < 30} note={g.stats.health < 30 ? '지침' : null} />
              <ActionBtn icon="📖" label="책읽기" sub="+자기관리 · 2h" onClick={() => act('read')} />
              <ActionBtn icon="💬" label="엄마와 대화" sub="+행복 · 1h" onClick={() => act('talk')} />
              <ActionBtn icon="💤" label="잠자기" sub={g.hour < 21 ? '21시부터' : '하루 마무리'} onClick={() => act('sleep')} disabled={g.hour < 21}
                note={g.hour >= 21 && g.hour < 22 ? '🌅얼리버드!' : null} />
            </div>
          </>
        )}

        {g.tab === 'shop' && <ShopPanel g={g} onBuy={buyItem} onToggle={toggleEquip} />}
        {g.tab === 'badge' && <BadgePanel g={g} />}

        {/* ===== 하단 네비 ===== */}
        <nav className="fixed bottom-0 inset-x-0 mx-auto w-full max-w-[26rem] bg-white/95 border-t border-slate-200 flex shadow-2xl z-30">
          {[['home', '🏠', '홈'], ['shop', '🛍️', '상점'], ['badge', '🏅', '뱃지']].map(([id, icon, label]) => (
            <button key={id} onClick={() => setTab(id)}
              disabled={id === 'shop' && g.day < 2}
              className={`flex-1 py-2.5 flex flex-col items-center text-xs transition ${g.tab === id ? 'text-indigo-600 font-bold' : 'text-slate-400'} ${id === 'shop' && g.day < 2 ? 'opacity-40' : ''}`}>
              <span className="text-xl">{icon}</span>
              {id === 'shop' && g.day < 2 ? '2일차 오픈' : label}
            </button>
          ))}
        </nav>

        {/* ===== 지우 ===== */}
        {jiwoo && (
          <div className="fixed bottom-20 right-2 z-40 anim-slidein flex items-end gap-1 max-w-[17.5rem]">
            <div className="bg-white rounded-2xl rounded-br-none shadow-xl p-3 text-xs text-slate-700 border-2 border-yellow-300">
              <b className="text-yellow-600">지우:</b> {jiwoo}
            </div>
            <div className="text-4xl">🧒</div>
          </div>
        )}

        {/* ===== 토스트 ===== */}
        <div className="fixed top-3 inset-x-0 mx-auto z-[70] space-y-1.5 w-[90%] max-w-[24rem] pointer-events-none">
          {toasts.map((t) => (
            <div key={t.id} className="anim-pop bg-slate-800/95 text-white text-sm rounded-xl px-4 py-2.5 shadow-xl text-center">{t.text}</div>
          ))}
        </div>

        {/* ===== 모달 ===== */}
        {modal && <ModalHost g={g} modal={modal} handlers={{ ackModal, chooseEvent, oneMore, quitGamePopup, quizDone, pickPledge, missionCheck }} />}
      </div>

      {/* ===== 보스전 ===== */}
      {g.phase === 'arcade' && <ArcadeGame tier={Math.min(g.consecGames, 2)} onEnd={arcadeEnd} />}
      {g.phase === 'midboss' && <MidBoss fast={g.stats.popcorn >= 70} onEnd={midBossEnd} />}
      {g.phase === 'finalboss' && <FinalBoss popcorn={g.stats.popcorn} onEnd={finalBossEnd} />}
    </div>
  )
}

/* ================= 서브 컴포넌트 ================= */

function skyOf(hour, day) {
  if (day === 7 && hour >= 14 && hour < 20) return 'linear-gradient(180deg,#312e81,#7c3aed,#f472b6)'
  if (hour < 10) return 'linear-gradient(180deg,#fbcfe8,#bae6fd)'
  if (hour < 17) return 'linear-gradient(180deg,#38bdf8,#e0f2fe)'
  if (hour < 20) return 'linear-gradient(180deg,#fb923c,#7c3aed)'
  return 'linear-gradient(180deg,#1e1b4b,#020617)'
}

function xpPct(xp) {
  const lv = levelOf(xp)
  if (lv >= TITLES.length) return 100
  const cur = TITLES[lv - 1].xp
  const next = TITLES[lv].xp
  return Math.round(((xp - cur) / (next - cur)) * 100)
}

function NightStars() {
  const stars = useMemo(() => Array.from({ length: 28 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 55, d: Math.random() * 2, s: Math.random() > 0.7 ? 'text-sm' : 'text-[0.5rem]',
  })), [])
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {stars.map((st) => (
        <span key={st.id} className={`absolute anim-twinkle text-yellow-100 ${st.s}`} style={{ left: `${st.x}%`, top: `${st.y}%`, animationDelay: `${st.d}s` }}>✦</span>
      ))}
    </div>
  )
}

function CharacterFace({ stats, sparkle, counters }) {
  let mood = 'normal', anim = 'anim-idle', caption = '보통이야~'
  if (stats.popcorn > 70) { mood = 'popcorn'; anim = 'anim-shakehard'; caption = '머리가 팝콘팝콘…' }
  else if (stats.health < 30) { mood = 'tired'; anim = 'anim-sleepy'; caption = '너무 졸리고 지쳤어…' }
  else if (stats.popcorn < 30 && stats.health > 70) { mood = 'good'; anim = 'anim-bouncey'; caption = '컨디션 최고!!' }
  const look = computeLook(counters || {})
  const nick = LOOK_NICK[look.key]
  return (
    <div className="relative flex flex-col items-center">
      {look.type !== 'normal' && (
        <div className="mb-1 bg-white/90 text-slate-700 text-xs px-3 py-0.5 rounded-full shadow font-bold anim-pop">{nick}</div>
      )}
      {sparkle && (
        <>
          <span className="absolute -top-4 -left-6 text-2xl anim-sparkle">✨</span>
          <span className="absolute -top-2 -right-7 text-3xl anim-sparkle" style={{ animationDelay: '0.2s' }}>✨</span>
          <span className="absolute top-8 -left-9 text-xl anim-sparkle" style={{ animationDelay: '0.4s' }}>⭐</span>
        </>
      )}
      <Hanbyul mood={mood} look={look.type} level={look.level} className={`w-36 h-36 ${anim}`} style={{ filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.25))' }} />
      <div className="w-24 h-3 -mt-1 rounded-[50%] bg-black/20 blur-[3px]" />
      <div className="mt-1 bg-white/85 text-slate-600 text-xs px-3 py-1 rounded-full shadow">한별: {caption}</div>
    </div>
  )
}

function ActionBtn({ icon, label, sub, onClick, disabled, note }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`relative bg-white/90 rounded-2xl shadow-lg p-2.5 flex flex-col items-center gap-0.5 transition active:scale-95 ${disabled ? 'opacity-40' : 'hover:bg-white'}`}>
      <span className="text-2xl">{icon}</span>
      <span className="text-xs text-slate-700 font-bold">{label}</span>
      <span className="text-[0.56rem] text-slate-400">{sub}</span>
      {note && <span className="absolute -top-1.5 -right-1 bg-rose-500 text-white text-[0.5rem] px-1.5 py-0.5 rounded-full shadow">{note}</span>}
    </button>
  )
}

function TitleScreen({ hasSave, onNew, onContinue }) {
  return (
    <div className="min-h-screen flex justify-center" style={{ background: 'linear-gradient(180deg,#fbcfe8,#bae6fd,#a5f3fc)' }}>
      <div className="w-full max-w-[26rem] flex flex-col items-center justify-center p-6 text-center">
        <p className="text-slate-500 text-sm">진짜 레벨업</p>
        <h1 className="text-4xl text-slate-800 mt-1 leading-snug">🌟 한별이 키우기</h1>
        <Hanbyul mood="good" className="w-40 h-40 mt-8 anim-bouncey" />
        <p className="text-slate-600 text-sm mt-6 leading-relaxed">
          한별이의 7일을 부탁해!<br />
          <b>게임을 끊는 게 아니라, 게임과 잘 지내는 법</b>을<br />찾아주는 거야. 🍿👾
        </p>
        <div className="mt-8 w-full space-y-3">
          <button onClick={onNew} className="w-full py-4 bg-gradient-to-r from-indigo-500 to-pink-500 text-white text-xl rounded-2xl shadow-xl active:scale-95 transition">
            ✨ 새로 시작
          </button>
          {hasSave && (
            <button onClick={onContinue} className="w-full py-3.5 bg-white text-slate-700 text-lg rounded-2xl shadow-lg active:scale-95 transition">
              ▶ 이어하기
            </button>
          )}
        </div>
        <p className="text-[0.625rem] text-slate-400 mt-6">인터넷·스마트폰 과의존 예방 교육 게임</p>
      </div>
    </div>
  )
}

/* ---------- 상점 & 뱃지 패널 ---------- */

function ShopPanel({ g, onBuy, onToggle }) {
  return (
    <div className="flex-1 mt-3 space-y-2 overflow-y-auto">
      <h2 className="text-white text-lg drop-shadow">🛍️ 상점 <span className="text-xs opacity-80">좋은 선택으로 포인트를 모아 봐!</span></h2>
      {ITEMS.map((it) => {
        const owned = g.owned.includes(it.id)
        const on = g.equipped.includes(it.id)
        return (
          <div key={it.id} className="bg-white/95 rounded-2xl shadow-lg p-3 flex items-center gap-3 transition hover:-translate-y-0.5">
            <span className="text-3xl">{it.icon}</span>
            <div className="flex-1">
              <p className="text-sm text-slate-800 font-bold">{it.name}</p>
              <p className="text-[0.625rem] text-slate-500">{it.desc}</p>
            </div>
            {owned ? (
              <button onClick={() => onToggle(it.id)}
                className={`w-12 h-7 rounded-full transition relative ${on ? 'bg-green-400' : 'bg-slate-300'}`}>
                <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all ${on ? 'left-5' : 'left-0.5'}`} />
              </button>
            ) : (
              <button onClick={() => onBuy(it)}
                className={`px-3 py-1.5 rounded-xl text-sm text-white active:scale-95 transition ${g.points >= it.price ? 'bg-amber-500' : 'bg-slate-300'}`}>
                {it.price}P
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

function BadgePanel({ g }) {
  return (
    <div className="flex-1 mt-3">
      <h2 className="text-white text-lg drop-shadow">🏅 뱃지 컬렉션 ({g.badges.length}/{BADGES.length})</h2>
      <div className="grid grid-cols-2 gap-2 mt-2">
        {BADGES.map((b) => {
          const got = g.badges.includes(b.id)
          return (
            <div key={b.id} className={`rounded-2xl p-3 text-center shadow-lg ${got ? 'bg-gradient-to-b from-yellow-50 to-amber-100 border-2 border-yellow-300' : 'bg-white/60'}`}>
              <div className={`text-4xl ${got ? 'animate-pulse' : 'grayscale opacity-30'}`}>{got || !b.hidden ? b.icon : '❓'}</div>
              <p className={`text-sm mt-1 ${got ? 'text-amber-700 font-bold' : 'text-slate-400'}`}>{!got && b.hidden ? '???' : b.name}</p>
              <p className="text-[0.56rem] text-slate-400 mt-0.5">{!got && b.hidden ? '숨겨진 뱃지야!' : b.desc}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ---------- 모달 호스트 ---------- */

function Modal({ children, flip }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`w-full max-w-[24rem] bg-white rounded-3xl shadow-2xl p-5 ${flip ? 'anim-flip' : 'anim-pop'}`}>
        {children}
      </div>
    </div>
  )
}

function ModalHost({ g, modal, handlers }) {
  const { ackModal, chooseEvent, oneMore, quitGamePopup, quizDone, pickPledge, missionCheck } = handlers

  switch (modal.type) {
    case 'tutorial':
      return (
        <Modal>
          <div className="text-center">
            <div className="text-5xl">🧒</div>
            <h3 className="text-lg mt-2 text-slate-800">안녕! 난 지우야</h3>
            <div className="text-sm text-slate-600 mt-3 text-left leading-relaxed space-y-2 bg-slate-50 rounded-2xl p-3">
              <p>👆 아래 버튼을 <b>마우스로 클릭</b>(폰은 손가락으로 터치)하면 한별이가 행동해!</p>
              <p>🍿 <b>팝콘 지수</b>는 낮게, 나머지는 높게 유지해 줘!</p>
              <p>🎮 게임은 해도 돼! 근데 <b>연속으로 하면</b> 재미는 줄고 팝콘만 늘어나. 신기하지?</p>
              <p>😊 <b>행복</b>이 너무 낮아도 큰일 나. 놀 땐 놀아!</p>
              <p>🌙 7일 뒤… 뭔가 큰 게 온다는 소문이 있어.</p>
            </div>
            <button onClick={ackModal} className="mt-4 w-full py-3 bg-indigo-500 text-white rounded-2xl text-lg active:scale-95 transition">시작할게! 💪</button>
          </div>
        </Modal>
      )

    case 'event':
      return <EventModal g={g} ev={modal.ev} onChoose={chooseEvent} />

    case 'oneMore':
      return <OneMoreModal g={g} onMore={oneMore} onQuit={quitGamePopup} />

    case 'school':
      return (
        <Modal>
          <h3 className="text-center text-lg text-slate-800">🏫 어제의 결과가 학교에서…</h3>
          <div className="mt-3 space-y-2">
            {modal.lines.map((l, i) => (
              <div key={i} className={`rounded-2xl p-3 text-sm ${l.ok ? 'bg-sky-50 text-slate-700' : 'bg-slate-100 text-slate-500'}`}>
                {l.ok ? '⭐ ' : '☁️ '}{l.t}
              </div>
            ))}
          </div>
          <button onClick={ackModal} className="mt-4 w-full py-3 bg-slate-800 text-white rounded-2xl active:scale-95 transition">확인</button>
        </Modal>
      )

    case 'mathtest':
      return (
        <Modal>
          <div className="text-center">
            <div className="text-5xl">{modal.pass ? '💯' : '📝'}</div>
            <h3 className="text-lg mt-2 text-slate-800">금요일 수학 쪽지시험!</h3>
            <p className="text-sm text-slate-600 mt-2">
              {modal.pass
                ? '차곡차곡 쌓은 자기관리 역량 덕분에 술술 풀린다! (+15P)'
                : '으윽, 아는 문제인데 집중이 안 된다… 자기관리 역량을 더 키우자.'}
            </p>
            <button onClick={ackModal} className="mt-4 w-full py-3 bg-slate-800 text-white rounded-2xl active:scale-95 transition">확인</button>
          </div>
        </Modal>
      )

    case 'missioncheck':
      return (
        <Modal>
          <div className="text-center">
            <div className="text-4xl">📵</div>
            <h3 className="text-lg mt-2 text-slate-800">어제의 진짜 미션, 해냈어?</h3>
            <p className="text-sm bg-amber-50 rounded-2xl p-3 mt-2 text-amber-800">"{modal.mission}"</p>
            <p className="text-[0.625rem] text-slate-400 mt-2">🤝 양심껏! 진짜 해낸 사람만 눌러 줘.</p>
            <div className="flex gap-2 mt-3">
              <button onClick={() => missionCheck(true)} className="flex-1 py-3 bg-green-500 text-white rounded-2xl active:scale-95 transition">해냈어요! (+30P)</button>
              <button onClick={() => missionCheck(false)} className="flex-1 py-3 bg-slate-200 text-slate-600 rounded-2xl active:scale-95 transition">못 했어요</button>
            </div>
          </div>
        </Modal>
      )

    case 'missionnew':
      return (
        <Modal>
          <div className="text-center">
            <div className="text-4xl">📋</div>
            <h3 className="text-lg mt-2 text-slate-800">오늘의 진짜 미션</h3>
            <p className="text-[0.625rem] text-slate-400">게임 밖 진짜 세상에서 도전!</p>
            <p className="text-sm bg-amber-50 rounded-2xl p-3 mt-2 text-amber-800 font-bold">"{modal.mission}"</p>
            <p className="text-xs text-slate-500 mt-2">내일 아침에 확인할게. 성공하면 <b>+30P</b>!</p>
            <button onClick={ackModal} className="mt-4 w-full py-3 bg-amber-500 text-white rounded-2xl active:scale-95 transition">도전!</button>
          </div>
        </Modal>
      )

    case 'diary':
      return <DiaryModal g={g} onAck={ackModal} />

    case 'quiz':
      return <QuizModal q={modal.q} onDone={quizDone} />

    case 'pledge':
      return (
        <Modal>
          <div className="text-center">
            <div className="text-4xl">🌙</div>
            <h3 className="text-lg mt-2 text-slate-800">내일의 다짐</h3>
            <p className="text-xs text-slate-500">다짐한 행동은 내일 효과가 <b>+20%</b>!</p>
            <div className="mt-3 space-y-2">
              <button onClick={() => pickPledge('exercise')} className="w-full py-3 bg-green-100 text-green-800 rounded-2xl active:scale-95 transition">⚽ 내일은 운동!</button>
              <button onClick={() => pickPledge('reading')} className="w-full py-3 bg-blue-100 text-blue-800 rounded-2xl active:scale-95 transition">📚 내일은 독서!</button>
              <button onClick={() => pickPledge('sleep')} className="w-full py-3 bg-indigo-100 text-indigo-800 rounded-2xl active:scale-95 transition">🌙 내일은 일찍 자기! (성공 시 +15XP)</button>
            </div>
          </div>
        </Modal>
      )

    case 'impulse':
      return (
        <Modal>
          <div className="text-center bg-slate-900 -m-5 p-6 rounded-3xl">
            <div className="text-5xl anim-wobble">📱</div>
            <h3 className="text-lg mt-3 text-red-400">충동 폭발…!</h3>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              요즘 너무 참기만 했나 봐.<br />
              한별이가 이불 속에서 몰래 폰을 켰다…<br />
              <span className="text-red-400">🍿 팝콘 지수 +20</span>
            </p>
            <p className="text-[0.625rem] text-slate-500 mt-2">💡 행복이 너무 낮으면 이런 일이 생겨. 무조건 참는 게 답이 아니야!</p>
            <button onClick={ackModal} className="mt-4 w-full py-3 bg-slate-700 text-white rounded-2xl active:scale-95 transition">…아침이 밝았다</button>
          </div>
        </Modal>
      )

    case 'badge':
      return (
        <Modal>
          <div className="text-center">
            <p className="text-xs text-amber-500 font-bold">NEW BADGE!</p>
            <div className="text-7xl mt-2 anim-pop">{modal.badge.icon}</div>
            <h3 className="text-xl mt-2 text-slate-800">{modal.badge.name}</h3>
            <p className="text-xs text-slate-500 mt-1">{modal.badge.desc}</p>
            <button onClick={ackModal} className="mt-4 w-full py-3 bg-amber-500 text-white rounded-2xl active:scale-95 transition">🏅 획득!</button>
          </div>
        </Modal>
      )

    case 'shopOpen':
      return (
        <Modal>
          <div className="text-center">
            <div className="text-5xl">🛍️</div>
            <h3 className="text-lg mt-2 text-slate-800">상점이 열렸어요!</h3>
            <p className="text-sm text-slate-600 mt-2">좋은 선택으로 모은 포인트로<br />관리 도구와 재미 장비를 살 수 있어.</p>
            <button onClick={ackModal} className="mt-4 w-full py-3 bg-pink-500 text-white rounded-2xl active:scale-95 transition">구경 가기!</button>
          </div>
        </Modal>
      )

    default:
      return null
  }
}

/* ---------- 개별 모달 ---------- */

function EventModal({ g, ev, onChoose }) {
  const [picked, setPicked] = useState(null)
  const hint = g.equipped.includes('clock')
  const pick = (key) => {
    const c = ev[key]
    sfx.click()
    if (c.special === 'sneak') { onChoose(key); return }
    setPicked(key)
  }
  return (
    <Modal flip>
      {!picked ? (
        <div className="text-center">
          <p className="text-xs text-rose-400 font-bold">오늘의 사건!</p>
          <div className="text-5xl mt-2">{ev.icon}</div>
          <p className="text-slate-800 mt-3 leading-relaxed">{ev.text}</p>
          <div className="mt-4 space-y-2">
            {['a', 'b'].map((k) => (
              <button key={k} onClick={() => pick(k)}
                className="w-full py-3 bg-slate-100 hover:bg-indigo-50 text-slate-700 rounded-2xl text-sm active:scale-95 transition">
                {ev[k].label} {hint && ev[k].good && <span>✨</span>}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center anim-pop">
          <div className="text-5xl">{ev[picked].good ? '🌟' : '💭'}</div>
          <p className="text-slate-700 mt-3">{ev[picked].msg}</p>
          <button onClick={() => onChoose(picked)} className="mt-4 w-full py-3 bg-slate-800 text-white rounded-2xl active:scale-95 transition">확인</button>
        </div>
      )}
    </Modal>
  )
}

function OneMoreModal({ g, onMore, onQuit }) {
  // 다크패턴 재현: 연속할수록 '그만하기'가 작아진다 (최대 2단계)
  const stage = Math.min(Math.max(g.consecGames - 1, 0), 2)
  const quitCls = ['text-sm px-5 py-2.5', 'text-xs px-4 py-2 translate-x-3', 'text-[0.625rem] px-3 py-1.5 translate-x-6'][stage]
  const famBlock = g.equipped.includes('familylink') && g.consecGames >= 2
  return (
    <Modal>
      <div className="text-center">
        <div className="text-5xl anim-wobble">🎮</div>
        <h3 className="text-xl mt-2 text-slate-800">한 판 더…?</h3>
        {stage === 1 && <p className="text-xs text-slate-400 mt-1">어라, '그만하기' 버튼이 좀 작아진 것 같은데?</p>}
        {stage === 2 && <p className="text-xs text-rose-400 mt-1">버튼이 도망간다…! 이거 완전 수상한데?</p>}
        <div className="mt-4 flex flex-col items-center gap-2">
          <button onClick={onMore} disabled={famBlock}
            className={`w-full py-4 rounded-2xl text-xl text-white shadow-xl transition active:scale-95 ${famBlock ? 'bg-slate-300' : 'bg-gradient-to-r from-pink-500 via-orange-400 to-yellow-400 animate-pulse'}`}>
            🔥 한 판 더!!
          </button>
          {famBlock && <p className="text-[0.625rem] text-indigo-500">🛡️ 패밀리 링크 작동 중: 오늘은 여기까지!</p>}
          <button onClick={onQuit}
            className={`bg-slate-200 text-slate-500 rounded-xl transition active:scale-95 ${quitCls}`}>
            그만하기
          </button>
        </div>
      </div>
    </Modal>
  )
}

function DiaryModal({ g, onAck }) {
  const cnt = (k) => g.todayActions.filter((a) => a === k).length
  const game = cnt('game'), ex = cnt('soccer') + cnt('jump'), read = cnt('read'), talk = cnt('talk')
  let comment = '차분하고 알찬 하루였어!'
  if (game > 0 && ex > 0 && read > 0) comment = '완벽한 균형! 오늘의 너, 진짜 마스터 같았어. ⚖️'
  else if (game > 0 && (ex > 0 || read > 0)) comment = '게임도 하고 다른 활동도 한 균형 잡힌 하루!'
  else if (game >= 3) comment = '오늘은 게임에 좀 빠져버렸네… 내일은 균형을 찾아보자.'
  else if (game === 0 && g.stats.happy < 30) comment = '알차긴 했는데… 재미가 부족했나? 놀 땐 놀아도 돼!'
  return (
    <Modal>
      <div className="text-center">
        <div className="text-4xl">📔</div>
        <h3 className="text-lg mt-2 text-slate-800">{g.day}일차 오늘의 일기</h3>
        <div className="flex justify-center gap-3 mt-3 text-sm bg-slate-50 rounded-2xl p-3">
          <span>🎮×{game}</span><span>⚽×{ex}</span><span>📖×{read}</span><span>💬×{talk}</span>
        </div>
        <p className="text-sm text-slate-600 mt-3">"{comment}"</p>
        <button onClick={onAck} className="mt-4 w-full py-3 bg-indigo-500 text-white rounded-2xl active:scale-95 transition">오늘의 복습 퀴즈 ▶</button>
      </div>
    </Modal>
  )
}

function QuizModal({ q, onDone }) {
  const [ans, setAns] = useState(null)
  const correct = ans !== null && ans === q.a
  return (
    <Modal>
      {ans === null ? (
        <div className="text-center">
          <p className="text-xs text-indigo-400 font-bold">자기 전 OX 퀴즈! (정답 +10XP)</p>
          <p className="text-slate-800 mt-3 leading-relaxed">{q.q}</p>
          <div className="flex gap-3 mt-4">
            <button onClick={() => { setAns(true); sfx[q.a === true ? 'good' : 'bad']() }} className="flex-1 py-4 bg-blue-500 text-white text-2xl rounded-2xl active:scale-95 transition">O</button>
            <button onClick={() => { setAns(false); sfx[q.a === false ? 'good' : 'bad']() }} className="flex-1 py-4 bg-red-500 text-white text-2xl rounded-2xl active:scale-95 transition">X</button>
          </div>
        </div>
      ) : (
        <div className="text-center anim-pop">
          <div className="text-5xl">{correct ? '⭕' : '❌'}</div>
          <p className={`mt-2 text-lg ${correct ? 'text-green-600' : 'text-red-500'}`}>{correct ? '정답! +10XP' : '땡!'}</p>
          <p className="text-sm bg-slate-50 rounded-2xl p-3 mt-2 text-slate-600">{q.expl}</p>
          <button onClick={() => onDone(correct)} className="mt-4 w-full py-3 bg-slate-800 text-white rounded-2xl active:scale-95 transition">내일의 다짐 ▶</button>
        </div>
      )}
    </Modal>
  )
}
