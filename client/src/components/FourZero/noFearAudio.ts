// Procedural soundtrack for the 4.0.0 "KEINE ANGST" show. Everything is
// synthesized with the Web Audio API at runtime — a heartbeat, a low drone, a
// rising dissonance for the fear act and a warm A-major pad for the release —
// so the show ships zero audio assets and touches no copyrighted material.

export type NoFearAct = 'fear' | 'dread' | 'silence' | 'hope' | 'anthem' | 'end'

interface Voice {
  stop: (at: number) => void
}

export class NoFearAudio {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private muted = false
  private act: NoFearAct | null = null
  private heartbeatTimer: number | null = null
  private nextBeat = 0
  private bpm = 76
  private beatGain = 0.5
  private voices: Voice[] = []

  /** Must be called from a user gesture (the beacon click) so autoplay rules allow it. */
  start(): void {
    if (this.ctx) return
    const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    this.ctx = new Ctor()
    this.master = this.ctx.createGain()
    this.master.gain.value = this.muted ? 0 : 0.8
    // A soft knee compressor keeps the stacked voices from ever clipping.
    const limiter = this.ctx.createDynamicsCompressor()
    limiter.threshold.value = -14
    limiter.knee.value = 24
    limiter.ratio.value = 12
    this.master.connect(limiter)
    limiter.connect(this.ctx.destination)
    // Heartbeat scheduler: 100ms tick, 300ms lookahead.
    this.nextBeat = this.ctx.currentTime + 0.2
    this.heartbeatTimer = window.setInterval(() => this.scheduleBeats(), 100)
  }

