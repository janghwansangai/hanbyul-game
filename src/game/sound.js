// 외부 파일 없이 Web Audio API oscillator로만 만든 효과음 모음
let ctx = null

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(freq, { dur = 0.12, type = 'square', vol = 0.08, delay = 0, slide = 0 } = {}) {
  const c = ac()
  if (!c) return
  const t0 = c.currentTime + delay
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur)
  gain.gain.setValueAtTime(vol, t0)
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur)
  osc.connect(gain).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.05)
}

export const sfx = {
  click() { tone(660, { dur: 0.07, type: 'square', vol: 0.05 }) },
  good() { tone(784, { dur: 0.1 }); tone(1175, { dur: 0.14, delay: 0.09 }) },
  bad() { tone(196, { dur: 0.25, type: 'sawtooth', slide: -60 }) },
  combo() { tone(880, { dur: 0.08 }); tone(1109, { dur: 0.08, delay: 0.07 }); tone(1319, { dur: 0.12, delay: 0.14 }) },
  levelup() { [523, 659, 784, 1047].forEach((f, i) => tone(f, { dur: 0.14, type: 'triangle', vol: 0.1, delay: i * 0.09 })) },
  badge() { tone(1047, { dur: 0.1, type: 'triangle', vol: 0.1 }); tone(1568, { dur: 0.2, type: 'triangle', vol: 0.1, delay: 0.1 }) },
  boss() { tone(82, { dur: 0.5, type: 'sawtooth', vol: 0.12, slide: -30 }); tone(65, { dur: 0.6, type: 'sawtooth', vol: 0.12, delay: 0.4, slide: -20 }) },
  hit() { tone(440, { dur: 0.06, type: 'square', vol: 0.07, slide: 200 }) },
  miss() { tone(150, { dur: 0.15, type: 'sawtooth', vol: 0.08, slide: -50 }) },
  fanfare() { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, { dur: 0.16, type: 'triangle', vol: 0.1, delay: i * 0.13 })) },
  warn() { tone(220, { dur: 0.3, type: 'square', vol: 0.08 }); tone(185, { dur: 0.4, type: 'square', vol: 0.08, delay: 0.35 }) },
}
