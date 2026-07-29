// FE-NOFEAR-AUD-001 to FE-NOFEAR-AUD-043
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NoFearAudio } from './noFearAudio'

// jsdom ships no Web Audio implementation, so the graph below is a recorder:
// every node keeps its outgoing connections, every AudioParam keeps the calls
// that were scheduled on it, and the context clock is driven by `nowMs` so the
// fake timers and the audio clock stay in lockstep.

type NodeKind =
  | 'gain'
  | 'oscillator'
  | 'bufferSource'
  | 'biquad'
  | 'convolver'
  | 'compressor'
  | 'delay'
  | 'destination'

let created: FakeNode[] = []
let contexts: FakeAudioContext[] = []
let nowMs = 0

const behavior = {
  state: 'running' as AudioContextState,
  resumeRejects: false,
  suspendRejects: false,
  closeRejects: false,
}

class FakeAudioParam {
  value: number
  setValueAtTime = vi.fn((value: number, _at: number) => {
    this.value = value
  })
  linearRampToValueAtTime = vi.fn((_value: number, _at: number) => undefined)
  exponentialRampToValueAtTime = vi.fn((_value: number, _at: number) => undefined)
  setTargetAtTime = vi.fn((_value: number, _at: number, _timeConstant: number) => undefined)
  cancelScheduledValues = vi.fn((_at: number) => undefined)

  constructor(value = 0) {
    this.value = value
  }
}

class FakeNode {
  kind: NodeKind
  connections: unknown[] = []
  connect: ReturnType<typeof vi.fn>
  disconnect: ReturnType<typeof vi.fn>

  constructor(kind: NodeKind) {
    this.kind = kind
    this.connect = vi.fn((target: unknown) => {
      this.connections.push(target)
      return target
    })
    this.disconnect = vi.fn(() => {
      this.connections = []
    })
    created.push(this)
  }
}

class FakeSource extends FakeNode {
  started: number[] = []
  stopped: number[] = []
  throwOnStop = false
  start = vi.fn((at = 0) => {
    this.started.push(at)
  })
  stop = vi.fn((at = 0) => {
    if (this.throwOnStop) throw new Error('InvalidStateError')
    this.stopped.push(at)
  })
}

class FakeOscillator extends FakeSource {
  type = 'sine'
  frequency = new FakeAudioParam(440)
  detune = new FakeAudioParam(0)

  constructor() {
    super('oscillator')
  }
}

class FakeBufferSource extends FakeSource {
  buffer: FakeAudioBuffer | null = null
  loop = false
  playbackRate = new FakeAudioParam(1)

  constructor() {
    super('bufferSource')
  }
}

class FakeGain extends FakeNode {
  gain = new FakeAudioParam(1)

  constructor() {
    super('gain')
  }
}

class FakeBiquadFilter extends FakeNode {
  type = 'lowpass'
  frequency = new FakeAudioParam(350)
  Q = new FakeAudioParam(1)
  detune = new FakeAudioParam(0)
  gain = new FakeAudioParam(0)

  constructor() {
    super('biquad')
  }
}

class FakeConvolver extends FakeNode {
  buffer: FakeAudioBuffer | null = null
  normalize = true

  constructor() {
    super('convolver')
  }
}

class FakeCompressor extends FakeNode {
  threshold = new FakeAudioParam(-24)
  knee = new FakeAudioParam(30)
  ratio = new FakeAudioParam(12)
  attack = new FakeAudioParam(0.003)
  release = new FakeAudioParam(0.25)

  constructor() {
    super('compressor')
  }
}

class FakeDelay extends FakeNode {
  delayTime = new FakeAudioParam(0)
  maxDelayTime: number

  constructor(maxDelayTime: number) {
    super('delay')
    this.maxDelayTime = maxDelayTime
  }
}

class FakeAudioBuffer {
  numberOfChannels: number
  length: number
  sampleRate: number
  duration: number
  private channels: Float32Array[]

  constructor(numberOfChannels: number, length: number, sampleRate: number) {
    this.numberOfChannels = numberOfChannels
    this.length = length
    this.sampleRate = sampleRate
    this.duration = length / sampleRate
    this.channels = Array.from({ length: numberOfChannels }, () => new Float32Array(length))
  }

  getChannelData(channel: number): Float32Array {
    return this.channels[channel]
  }
}