  setMuted(muted: boolean): void {
    this.muted = muted
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.8, this.ctx.currentTime, 0.05)
    }
  }

  setAct(act: NoFearAct): void {
    if (!this.ctx || !this.master || this.act === act) return
    this.act = act
    const t = this.ctx.currentTime
    // Every act replaces the sustained voices; the heartbeat just changes pace.
    this.releaseVoices(act === 'silence' ? 0.12 : 1.6)
    switch (act) {
      case 'fear':
        this.bpm = 76
        this.beatGain = 0.5
        this.drone(55, 82.4, 0.16, 260, 2.5)
        break
      case 'dread':
        this.bpm = 112
        this.beatGain = 0.62
        this.drone(55, 78, 0.2, 320, 1.2) // detuned fifth — it beats uneasily
        this.riser(t)
        break
      case 'silence':
        this.bpm = 0 // the cut itself is the effect
        break
      case 'hope':
        this.bpm = 56
        this.beatGain = 0.28
        this.pad(t, [110, 164.81, 220, 277.18], 900, 0.075) // A2 E3 A3 C#4
        break
      case 'anthem':
        this.bpm = 0
        this.pad(t, [110, 164.81, 220, 277.18, 329.63, 440], 2600, 0.062) // + E4 A4, filter open
        this.shimmer(t)
        break
      case 'end':
        this.bpm = 0
        this.master.gain.setTargetAtTime(0, t + 2.5, 1.2)
        break
    }
  }

  dispose(): void {
    if (this.heartbeatTimer !== null) window.clearInterval(this.heartbeatTimer)
    this.heartbeatTimer = null
    this.releaseVoices(0.1)
    const ctx = this.ctx
    this.ctx = null
    this.master = null
    if (ctx) window.setTimeout(() => { void ctx.close().catch(() => {}) }, 300)
  }

  // ── voices ────────────────────────────────────────────────────────────────

  private releaseVoices(release: number): void {
    if (!this.ctx) return
    const at = this.ctx.currentTime + release
    for (const v of this.voices) v.stop(at)
    this.voices = []
  }

  private hold(gain: GainNode, oscs: OscillatorNode[]): void {
    this.voices.push({
      stop: (at) => {
        gain.gain.cancelScheduledValues(0)
        gain.gain.setTargetAtTime(0, Math.max(at - 0.1, 0), 0.25)
        for (const o of oscs) { try { o.stop(at + 1.5) } catch { /* already stopped */ } }
      },
    })
  }

  /** Two slightly detuned low oscillators through a lowpass — the room tone of the fear act. */
  private drone(f1: number, f2: number, level: number, cutoff: number, attack: number): void {
    if (!this.ctx || !this.master) return
    const t = this.ctx.currentTime
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(level, t + attack)
    const lp = this.ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = cutoff
    const oscs = [f1, f2].map(f => {
      const o = this.ctx!.createOscillator()
      o.type = 'sawtooth'
      o.frequency.value = f
      o.detune.value = Math.random() * 7 - 3.5
      o.connect(lp)
      o.start(t)
      return o
    })
    lp.connect(g)
    g.connect(this.master)
    this.hold(g, oscs)
  }

  /** A slow 14s upward sweep, quiet but relentless — the dread act's tension. */
  private riser(t: number): void {
    if (!this.ctx || !this.master) return
    const o = this.ctx.createOscillator()
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(180, t)
    o.frequency.exponentialRampToValueAtTime(760, t + 14)
    const bp = this.ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.setValueAtTime(300, t)
    bp.frequency.exponentialRampToValueAtTime(1200, t + 14)
    bp.Q.value = 9
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.05, t + 6)
    o.connect(bp); bp.connect(g); g.connect(this.master)
    o.start(t)
    this.hold(g, [o])
  }

  /** Warm triangle-wave chord with chorus detune — the release. */
  private pad(t: number, freqs: number[], cutoff: number, level: number): void {
    if (!this.ctx || !this.master) return
    const lp = this.ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(cutoff * 0.4, t)
    lp.frequency.exponentialRampToValueAtTime(cutoff, t + 6)
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(level, t + 3.2)
    const oscs: OscillatorNode[] = []
    for (const f of freqs) {
      for (const det of [-4, 4]) {
        const o = this.ctx.createOscillator()
        o.type = 'triangle'
        o.frequency.value = f
        o.detune.value = det
        o.connect(lp)
        o.start(t)
        oscs.push(o)
      }
    }
    lp.connect(g)
    g.connect(this.master)
    this.hold(g, oscs)
  }

  /** Sparse high pings on the A-major pentatonic — tiny lights going on. */
  private shimmer(t: number): void {
    if (!this.ctx || !this.master) return
    const notes = [880, 1108.7, 1318.5, 1760]
    const g = this.ctx.createGain()
    g.gain.value = 0.05
    g.connect(this.master)
    const oscs: OscillatorNode[] = []
    for (let i = 0; i < 10; i++) {
      const o = this.ctx.createOscillator()
      o.type = 'sine'
      o.frequency.value = notes[Math.floor(Math.random() * notes.length)]
      const eg = this.ctx.createGain()
      const at = t + 0.8 + i * 1.05 + Math.random() * 0.5
      eg.gain.setValueAtTime(0.0001, at)
      eg.gain.exponentialRampToValueAtTime(1, at + 0.02)
      eg.gain.exponentialRampToValueAtTime(0.0001, at + 1.6)
      o.connect(eg); eg.connect(g)
      o.start(at)
      o.stop(at + 1.8)
      oscs.push(o)
    }
    this.voices.push({ stop: (stopAt) => { g.gain.setTargetAtTime(0, stopAt, 0.2); for (const o of oscs) { try { o.stop(stopAt + 0.5) } catch { /* ok */ } } } })
  }

  // ── heartbeat ─────────────────────────────────────────────────────────────

  private scheduleBeats(): void {
    if (!this.ctx || !this.master || this.bpm <= 0) return
    const ahead = this.ctx.currentTime + 0.3
    while (this.nextBeat < ahead) {
      this.thump(this.nextBeat, this.beatGain)
      this.thump(this.nextBeat + 0.19, this.beatGain * 0.55) // the "dub"
      this.nextBeat += 60 / this.bpm
    }
    if (this.nextBeat < this.ctx.currentTime) this.nextBeat = this.ctx.currentTime + 0.1
  }

  private thump(at: number, level: number): void {
    if (!this.ctx || !this.master) return
    const o = this.ctx.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(62, at)
    o.frequency.exponentialRampToValueAtTime(38, at + 0.1)
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, at)
    g.gain.exponentialRampToValueAtTime(level, at + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.22)
    o.connect(g)
    g.connect(this.master)
    o.start(at)
    o.stop(at + 0.3)
  }
}
