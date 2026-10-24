import { useEffect, useRef, useState, type ReactNode } from 'react';
import meta from './clips.meta.json';
import { CLIPS } from './mascotClips';

/**
 * The 3D TREK mascot as pre-rendered clips. Each clip is a plain H.264 MP4 with
 * "stacked alpha": the colour frame on top, its transparency below as a grey
 * mask. A tiny WebGL shader joins the halves into a transparent image, so the
 * same file plays everywhere (iOS included) with hardware decoding and no
 * runtime 3D. Eyes are holes in the mask, like the SVG's `--m-bg` cut-outs.
 *
 * One seamless loop per scene and theme plus a one-shot click clip; the click
 * cross-fades into the clip and back inside the shader. The <video> elements
 * stay 2 px stand-ins: browsers hang their own controls on visible videos.
 *
 * Clips live next to this file as `<scene>[--<mood>]-<light|dark>-<loop|poke>.mp4`,
 * cropped to the area the scene uses; `crop` in clips.meta.json places them back
 * inside the full 88:96 box so every scene keeps the same scale. Only URLs are
 * bundled; the files load when a mascot actually renders.
 */
const META: Record<string, { poke: number; crop: number[] }> = meta;

const FADE_MS = 140;
// The clips frame the figure with more air than the SVG, so they render at 1.6 times the requested size
const CLIP_SCALE = 1.6;

function useIsDark() {
  const read = () => document.documentElement.classList.contains('dark');
  const [dark, setDark] = useState(read);
  useEffect(() => {
    const mo = new MutationObserver(() => setDark(read()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);
  return dark;
}

const VERT = `attribute vec2 p; varying vec2 uv;
void main(){ uv = vec2((p.x + 1.0) * 0.5, (1.0 - p.y) * 0.5); gl_Position = vec4(p, 0.0, 1.0); }`;
// colour from the top half, alpha from the bottom half; premultiplied for the canvas
const FRAG = `precision mediump float; uniform sampler2D a; uniform sampler2D b; uniform float m; varying vec2 uv;
vec4 px(sampler2D t){ vec3 c = texture2D(t, vec2(uv.x, uv.y * 0.5)).rgb; float al = texture2D(t, vec2(uv.x, 0.5 + uv.y * 0.5)).r; return vec4(c * al, al); }
void main(){ gl_FragColor = mix(px(a), px(b), m); }`;

function setupGl(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
  if (!gl) return null;
  const shader = (type: number, src: string) => {
    const s = gl.createShader(type);
    if (s) {
      gl.shaderSource(s, src);
      gl.compileShader(s);
    }
    return s;
  };
  const prog = gl.createProgram();
  const vs = shader(gl.VERTEX_SHADER, VERT),
    fs = shader(gl.FRAGMENT_SHADER, FRAG);
  if (!prog || !vs || !fs) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const tex = (unit: number, name: string) => {
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.uniform1i(gl.getUniformLocation(prog, name), unit);
    return t;
  };
  const texA = tex(0, 'a'),
    texB = tex(1, 'b');
  const mixLoc = gl.getUniformLocation(prog, 'm');
  const upload = (unit: number, t: WebGLTexture | null, v: HTMLVideoElement) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, v);
  };
  return {
    draw(loop: HTMLVideoElement | null, poke: HTMLVideoElement | null, m: number) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (loop && loop.readyState >= 2) upload(0, texA, loop);
      if (poke && m > 0 && poke.readyState >= 2) upload(1, texB, poke);
      gl.uniform1f(mixLoc, m);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
  };
}

const HIDDEN_VIDEO = {
  position: 'absolute',
  insetInlineStart: 0,
  top: 0,
  width: 2,
  height: 2,
  opacity: 0,
  pointerEvents: 'none',
} as const;

export default function MascotClip({
  clip,
  scene,
  size,
  className = '',
  fallback,
}: {
  clip: string;
  scene: string;
  size: number;
  className?: string;
  /** shown when the device refuses to autoplay (e.g. iOS low power mode) */
  fallback: ReactNode;
}) {
  const theme = useIsDark() ? 'dark' : 'light';
  const loopUrl = CLIPS[`./clips/${clip}-${theme}-loop.mp4`];
  const pokeUrl = CLIPS[`./clips/${scene}-${theme}-poke.mp4`];
  const pokeMs = (META[scene]?.poke ?? 2) * 1000;
  const [x, y, w, h] = META[clip]?.crop ?? [0, 0, 1, 1];
  const boxW = size * CLIP_SCALE,
    boxH = (boxW * 96) / 88;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loopRef = useRef<HTMLVideoElement>(null);
  const pokeRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  // 0 = loop, 1 = click clip; the draw loop eases toward the target for the cross-fade
  const mix = useRef({ value: 0, target: 0, until: 0 });

  useEffect(() => {
    const v = loopRef.current;
    if (!v) return;
    v.play().catch(() => setFailed(true));
  }, [loopUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || failed) return;
    const gl = setupGl(canvas);
    if (!gl) {
      setFailed(true);
      return;
    }
    let raf = 0,
      visible = true,
      last = performance.now();
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(canvas);
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = now - last;
      last = now;
      if (!visible) return;
      const m = mix.current;
      if (m.target === 1 && now > m.until) m.target = 0;
      const step = dt / FADE_MS;
      m.value = m.target > m.value ? Math.min(1, m.value + step) : Math.max(0, m.value - step);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = Math.round(canvas.clientWidth * dpr),
        ch = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }
      gl.draw(loopRef.current, pokeRef.current, m.value);
    };
    raf = requestAnimationFrame(frame);
    // No loseContext() here: StrictMode re-runs this effect on the same canvas, which would then hand back the dead
    // context. The browser frees it with the canvas.
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [failed]);

  if (failed) return <>{fallback}</>;

  const poke = () => {
    const v = pokeRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play()
      .then(() => {
        mix.current.target = 1;
        mix.current.until = performance.now() + Math.max(300, pokeMs - FADE_MS);
      })
      .catch(() => {
        mix.current.target = 0;
      });
  };

  return (
    <span
      role="presentation"
      onClick={poke}
      className={`relative inline-block shrink-0 cursor-pointer ${className}`}
      style={{ width: boxW, height: boxH }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: `${x * 100}%` /* rtl-lint-disable: the crop sits where the frame was cut, video is never mirrored */,
          top: `${y * 100}%`,
          width: `${w * 100}%`,
          height: `${h * 100}%`,
        }}
      />
      <video
        key={loopUrl}
        ref={loopRef}
        src={loopUrl}
        autoPlay
        loop
        muted
        playsInline
        disablePictureInPicture
        aria-hidden
        style={HIDDEN_VIDEO}
      />
      {pokeUrl && (
        <video
          key={pokeUrl}
          ref={pokeRef}
          src={pokeUrl}
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          aria-hidden
          style={HIDDEN_VIDEO}
        />
      )}
    </span>
  );
}
