// Procedural soundtrack for the 4.0.0 "KEINE ANGST" show. Everything is
// synthesized with the Web Audio API at runtime — heartbeat with a real click
// transient, wind-noise textures, a trailer-style noise riser, cue-driven
// sub-bass impacts and a moving chord progression with glided voice-leading —
// so the show ships zero audio assets and touches no copyrighted material.

export type NoFearAct = 'fear' | 'dread' | 'silence' | 'hope' | 'anthem' | 'end'

interface Voice {
  stop: (at: number) => void
}

// The hope/anthem harmony: D — A — f#m — E in open voicings, five gliding
// voices each. Movement is what makes the release feel alive.
const PROGRESSION: number[][] = [
  [73.42, 110.0, 146.83, 185.0, 293.66], // D2  A2  D3  F#3  D4
  [82.41, 110.0, 164.81, 220.0, 277.18], // E2  A2  E3  A3   C#4
  [92.5, 110.0, 138.59, 185.0, 277.18],  // F#2 A2  C#3  F#3  C#4
  [82.41, 123.47, 164.81, 207.65, 246.94], // E2 B2 E3 G#3 B3
]
const CHORD_SECONDS = 4.4
const BASS_ROOTS = [36.71, 41.2, 46.25, 41.2] // D1 E1 F#1 E1

export class NoFearAudio {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private noiseBuf: AudioBuffer | null = null
  private muted = false
  private act: NoFearAct | null = null
  private heartbeatTimer: number | null = null
  private nextBeat = 0
  private bpm = 76
  private beatGain = 0.55
  private voices: Voice[] = []
  private padVoices: OscillatorNode[] = []
  private bassOsc: OscillatorNode | null = null
  private chordTimer: number | null = null
  private chordIdx = 0

  /** Must be called from a user gesture (the beacon click) so autoplay rules allow it. */
  start(): void {
    if (this.ctx) return
    const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    this.ctx = new Ctor()
    // A lazily-loaded chunk can construct us a beat after the click gesture —
    // resume() re-arms the context if the browser started it suspended.
    if (this.ctx.state === 'suspended') void this.ctx.resume().catch(() => {})
    this.master = this.ctx.createGain()
    this.master.gain.value = this.muted ? 0 : 0.9
    const limiter = this.ctx.createDynamicsCompressor()
    limiter.threshold.value = -12
    limiter.knee.value = 22
    limiter.ratio.value = 12
    this.master.connect(limiter)
    limiter.connect(this.ctx.destination)
    // 2s of looped white noise feeds every texture (wind, risers, ticks).
    const len = this.ctx.sampleRate * 2
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
    const data = this.noiseBuf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
    this.nextBeat = this.ctx.currentTime + 0.2
    this.heartbeatTimer = window.setInterval(() => this.scheduleBeats(), 100)
  }

  setMuted(muted: boolean): void {
    this.muted = muted
    if (this.master && this.ctx) {
      // The mute button is a real gesture — use it as a recovery path for
      // browsers (Safari) that refused to start the context earlier.
      if (!muted && this.ctx.state === 'suspended') void this.ctx.resume().catch(() => {})
      this.master.gain.setTargetAtTime(muted ? 0 : 0.9, this.ctx.currentTime, 0.05)
    }
  }

  /** Best-effort resume from any fresh user gesture (overlay pointerdown). */
  resume(): void {
    if (this.ctx?.state === 'suspended') void this.ctx.resume().catch(() => {})
  }

  /** Freeze/unfreeze with the show clock when the tab goes hidden. */
  setSuspended(suspended: boolean): void {
    if (!this.ctx) return
    if (suspended) void this.ctx.suspend().catch(() => {})
    else void this.ctx.resume().catch(() => {})
  }

