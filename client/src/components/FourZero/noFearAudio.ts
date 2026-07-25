// Procedural soundtrack for the 4.0.0 "KEINE ANGST" show. Everything is
// synthesized with the Web Audio API at runtime — no audio assets, no
// copyrighted material. The cinema comes from three things: a convolution
// reverb fed by a procedurally generated impulse response (dry synthesis
// always sounds like a buzzer; a hall makes it a room), an organic low bed of
// sub sine + filtered rumble instead of raw sawtooths, and cue-driven sub
// impacts whose tails bloom in that same hall.

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
  private reverbIn: GainNode | null = null
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
    const limiter = this.ctx.createDynamicsCompressor()
    limiter.threshold.value = -12
    limiter.knee.value = 22
    limiter.ratio.value = 12
    limiter.connect(this.ctx.destination)
    this.master = this.ctx.createGain()
    this.master.gain.value = this.muted ? 0 : 0.9
    this.master.connect(limiter)
    // The hall: a convolver fed by 3.4s of exponentially decaying stereo noise.
    // Everything sends into it in different amounts; the wet return rides the
    // same master gain so mute/fade cover it too.
    const convolver = this.ctx.createConvolver()
    convolver.buffer = this.makeImpulseResponse(3.4, 2.7)
    const wet = this.ctx.createGain()
    wet.gain.value = 0.5
    this.reverbIn = this.ctx.createGain()
    this.reverbIn.connect(convolver)
    convolver.connect(wet)
    wet.connect(this.master)
    // 2s of looped white noise feeds every texture (wind, rumble, risers, ticks).
    const len = this.ctx.sampleRate * 2
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
    const data = this.noiseBuf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
    this.nextBeat = this.ctx.currentTime + 0.2
    this.heartbeatTimer = window.setInterval(() => this.scheduleBeats(), 100)
  }

  private makeImpulseResponse(seconds: number, decay: number): AudioBuffer {
    const ctx = this.ctx as AudioContext
    const rate = ctx.sampleRate
    const len = Math.floor(rate * seconds)
    const ir = ctx.createBuffer(2, len, rate)
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch)
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** decay
      }
    }
    return ir
  }

  /** Routes a node to the dry bus plus a measured send into the hall. */
  private out(node: AudioNode, send: number): void {
    if (!this.master || !this.reverbIn) return
    node.connect(this.master)
    if (send > 0) {
      const g = (this.ctx as AudioContext).createGain()
      g.gain.value = send
      node.connect(g)
      g.connect(this.reverbIn)
    }
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

  /** A soft warm swell out of the silence — the first calm breath, not a hit. */
  swell(): void {
    if (!this.ctx || !this.master) return
    const t = this.ctx.currentTime + 0.05
    const o = this.ctx.createOscillator()
    o.type = 'sine'
    o.frequency.value = 55 // A1 — the root the hope act will grow from
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.22, t + 1.6)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 5)
    o.connect(g)
    this.out(g, 0.6)
    o.start(t); o.stop(t + 5.2)
  }

  /** A cue-driven cinema hit: sub boom + filtered noise burst, tail blooming in the hall. */
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
    o.connect(g)
    this.out(g, 0.5)
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
      ng.gain.exponentialRampToValueAtTime(0.3 * strength, t + 0.012)
      ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.6)
      n.connect(lp); lp.connect(ng)
      this.out(ng, 0.6)
      n.start(t); n.stop(t + 0.8)
    }
  }

  setAct(act: NoFearAct): void {
    if (!this.ctx || !this.master || this.act === act) return
    this.act = act
    const t = this.ctx.currentTime
    // Into the silence: a fast pull-away rather than a hard kill — the fear's
    // hall tail is left ringing out on its own, like a room falling quiet.
    this.releaseVoices(act === 'silence' ? 0.6 : 1.6)
    this.stopChords()
    switch (act) {
      case 'fear':
        this.bpm = 74
        this.beatGain = 0.55
        this.darkBed(0.16, false)
        this.wind(0.05, 420)
        break
      case 'dread':
        this.bpm = 116
        this.beatGain = 0.7
        this.darkBed(0.21, true) // + a semitone rub that grinds
        this.wind(0.09, 700)
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
    // Pull the master down fast BEFORE the deferred close — closing mid-release
    // (voices still ~30% hot plus the hall tail) would pop.
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05)
    const ctx = this.ctx
    this.ctx = null
    this.master = null
    this.reverbIn = null
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

  /**
   * The fear act's floor: a sine sub, a quiet detune-drifting fifth and a
   * low rumble of filtered noise that breathes — a room, not a synthesizer.
   * `grind` adds a close semitone against the sub that beats uneasily.
   */
  private darkBed(level: number, grind: boolean): void {
    if (!this.ctx || !this.noiseBuf) return
    const t = this.ctx.currentTime
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(level, t + 3)
    const sub = this.ctx.createOscillator()
    sub.type = 'sine'
    sub.frequency.value = 55
    const subG = this.ctx.createGain()
    subG.gain.value = 0.85
    sub.connect(subG); subG.connect(g)
    const fifth = this.ctx.createOscillator()
    fifth.type = 'triangle'
    fifth.frequency.value = 82.4
    const fifthG = this.ctx.createGain()
    fifthG.gain.value = 0.3
    fifth.connect(fifthG); fifthG.connect(g)
    // Slow detune drift keeps the interval from ever sitting still.
    const drift = this.ctx.createOscillator()
    drift.frequency.value = 0.07
    const driftG = this.ctx.createGain()
    driftG.gain.value = 6
    drift.connect(driftG); driftG.connect(fifth.detune)
    const oscs: (OscillatorNode | AudioBufferSourceNode)[] = [sub, fifth, drift]
    if (grind) {
      const rub = this.ctx.createOscillator()
      rub.type = 'sine'
      rub.frequency.value = 58.27 // a semitone against the sub — it grinds
      const rubG = this.ctx.createGain()
      rubG.gain.value = 0.4
      rub.connect(rubG); rubG.connect(g)
      rub.start(t)
      oscs.push(rub)
    }
    // The rumble: looped noise through a low lowpass, its gain breathing slowly.
    const rumble = this.ctx.createBufferSource()
    rumble.buffer = this.noiseBuf
    rumble.loop = true
    const rlp = this.ctx.createBiquadFilter()
    rlp.type = 'lowpass'
    rlp.frequency.value = 120
    const rg = this.ctx.createGain()
    rg.gain.value = 0.5
    const breathe = this.ctx.createOscillator()
    breathe.frequency.value = 0.06
    const breatheG = this.ctx.createGain()
    breatheG.gain.value = 0.25
    breathe.connect(breatheG); breatheG.connect(rg.gain)
    rumble.connect(rlp); rlp.connect(rg); rg.connect(g)
    sub.start(t); fifth.start(t); drift.start(t); rumble.start(t); breathe.start(t)
    oscs.push(rumble, breathe)
    this.out(g, 0.3)
    this.hold(g, oscs)
  }

  /** Bandpassed noise that slowly swells and recedes — wind through the scene. */
  private wind(level: number, freq: number): void {
    if (!this.ctx || !this.noiseBuf) return
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
    // The swell LFO modulates a SERIES tremolo stage, not g itself — an input
    // on g.gain would ADD to the release automation and the wind could never
    // be silenced for the hard cut into the silence act.
    const trem = this.ctx.createGain()
    trem.gain.value = 0.75
    const lfo = this.ctx.createOscillator()
    lfo.frequency.value = 0.07
    const lfoGain = this.ctx.createGain()
    lfoGain.gain.value = 0.4
    lfo.connect(lfoGain); lfoGain.connect(trem.gain)
    lfo.start(t)
    src.connect(bp); bp.connect(trem); trem.connect(g)
    this.out(g, 0.55)
    src.start(t)
    this.hold(g, [src, lfo])
  }

  /** Trailer riser: a saw sweep doubled by a noise sweep, 14s of climb. */
  private riser(t: number): void {
    if (!this.ctx) return
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
    g.gain.exponentialRampToValueAtTime(0.05, t + 7)
    o.connect(bp); bp.connect(g)
    this.out(g, 0.35)
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
      ng.gain.exponentialRampToValueAtTime(0.08, t + 12)
      n.connect(nbp); nbp.connect(ng)
      this.out(ng, 0.35)
      n.start(t)
      nodes.push(n)
      this.hold(ng, [n])
    }
    this.hold(g, nodes)
  }

  // ── the progression ───────────────────────────────────────────────────────

  /** Five gliding triangle voices + a sub root, stepping through D–A–f#m–E. */
  private startChords(cutoff: number, level: number, withSub: boolean): void {
    if (!this.ctx) return
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
    this.out(g, 0.55) // the pad lives IN the hall — that's what makes it big
    this.hold(g, oscs)
    if (withSub) {
      const sub = this.ctx.createOscillator()
      sub.type = 'sine'
      sub.frequency.value = BASS_ROOTS[0]
      const sg = this.ctx.createGain()
      sg.gain.setValueAtTime(0.0001, t)
      sg.gain.exponentialRampToValueAtTime(0.16, t + 2.5)
      sub.connect(sg)
      this.out(sg, 0) // sub stays dry — low end in the hall turns to mud
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

  /** Sparse pentatonic pings through a feedback echo, drowned in the hall. */
  private shimmer(t: number): void {
    if (!this.ctx) return
    const notes = [880, 1108.7, 1318.5, 1479.98, 1760]
    const g = this.ctx.createGain()
    g.gain.value = 0.045
    // A 0.38s feedback delay turns each ping into a trailing echo.
    const delay = this.ctx.createDelay(1)
    delay.delayTime.value = 0.38
    const fb = this.ctx.createGain()
    fb.gain.value = 0.35
    delay.connect(fb); fb.connect(delay)
    g.connect(delay)
    this.out(g, 0.8)
    this.out(delay, 0.8)
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

  /** A heartbeat with body AND transient: low sine thump + tiny filtered click.
      Stays nearly dry — a heart is close, not in a hall. */
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
    this.out(g, 0.1)
    o.start(at)
    o.stop(at + 0.32)
    if (this.noiseBuf) {
      const n = this.ctx.createBufferSource()
      n.buffer = this.noiseBuf
      const hp = this.ctx.createBiquadFilter()
      hp.type = 'highpass' // the CLICK of the valve — the sine above is the body
      hp.frequency.value = 1700
      const ng = this.ctx.createGain()
      ng.gain.setValueAtTime(0.0001, at)
      ng.gain.exponentialRampToValueAtTime(level * 0.3, at + 0.005)
      ng.gain.exponentialRampToValueAtTime(0.0001, at + 0.04)
      n.connect(hp); hp.connect(ng); ng.connect(this.master)
      n.start(at)
      n.stop(at + 0.07)
    }
  }
}