class FakeAudioContext {
  state: AudioContextState
  // A low rate keeps the procedurally filled impulse response and noise buffer
  // small; the code only ever multiplies against it.
  sampleRate = 8000
  destination = new FakeNode('destination')
  resume = vi.fn(() =>
    behavior.resumeRejects ? Promise.reject(new Error('resume blocked')) : Promise.resolve(),
  )
  suspend = vi.fn(() =>
    behavior.suspendRejects ? Promise.reject(new Error('suspend blocked')) : Promise.resolve(),
  )
  close = vi.fn(() =>
    behavior.closeRejects ? Promise.reject(new Error('close failed')) : Promise.resolve(),
  )
  decodeAudioData = vi.fn(() => Promise.resolve(new FakeAudioBuffer(2, 16, 8000)))

  constructor() {
    this.state = behavior.state
    contexts.push(this)
  }

  get currentTime(): number {
    return nowMs / 1000
  }

  createGain(): FakeGain {
    return new FakeGain()
  }
  createOscillator(): FakeOscillator {
    return new FakeOscillator()
  }
  createBufferSource(): FakeBufferSource {
    return new FakeBufferSource()
  }
  createBiquadFilter(): FakeBiquadFilter {
    return new FakeBiquadFilter()
  }
  createConvolver(): FakeConvolver {
    return new FakeConvolver()
  }
  createDynamicsCompressor(): FakeCompressor {
    return new FakeCompressor()
  }
  createDelay(maxDelayTime = 1): FakeDelay {
    return new FakeDelay(maxDelayTime)
  }
  createBuffer(numberOfChannels: number, length: number, sampleRate: number): FakeAudioBuffer {
    return new FakeAudioBuffer(numberOfChannels, length, sampleRate)
  }
}

// ── query helpers ────────────────────────────────────────────────────────────

function mark(): number {
  return created.length
}

function since(from: number): FakeNode[] {
  return created.slice(from)
}

function oscs(list: FakeNode[]): FakeOscillator[] {
  return list.filter((n) => n.kind === 'oscillator') as FakeOscillator[]
}

function bufs(list: FakeNode[]): FakeBufferSource[] {
  return list.filter((n) => n.kind === 'bufferSource') as FakeBufferSource[]
}

function gains(list: FakeNode[]): FakeGain[] {
  return list.filter((n) => n.kind === 'gain') as FakeGain[]
}

function filters(list: FakeNode[]): FakeBiquadFilter[] {
  return list.filter((n) => n.kind === 'biquad') as FakeBiquadFilter[]
}

function only<T>(list: T[]): T {
  expect(list).toHaveLength(1)
  return list[0]
}

function ctx(): FakeAudioContext {
  return contexts[contexts.length - 1]
}

function compressor(): FakeCompressor {
  return created.find((n) => n.kind === 'compressor') as FakeCompressor
}

function masterGain(): FakeGain {
  const limiter = compressor()
  return gains(created).find((g) => g.connections.includes(limiter)) as FakeGain
}

function reverbIn(): FakeGain {
  const convolver = created.find((n) => n.kind === 'convolver')
  return gains(created).find((g) => g.connections.includes(convolver)) as FakeGain
}

/** How much of `node` is sent into the hall, or undefined when it stays dry. */
function hallSend(node: FakeNode): number | undefined {
  const hall = reverbIn()
  const send = node.connections.find(
    (target) => target instanceof FakeGain && target.connections.includes(hall),
  )
  return (send as FakeGain | undefined)?.gain.value
}

/** Start times of the heartbeat's sine bodies — its 58 Hz drop is the signature. */
function thumpTimes(list: FakeNode[]): number[] {
  return oscs(list)
    .filter((o) => o.frequency.setValueAtTime.mock.calls.some((call) => call[0] === 58))
    .map((o) => o.started[0])
}

function rms(data: Float32Array, from: number, to: number): number {
  let sum = 0
  for (let i = from; i < to; i++) sum += data[i] * data[i]
  return Math.sqrt(sum / (to - from))
}

/** Advances the audio clock and the timer queue together, in interval-sized steps. */
function advance(ms: number): void {
  let left = ms
  while (left > 0) {
    const step = Math.min(50, left)
    nowMs += step
    vi.advanceTimersByTime(step)
    left -= step
  }
}

