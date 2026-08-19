let audioCtx: AudioContext | null = null
let unlocked = false

function contextCtor(): typeof AudioContext | undefined {
  if (typeof window === 'undefined') return undefined
  return (
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  )
}

function getContext(): AudioContext | null {
  const Ctor = contextCtor()
  if (!Ctor) return null
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new Ctor()
  }
  return audioCtx
}

/** Browsers block sound until a click/key — call once from the library shell. */
export function unlockNotificationSound() {
  if (unlocked) return
  const ctx = getContext()
  if (!ctx) return
  void ctx.resume().then(() => {
    unlocked = ctx.state === 'running'
  })
}

function tone(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  start: number,
  duration: number,
  peak: number,
) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, start)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.016)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(gain)
  gain.connect(dest)
  osc.start(start)
  osc.stop(start + duration + 0.02)
}

/** Soft two-note chime (modern glass ping). */
export function playNotificationSound() {
  const ctx = getContext()
  if (!ctx) return

  void ctx.resume().then(() => {
    if (ctx.state !== 'running') return

    const now = ctx.currentTime
    const master = ctx.createGain()
    master.gain.value = 0.28
    master.connect(ctx.destination)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(2800, now)
    filter.Q.value = 0.7
    filter.connect(master)

    tone(ctx, filter, 784, now, 0.38, 0.55)
    tone(ctx, filter, 1174.7, now + 0.1, 0.52, 0.62)
  })
}