  /** A cue-driven cinema hit: sub boom + filtered noise burst. strength 0..1. */
  impact(strength = 1): void {
    if (!this.ctx || !this.master) return
    const t = this.ctx.currentTime + 0.02
    const o = this.ctx.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(82, t)
    o.frequency.exponentialRampToValueAtTime(28, t + 0.9)
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.9 * strength, t + 0.018)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6)
    o.connect(g); g.connect(this.master)
    o.start(t); o.stop(t + 1.8)
    if (this.noiseBuf) {
      const n = this.ctx.createBufferSource()
      n.buffer = this.noiseBuf
      const lp = this.ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.setValueAtTime(900, t)
      lp.frequency.exponentialRampToValueAtTime(120, t + 0.5)
      const ng = this.ctx.createGain()
      ng.gain.setValueAtTime(0.0001, t)
      ng.gain.exponentialRampToValueAtTime(0.32 * strength, t + 0.012)
      ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.6)
      n.connect(lp); lp.connect(ng); ng.connect(this.master)
      n.start(t); n.stop(t + 0.8)
    }
  }

  setAct(act: NoFearAct): void {
    if (!this.ctx || !this.master || this.act === act) return
    this.act = act
    const t = this.ctx.currentTime
    this.releaseVoices(act === 'silence' ? 0.1 : 1.6)
    this.stopChords()
    switch (act) {
      case 'fear':
        this.bpm = 74
        this.beatGain = 0.55
        this.drone(55, 82.4, 0.15, 230, 3)
        this.wind(0.05, 420)
        break
      case 'dread':
        this.bpm = 116
        this.beatGain = 0.7
        this.drone(55, 77.8, 0.19, 300, 1) // flattened fifth — it beats uneasily
        this.wind(0.085, 700)
        this.riser(t)
        break
      case 'silence':
        this.bpm = 0 // the cut itself is the effect
        break
      case 'hope':
        this.bpm = 54
        this.beatGain = 0.3
        this.startChords(700, 0.085, false)
        break
      case 'anthem':
        this.bpm = 0
        this.startChords(2400, 0.075, true)
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
    this.stopChords()
    this.releaseVoices(0.1)
    const ctx = this.ctx
    this.ctx = null
    this.master = null
    if (ctx) window.setTimeout(() => { void ctx.close().catch(() => {}) }, 300)
  }

  // ── sustained voices ──────────────────────────────────────────────────────

  private releaseVoices(release: number): void {
    if (!this.ctx) return
    const at = this.ctx.currentTime + release
    for (const v of this.voices) v.stop(at)
    this.voices = []
  }

  private hold(gain: GainNode, oscs: (OscillatorNode | AudioBufferSourceNode)[]): void {
    this.voices.push({
      stop: (at) => {
        gain.gain.cancelScheduledValues(0)
        gain.gain.setTargetAtTime(0, Math.max(at - 0.1, 0), 0.25)
        for (const o of oscs) { try { o.stop(at + 1.5) } catch { /* already stopped */ } }
      },
    })
  }

  /** Two slightly detuned low saws through a lowpass — the fear act's room tone. */
  private drone(f1: number, f2: number, level: number, cutoff: number, attack: number): void {
    if (!this.ctx || !this.master) return
    const t = this.ctx.currentTime
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(level, t + attack)
    const lp = this.ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = cutoff
    // A slow LFO breathes the filter so the drone never sits still.
    const lfo = this.ctx.createOscillator()
    lfo.frequency.value = 0.09
    const lfoGain = this.ctx.createGain()
    lfoGain.gain.value = cutoff * 0.35
    lfo.connect(lfoGain); lfoGain.connect(lp.frequency)
    lfo.start(t)
    const oscs: (OscillatorNode | AudioBufferSourceNode)[] = [f1, f2].map(f => {
      const o = this.ctx!.createOscillator()
      o.type = 'sawtooth'
      o.frequency.value = f
      o.detune.value = Math.random() * 7 - 3.5
      o.connect(lp)
      o.start(t)
      return o
    })
    oscs.push(lfo)
    lp.connect(g)
    g.connect(this.master)
    this.hold(g, oscs)
  }

  /** Bandpassed noise that slowly swells and recedes — wind through the scene. */
  private wind(level: number, freq: number): void {
    if (!this.ctx || !this.master || !this.noiseBuf) return
    const t = this.ctx.currentTime
    const src = this.ctx.createBufferSource()
    src.buffer = this.noiseBuf
    src.loop = true
    const bp = this.ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = freq
    bp.Q.value = 0.6
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(level, t + 4)
    const lfo = this.ctx.createOscillator()
    lfo.frequency.value = 0.07
    const lfoGain = this.ctx.createGain()
    lfoGain.gain.value = level * 0.55
    lfo.connect(lfoGain); lfoGain.connect(g.gain)
    lfo.start(t)
    src.connect(bp); bp.connect(g); g.connect(this.master)
    src.start(t)
    this.hold(g, [src, lfo])
  }

  /** Trailer riser: a saw sweep doubled by a noise sweep, 14s of climb. */
  private riser(t: number): void {
    if (!this.ctx || !this.master) return
    const o = this.ctx.createOscillator()
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(180, t)
    o.frequency.exponentialRampToValueAtTime(820, t + 14)
    const bp = this.ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.setValueAtTime(300, t)
    bp.frequency.exponentialRampToValueAtTime(1400, t + 14)
    bp.Q.value = 8
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.055, t + 7)
    o.connect(bp); bp.connect(g); g.connect(this.master)
    o.start(t)
    const nodes: (OscillatorNode | AudioBufferSourceNode)[] = [o]
    if (this.noiseBuf) {
      const n = this.ctx.createBufferSource()
      n.buffer = this.noiseBuf
      n.loop = true
      const nbp = this.ctx.createBiquadFilter()
      nbp.type = 'bandpass'
      nbp.frequency.setValueAtTime(240, t)
      nbp.frequency.exponentialRampToValueAtTime(3200, t + 14)
      nbp.Q.value = 1.4
      const ng = this.ctx.createGain()
      ng.gain.setValueAtTime(0.0001, t)
      ng.gain.exponentialRampToValueAtTime(0.09, t + 12)
      n.connect(nbp); nbp.connect(ng); ng.connect(this.master)
      n.start(t)
      nodes.push(n)
      this.hold(ng, [n])
    }
    this.hold(g, nodes)
  }

  // ── the progression ───────────────────────────────────────────────────────

  /** Five gliding triangle voices + a sub root, stepping through D–A–f#m–E. */
  private startChords(cutoff: number, level: number, withSub: boolean): void {
    if (!this.ctx || !this.master) return
    const t = this.ctx.currentTime
    const lp = this.ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(cutoff * 0.35, t)
    lp.frequency.exponentialRampToValueAtTime(cutoff, t + 7)
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(level, t + 3.2)
    this.padVoices = []
    const first = PROGRESSION[0]
    const oscs: OscillatorNode[] = []
    for (let v = 0; v < first.length; v++) {
      for (const det of [-5, 5]) {
        const o = this.ctx.createOscillator()
        o.type = 'triangle'
        o.frequency.value = first[v]
        o.detune.value = det
        o.connect(lp)
        o.start(t)
        oscs.push(o)
        this.padVoices.push(o)
      }
    }
    lp.connect(g)
    g.connect(this.master)
    this.hold(g, oscs)
    if (withSub) {
      const sub = this.ctx.createOscillator()
      sub.type = 'sine'
      sub.frequency.value = BASS_ROOTS[0]
      const sg = this.ctx.createGain()
      sg.gain.setValueAtTime(0.0001, t)
      sg.gain.exponentialRampToValueAtTime(0.16, t + 2.5)
      sub.connect(sg); sg.connect(this.master)
      sub.start(t)
      this.bassOsc = sub
      this.hold(sg, [sub])
    }
    this.chordIdx = 0
    this.chordTimer = window.setInterval(() => this.nextChord(), CHORD_SECONDS * 1000)
  }

  private nextChord(): void {
    if (!this.ctx || this.padVoices.length === 0) return
    this.chordIdx = (this.chordIdx + 1) % PROGRESSION.length
    const chord = PROGRESSION[this.chordIdx]
    const t = this.ctx.currentTime
    // Each pair of detuned oscillators shares a chord voice; glide legato.
    for (let i = 0; i < this.padVoices.length; i++) {
      const target = chord[Math.floor(i / 2) % chord.length]
      this.padVoices[i].frequency.setTargetAtTime(target, t, 0.55)
    }
    this.bassOsc?.frequency.setTargetAtTime(BASS_ROOTS[this.chordIdx], t, 0.5)
  }

  private stopChords(): void {
    if (this.chordTimer !== null) window.clearInterval(this.chordTimer)
    this.chordTimer = null
    this.padVoices = []
    this.bassOsc = null
  }

  /** Sparse high pings on the A-major pentatonic — tiny lights going on. */
  private shimmer(t: number): void {
    if (!this.ctx || !this.master) return
    const notes = [880, 1108.7, 1318.5, 1479.98, 1760]
    const g = this.ctx.createGain()
    g.gain.value = 0.055
    g.connect(this.master)
    const oscs: OscillatorNode[] = []
    for (let i = 0; i < 14; i++) {
      const o = this.ctx.createOscillator()
      o.type = 'sine'
      o.frequency.value = notes[Math.floor(Math.random() * notes.length)]
      const eg = this.ctx.createGain()
      const at = t + 0.8 + i * 0.8 + Math.random() * 0.4
      eg.gain.setValueAtTime(0.0001, at)
      eg.gain.exponentialRampToValueAtTime(1, at + 0.02)
      eg.gain.exponentialRampToValueAtTime(0.0001, at + 1.9)
      o.connect(eg); eg.connect(g)
      o.start(at)
      o.stop(at + 2.1)
      oscs.push(o)
    }
    this.voices.push({ stop: (stopAt) => { g.gain.setTargetAtTime(0, stopAt, 0.2); for (const o of oscs) { try { o.stop(stopAt + 0.5) } catch { /* ok */ } } } })
  }

  // ── heartbeat ─────────────────────────────────────────────────────────────

  private scheduleBeats(): void {
    if (!this.ctx || !this.master || this.bpm <= 0) return
    // Clamp BEFORE scheduling: after a bpm=0 act (the silence) nextBeat lags far
    // behind and would otherwise back-fill a burst of past-due thumps at once.
    if (this.nextBeat < this.ctx.currentTime) this.nextBeat = this.ctx.currentTime + 0.1
    const ahead = this.ctx.currentTime + 0.3
    while (this.nextBeat < ahead) {
      this.thump(this.nextBeat, this.beatGain)
      this.thump(this.nextBeat + 0.19, this.beatGain * 0.55)
      this.nextBeat += 60 / this.bpm
    }
  }

  /** A heartbeat with body AND transient: low sine thump + tiny filtered click. */
  private thump(at: number, level: number): void {
    if (!this.ctx || !this.master) return
    const o = this.ctx.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(58, at)
    o.frequency.exponentialRampToValueAtTime(34, at + 0.12)
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, at)
    g.gain.exponentialRampToValueAtTime(level, at + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.24)
    o.connect(g)
    g.connect(this.master)
    o.start(at)
    o.stop(at + 0.32)
    if (this.noiseBuf) {
      const n = this.ctx.createBufferSource()
      n.buffer = this.noiseBuf
      const hp = this.ctx.createBiquadFilter()
      hp.type = 'lowpass'
      hp.frequency.value = 340
      const ng = this.ctx.createGain()
      ng.gain.setValueAtTime(0.0001, at)
      ng.gain.exponentialRampToValueAtTime(level * 0.5, at + 0.006)
      ng.gain.exponentialRampToValueAtTime(0.0001, at + 0.05)
      n.connect(hp); hp.connect(ng); ng.connect(this.master)
      n.start(at)
      n.stop(at + 0.08)
    }
  }
}