describe('NoFearAudio', () => {
  let audio: NoFearAudio

  beforeEach(() => {
    vi.useFakeTimers()
    created = []
    contexts = []
    nowMs = 0
    behavior.state = 'running'
    behavior.resumeRejects = false
    behavior.suspendRejects = false
    behavior.closeRejects = false
    vi.stubGlobal('AudioContext', FakeAudioContext)
    vi.stubGlobal('webkitAudioContext', undefined)
    audio = new NoFearAudio()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  describe('start', () => {
    it('FE-NOFEAR-AUD-001: routes master through a limiter into the destination', () => {
      audio.start()

      const limiter = compressor()
      expect(limiter.threshold.value).toBe(-12)
      expect(limiter.knee.value).toBe(22)
      expect(limiter.ratio.value).toBe(12)
      expect(limiter.connections).toEqual([ctx().destination])
      expect(masterGain().gain.value).toBe(0.9)
      expect(masterGain().connections).toEqual([limiter])
    })

    it('FE-NOFEAR-AUD-002: is idempotent — a second call keeps the first context', () => {
      audio.start()
      audio.start()

      expect(contexts).toHaveLength(1)
    })

    it('FE-NOFEAR-AUD-003: without a Web Audio constructor every entry point stays a no-op', () => {
      vi.stubGlobal('AudioContext', undefined)

      audio.start()
      audio.setMuted(true)
      audio.resume()
      audio.setSuspended(true)
      audio.swell()
      audio.impact()
      audio.setAct('fear')
      audio.dispose()

      expect(contexts).toHaveLength(0)
      expect(created).toHaveLength(0)
    })

    it('FE-NOFEAR-AUD-004: falls back to the prefixed webkitAudioContext', () => {
      vi.stubGlobal('AudioContext', undefined)
      vi.stubGlobal('webkitAudioContext', FakeAudioContext)

      audio.start()

      expect(contexts).toHaveLength(1)
      expect(masterGain().gain.value).toBe(0.9)
    })

    it('FE-NOFEAR-AUD-005: re-arms a context the browser started suspended', () => {
      behavior.state = 'suspended'

      audio.start()

      expect(ctx().resume).toHaveBeenCalledTimes(1)
    })

    it('FE-NOFEAR-AUD-006: swallows a rejected resume on start', async () => {
      behavior.state = 'suspended'
      behavior.resumeRejects = true

      expect(() => audio.start()).not.toThrow()
      await Promise.resolve()

      expect(ctx().resume).toHaveBeenCalledTimes(1)
    })

    it('FE-NOFEAR-AUD-007: builds a 3.4s stereo impulse response that decays', () => {
      audio.start()

      const convolver = created.find((n) => n.kind === 'convolver') as FakeConvolver
      const ir = convolver.buffer as FakeAudioBuffer
      expect(ir.numberOfChannels).toBe(2)
      expect(ir.length).toBe(Math.floor(8000 * 3.4))
      const left = ir.getChannelData(0)
      expect(rms(left, 0, 400)).toBeGreaterThan(rms(left, left.length - 400, left.length))
      expect(rms(ir.getChannelData(1), 0, 400)).toBeGreaterThan(0)
    })

    it('FE-NOFEAR-AUD-008: returns the hall through a 0.5 wet gain on the master bus', () => {
      audio.start()

      const convolver = created.find((n) => n.kind === 'convolver') as FakeConvolver
      expect(reverbIn().connections).toEqual([convolver])
      const wet = gains(created).find((g) => convolver.connections.includes(g)) as FakeGain
      expect(wet.gain.value).toBe(0.5)
      expect(wet.connections).toEqual([masterGain()])
    })

    it('FE-NOFEAR-AUD-009: fills a 2s noise buffer that every texture reuses', () => {
      audio.start()
      const m = mark()
      audio.setAct('fear')

      const noise = bufs(since(m))
      expect(noise.length).toBeGreaterThan(0)
      const buffer = noise[0].buffer as FakeAudioBuffer
      expect(buffer.length).toBe(8000 * 2)
      expect(buffer.numberOfChannels).toBe(1)
      const data = buffer.getChannelData(0)
      expect(rms(data, 0, 1000)).toBeGreaterThan(0.4)
      expect(Math.max(...data.slice(0, 1000))).toBeLessThan(1)
      expect(Math.min(...data.slice(0, 1000))).toBeGreaterThan(-1)
      // all textures share the one buffer
      expect(noise.every((n) => n.buffer === buffer)).toBe(true)
    })

    it('FE-NOFEAR-AUD-010: starts silent when the show was muted before the gesture', () => {
      audio.setMuted(true)
      audio.start()

      expect(masterGain().gain.value).toBe(0)
    })
  })

  describe('transport', () => {
    it('FE-NOFEAR-AUD-011: setMuted ramps the master down and back up', () => {
      audio.start()
      const master = masterGain()

      audio.setMuted(true)
      expect(master.gain.setTargetAtTime).toHaveBeenLastCalledWith(0, 0, 0.05)

      advance(500)
      audio.setMuted(false)
      expect(master.gain.setTargetAtTime).toHaveBeenLastCalledWith(0.9, 0.5, 0.05)
    })

    it('FE-NOFEAR-AUD-012: unmuting recovers a context the browser refused to start', () => {
      audio.start()
      ctx().state = 'suspended'

      audio.setMuted(false)

      expect(ctx().resume).toHaveBeenCalledTimes(1)
    })

    it('FE-NOFEAR-AUD-013: muting never tries to resume', () => {
      audio.start()
      ctx().state = 'suspended'

      audio.setMuted(true)

      expect(ctx().resume).not.toHaveBeenCalled()
    })

    it('FE-NOFEAR-AUD-014: resume only touches a suspended context', () => {
      audio.start()

      audio.resume()
      expect(ctx().resume).not.toHaveBeenCalled()

      ctx().state = 'suspended'
      audio.resume()
      expect(ctx().resume).toHaveBeenCalledTimes(1)
    })

    it('FE-NOFEAR-AUD-043: a browser that rejects resume/suspend never surfaces the error', async () => {
      behavior.resumeRejects = true
      behavior.suspendRejects = true
      audio.start()
      ctx().state = 'suspended'

      audio.setMuted(false)
      audio.resume()
      audio.setSuspended(true)
      audio.setSuspended(false)
      await Promise.resolve()
      await Promise.resolve()

      expect(ctx().resume).toHaveBeenCalledTimes(3)
      expect(ctx().suspend).toHaveBeenCalledTimes(1)
    })

    it('FE-NOFEAR-AUD-015: setSuspended freezes and unfreezes with the show clock', () => {
      audio.start()

      audio.setSuspended(true)
      expect(ctx().suspend).toHaveBeenCalledTimes(1)
      expect(ctx().resume).not.toHaveBeenCalled()

      audio.setSuspended(false)
      expect(ctx().resume).toHaveBeenCalledTimes(1)
    })
  })

  describe('one-shots', () => {
    it('FE-NOFEAR-AUD-016: swell blooms a 55 Hz sine over 1.6s and dies at +5', () => {
      audio.start()
      const m = mark()

      audio.swell()

      const o = only(oscs(since(m)))
      expect(o.type).toBe('sine')
      expect(o.frequency.value).toBe(55)
      expect(o.started[0]).toBeCloseTo(0.05)
      expect(o.stopped[0]).toBeCloseTo(5.25)
      const envelope = gains(since(m))[0]
      expect(o.connections).toEqual([envelope])
      const ramps = envelope.gain.exponentialRampToValueAtTime.mock.calls
      expect(ramps[0][0]).toBeCloseTo(0.22)
      expect(ramps[0][1]).toBeCloseTo(1.65)
      expect(ramps[1][0]).toBeCloseTo(0.0001)
      expect(ramps[1][1]).toBeCloseTo(5.05)
      expect(hallSend(envelope)).toBe(0.6)
    })

    it('FE-NOFEAR-AUD-017: impact drops a sub from 82 to 28 Hz and scales with strength', () => {
      audio.start()
      const m = mark()

      audio.impact(0.5)

      const sub = oscs(since(m))[0]
      expect(sub.frequency.setValueAtTime.mock.calls[0][0]).toBe(82)
      const sweep = sub.frequency.exponentialRampToValueAtTime.mock.calls[0]
      expect(sweep[0]).toBe(28)
      expect(sweep[1]).toBeCloseTo(0.92)
      expect(sub.started[0]).toBeCloseTo(0.02)
      expect(sub.stopped[0]).toBeCloseTo(1.82)
      const body = gains(since(m))[0]
      expect(body.gain.exponentialRampToValueAtTime.mock.calls[0][0]).toBeCloseTo(0.45)
      expect(hallSend(body)).toBe(0.5)
    })

    it('FE-NOFEAR-AUD-018: impact doubles the sub with a lowpassed noise burst', () => {
      audio.start()
      const m = mark()

      audio.impact()

      const burst = only(bufs(since(m)))
      expect(burst.started[0]).toBeCloseTo(0.02)
      expect(burst.stopped[0]).toBeCloseTo(0.82)
      const lp = only(filters(since(m)))
      expect(lp.type).toBe('lowpass')
      expect(lp.frequency.setValueAtTime.mock.calls[0][0]).toBe(900)
      expect(lp.frequency.exponentialRampToValueAtTime.mock.calls[0][0]).toBe(120)
      expect(burst.connections).toEqual([lp])
      const noiseGain = gains(since(m)).find((g) => lp.connections.includes(g)) as FakeGain
      expect(noiseGain.gain.exponentialRampToValueAtTime.mock.calls[0][0]).toBeCloseTo(0.3)
      expect(hallSend(noiseGain)).toBe(0.6)
    })
  })

  describe('acts', () => {
    it('FE-NOFEAR-AUD-019: fear lays a sub, a drifting fifth and a breathing rumble', () => {
      audio.start()
      const m = mark()

      audio.setAct('fear')

      const list = since(m)
      const sub = oscs(list).find((o) => o.type === 'sine' && o.frequency.value === 55)
      expect(sub).toBeDefined()
      const fifth = oscs(list).find((o) => o.type === 'triangle' && o.frequency.value === 82.4)
      expect(fifth).toBeDefined()
      // the detune LFO drives the fifth's detune param, not its output
      const drift = gains(list).find((g) => g.connections.includes(fifth!.detune)) as FakeGain
      expect(drift.gain.value).toBe(6)
      // the rumble's gain breathes from a second LFO
      const rumble = bufs(list).find((n) => n.loop) as FakeBufferSource
      const rlp = filters(list).find((f) => rumble.connections.includes(f)) as FakeBiquadFilter
      expect(rlp.type).toBe('lowpass')
      expect(rlp.frequency.value).toBe(120)
      const rumbleGain = gains(list).find((g) => rlp.connections.includes(g)) as FakeGain
      const breathe = gains(list).find((g) => g.connections.includes(rumbleGain.gain)) as FakeGain
      expect(breathe.gain.value).toBe(0.25)
      // no grind semitone in the fear act
      expect(oscs(list).some((o) => o.frequency.value === 58.27)).toBe(false)
    })

    it('FE-NOFEAR-AUD-020: fear opens the bed and the wind from silence', () => {
      audio.start()
      const m = mark()

      audio.setAct('fear')

      const list = since(m)
      const bed = gains(list)[0]
      expect(bed.gain.setValueAtTime.mock.calls[0][0]).toBe(0.0001)
      expect(bed.gain.exponentialRampToValueAtTime.mock.calls[0]).toEqual([0.16, 3])
      expect(hallSend(bed)).toBe(0.3)
      const bp = filters(list).find((f) => f.type === 'bandpass') as FakeBiquadFilter
      expect(bp.frequency.value).toBe(420)
      expect(bp.Q.value).toBe(0.6)
    })

    it('FE-NOFEAR-AUD-021: the wind LFO modulates a series stage, never the release envelope', () => {
      audio.start()
      const m = mark()

      audio.setAct('fear')

      const list = since(m)
      const trem = gains(list).find((g) => g.gain.value === 0.75) as FakeGain
      expect(trem).toBeDefined()
      const lfoGain = gains(list).find((g) => g.connections.includes(trem.gain)) as FakeGain
      expect(lfoGain.gain.value).toBe(0.4)
      // the wind envelope itself must stay free of LFO input, otherwise the hard
      // cut into the silence act could never mute it
      const windEnv = gains(list).find((g) => trem.connections.includes(g)) as FakeGain
      expect(gains(list).some((g) => g.connections.includes(windEnv.gain))).toBe(false)
    })

    it('FE-NOFEAR-AUD-022: dread adds the grinding semitone and a 14s riser', () => {
      audio.start()
      const m = mark()

      audio.setAct('dread')

      const list = since(m)
      expect(oscs(list).some((o) => o.frequency.value === 58.27)).toBe(true)
      const riser = only(oscs(list).filter((o) => o.type === 'sawtooth'))
      expect(riser.frequency.setValueAtTime.mock.calls[0][0]).toBe(180)
      expect(riser.frequency.exponentialRampToValueAtTime.mock.calls[0]).toEqual([820, 14])
      const riserBp = filters(list).find(
        (f) => f.type === 'bandpass' && f.Q.value === 8,
      ) as FakeBiquadFilter
      expect(riserBp.frequency.exponentialRampToValueAtTime.mock.calls[0]).toEqual([1400, 14])
      const noiseSweep = filters(list).find(
        (f) => f.type === 'bandpass' && f.Q.value === 1.4,
      ) as FakeBiquadFilter
      expect(noiseSweep.frequency.exponentialRampToValueAtTime.mock.calls[0]).toEqual([3200, 14])
    })

    it('FE-NOFEAR-AUD-023: setting the same act twice changes nothing', () => {
      audio.start()
      audio.setAct('fear')
      const m = mark()

      audio.setAct('fear')

      expect(since(m)).toHaveLength(0)
    })

    it('FE-NOFEAR-AUD-024: silence pulls the fear act away fast and stops the beat', () => {
      audio.start()
      const m = mark()
      audio.setAct('fear')
      const bed = gains(since(m))[0]
      const bedOscs = oscs(since(m))
      advance(400)

      const afterCut = mark()
      audio.setAct('silence')

      // release 0.6 instead of the usual 1.6
      expect(bed.gain.cancelScheduledValues).toHaveBeenCalledWith(0)
      const target = bed.gain.setTargetAtTime.mock.calls[0]
      expect(target[0]).toBe(0)
      expect(target[1]).toBeCloseTo(0.9)
      expect(target[2]).toBe(0.25)
      expect(bedOscs[0].stopped[0]).toBeCloseTo(2.5)

      advance(2000)
      expect(thumpTimes(since(afterCut))).toHaveLength(0)
    })

    it('FE-NOFEAR-AUD-025: a normal act change uses the slow 1.6s release', () => {
      audio.start()
      const m = mark()
      audio.setAct('fear')
      const bedOscs = oscs(since(m))

      audio.setAct('dread')

      expect(bedOscs[0].stopped[0]).toBeCloseTo(3.1)
    })

    it('FE-NOFEAR-AUD-026: hope opens the progression without a sub root', () => {
      audio.start()
      const m = mark()

      audio.setAct('hope')

      const list = since(m)
      const pads = oscs(list).filter((o) => o.type === 'triangle')
      expect(pads).toHaveLength(10)
      expect(oscs(list).some((o) => o.type === 'sine')).toBe(false)
      const lp = only(filters(list))
      expect(lp.frequency.setValueAtTime.mock.calls[0][0]).toBeCloseTo(245)
      expect(lp.frequency.exponentialRampToValueAtTime.mock.calls[0]).toEqual([700, 7])
      const padGain = gains(list).find((g) => lp.connections.includes(g)) as FakeGain
      expect(padGain.gain.exponentialRampToValueAtTime.mock.calls[0]).toEqual([0.085, 3.2])
      expect(hallSend(padGain)).toBe(0.55)
    })

    it('FE-NOFEAR-AUD-027: the pad is ten detuned voices on the opening D chord', () => {
      audio.start()
      const m = mark()

      audio.setAct('hope')

      const pads = oscs(since(m)).filter((o) => o.type === 'triangle')
      expect(pads.map((o) => o.frequency.value)).toEqual([
        73.42, 73.42, 110.0, 110.0, 146.83, 146.83, 185.0, 185.0, 293.66, 293.66,
      ])
      expect(pads.map((o) => o.detune.value)).toEqual([-5, 5, -5, 5, -5, 5, -5, 5, -5, 5])
      expect(pads.every((o) => o.started[0] === 0)).toBe(true)
    })

    it('FE-NOFEAR-AUD-028: anthem adds a dry sub root and opens the filter wide', () => {
      audio.start()
      const m = mark()

      audio.setAct('anthem')

      const list = since(m)
      const lp = filters(list).find((f) => f.type === 'lowpass') as FakeBiquadFilter
      expect(lp.frequency.setValueAtTime.mock.calls[0][0]).toBeCloseTo(840)
      const sub = oscs(list).find((o) => o.frequency.value === 36.71) as FakeOscillator
      expect(sub.type).toBe('sine')
      const subGain = gains(list).find((g) => sub.connections.includes(g)) as FakeGain
      expect(subGain.gain.exponentialRampToValueAtTime.mock.calls[0]).toEqual([0.16, 2.5])
      // low end stays out of the hall, otherwise it turns to mud
      expect(hallSend(subGain)).toBeUndefined()
      expect(subGain.connections).toEqual([masterGain()])
    })

    it('FE-NOFEAR-AUD-029: anthem sprinkles pentatonic pings through a feedback delay', () => {
      audio.start()
      const m = mark()

      audio.setAct('anthem')

      const list = since(m)
      const delay = created.find((n) => n.kind === 'delay') as FakeDelay
      expect(delay.delayTime.value).toBe(0.38)
      const feedback = gains(list).find((g) => delay.connections.includes(g)) as FakeGain
      expect(feedback.gain.value).toBe(0.35)
      expect(feedback.connections).toEqual([delay])
      expect(hallSend(delay)).toBe(0.8)

      const pings = oscs(list).filter((o) => o.type === 'sine' && o.frequency.value !== 36.71)
      expect(pings).toHaveLength(14)
      const scale = [880, 1108.7, 1318.5, 1479.98, 1760]
      expect(pings.every((o) => scale.includes(o.frequency.value))).toBe(true)
      // one ping every ~0.8s, each ringing 2.1s
      expect(pings[0].started[0]).toBeGreaterThanOrEqual(0.8)
      expect(pings[13].started[0]).toBeGreaterThanOrEqual(0.8 + 13 * 0.8)
      expect(pings[0].stopped[0]).toBeCloseTo(pings[0].started[0] + 2.1)
    })

    it('FE-NOFEAR-AUD-030: end fades the master out on a long tail', () => {
      audio.start()
      const master = masterGain()
      advance(1000)

      audio.setAct('end')

      const call = master.gain.setTargetAtTime.mock.calls[0]
      expect(call[0]).toBe(0)
      expect(call[1]).toBeCloseTo(3.5)
      expect(call[2]).toBe(1.2)
    })

    it('FE-NOFEAR-AUD-031: acts before the first gesture are ignored', () => {
      audio.setAct('anthem')

      expect(created).toHaveLength(0)
    })
  })

  describe('progression', () => {
    it('FE-NOFEAR-AUD-032: steps the pad onto the next chord every 4.4s', () => {
      audio.start()
      const m = mark()
      audio.setAct('anthem')
      const pads = oscs(since(m)).filter((o) => o.type === 'triangle')

      advance(4400)

      const expected = [82.41, 82.41, 110.0, 110.0, 164.81, 164.81, 220.0, 220.0, 277.18, 277.18]
      pads.forEach((o, i) => {
        const call = o.frequency.setTargetAtTime.mock.calls[0]
        expect(call[0]).toBe(expected[i])
        expect(call[2]).toBe(0.55)
      })
    })

    it('FE-NOFEAR-AUD-033: the sub root walks D–E–F#–E and wraps around', () => {
      audio.start()
      const m = mark()
      audio.setAct('anthem')
      const sub = oscs(since(m)).find((o) => o.frequency.value === 36.71) as FakeOscillator

      advance(4400 * 4)

      const roots = sub.frequency.setTargetAtTime.mock.calls.map((call) => call[0])
      expect(roots).toEqual([41.2, 46.25, 41.2, 36.71])
      expect(sub.frequency.setTargetAtTime.mock.calls[0][2]).toBe(0.5)
    })

    it('FE-NOFEAR-AUD-034: hope has no sub, so only the pad glides', () => {
      audio.start()
      const m = mark()
      audio.setAct('hope')
      const opened = since(m)
      const pads = oscs(opened).filter((o) => o.type === 'triangle')
      expect(oscs(opened).some((o) => o.type === 'sine')).toBe(false)

      advance(4400)

      expect(pads[0].frequency.setTargetAtTime).toHaveBeenCalledTimes(1)
      expect(pads[0].frequency.setTargetAtTime.mock.calls[0][0]).toBe(82.41)
    })

    it('FE-NOFEAR-AUD-035: leaving the act stops the chord clock', () => {
      audio.start()
      const m = mark()
      audio.setAct('hope')
      const pads = oscs(since(m)).filter((o) => o.type === 'triangle')

      audio.setAct('end')
      advance(4400 * 2)

      expect(pads[0].frequency.setTargetAtTime).not.toHaveBeenCalled()
    })
  })

  describe('heartbeat', () => {
    it('FE-NOFEAR-AUD-036: schedules a beat plus its echo ahead of the clock', () => {
      audio.start()
      const m = mark()

      advance(1000)

      const times = thumpTimes(since(m))
      expect(times).toHaveLength(4)
      expect(times[0]).toBeCloseTo(0.2)
      expect(times[1]).toBeCloseTo(0.39)
      expect(times[2] - times[0]).toBeCloseTo(60 / 76)
      expect(times[3] - times[2]).toBeCloseTo(0.19)
    })

    it('FE-NOFEAR-AUD-037: a beat is a sine body plus a highpassed click', () => {
      audio.start()
      const m = mark()

      advance(100)

      const list = since(m)
      const body = oscs(list)[0]
      expect(body.type).toBe('sine')
      expect(body.frequency.exponentialRampToValueAtTime.mock.calls[0][0]).toBe(34)
      expect(body.stopped[0]).toBeCloseTo(0.52)
      const bodyGain = body.connections[0] as FakeGain
      expect(bodyGain.gain.exponentialRampToValueAtTime.mock.calls[0][0]).toBeCloseTo(0.55)
      expect(hallSend(bodyGain)).toBe(0.1)

      const click = bufs(list)[0]
      const hp = filters(list)[0]
      expect(hp.type).toBe('highpass')
      expect(hp.frequency.value).toBe(1700)
      expect(click.connections).toEqual([hp])
      const clickGain = gains(list).find((g) => hp.connections.includes(g)) as FakeGain
      expect(clickGain.gain.exponentialRampToValueAtTime.mock.calls[0][0]).toBeCloseTo(0.165)
      // the click is close, not in the hall
      expect(clickGain.connections).toEqual([masterGain()])
    })

    it('FE-NOFEAR-AUD-038: dread doubles the tempo and hits harder', () => {
      audio.start()
      audio.setAct('dread')
      const m = mark()

      advance(1000)

      const times = thumpTimes(since(m))
      expect(times).toHaveLength(6)
      expect(times[2] - times[0]).toBeCloseTo(60 / 116)
      const first = oscs(since(m))[0].connections[0] as FakeGain
      expect(first.gain.exponentialRampToValueAtTime.mock.calls[0][0]).toBeCloseTo(0.7)
    })

    it('FE-NOFEAR-AUD-039: clamps the beat clock instead of back-filling after the silence', () => {
      audio.start()
      audio.setAct('silence')
      advance(3000)
      const m = mark()

      audio.setAct('hope')
      advance(100)

      const times = thumpTimes(since(m))
      expect(times).toHaveLength(2)
      expect(times[0]).toBeCloseTo(3.2)
      expect(times[1]).toBeCloseTo(3.39)
    })
  })

  describe('teardown', () => {
    it('FE-NOFEAR-AUD-040: dispose mutes immediately and closes the context late', async () => {
      audio.start()
      const master = masterGain()
      audio.setAct('fear')
      const context = ctx()
      const m = mark()

      audio.dispose()

      expect(master.gain.setTargetAtTime).toHaveBeenLastCalledWith(0, 0, 0.05)
      expect(context.close).not.toHaveBeenCalled()

      advance(300)
      await Promise.resolve()
      expect(context.close).toHaveBeenCalledTimes(1)

      // the heartbeat interval is gone with it
      advance(2000)
      expect(thumpTimes(since(m))).toHaveLength(0)
    })

    it('FE-NOFEAR-AUD-041: dispose swallows a rejected close and survives a second call', async () => {
      behavior.closeRejects = true
      audio.start()
      const context = ctx()

      audio.dispose()
      advance(300)
      await Promise.resolve()
      expect(context.close).toHaveBeenCalledTimes(1)

      const m = mark()
      expect(() => audio.dispose()).not.toThrow()
      advance(300)
      expect(context.close).toHaveBeenCalledTimes(1)
      audio.swell()
      audio.impact()
      audio.setAct('anthem')
      expect(since(m)).toHaveLength(0)
    })

    it('FE-NOFEAR-AUD-042: a voice that refuses to stop does not break the act change', () => {
      audio.start()
      const m = mark()
      audio.setAct('anthem')
      const voices = [...oscs(since(m)), ...bufs(since(m))]
      for (const v of voices) v.throwOnStop = true

      expect(() => audio.setAct('end')).not.toThrow()

      expect(voices.every((v) => v.stop.mock.calls.length > 0)).toBe(true)
    })
  })
})
