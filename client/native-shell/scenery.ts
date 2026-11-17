/**
 * The landscape behind the first screens of the app: one world seen from above,
 * an island out at sea, the coast with its town, the farmland behind it and the
 * mountains at the back. A fragment shader draws it every frame (water, surf,
 * boats, a car on the road), so it is never a photo and never the same twice.
 *
 * The plan picker moves the camera through that world, one place per plan, so
 * choosing reads as travelling further inland. The scenes are framed for a phone
 * 390 px wide: a wider or taller box (iPad, an unfolded phone) shows more of the
 * world around the same centre.
 *
 * Kept light for the phone it runs on: the device pixel ratio is capped at 2,
 * the picture drops to a lower resolution when frames come slow, the loop stops
 * while the app is in the background or the canvas has left the page, and with
 * reduced motion it is one still frame. Without WebGL the box keeps its plain
 * sea colour from the stylesheet.
 */

/** Where the camera stands for a place, in world pixels, for a 390 px frame. */
export type Camera = readonly [number, number];
export const WELCOME_CAMERA: Camera = [0, 0];
/** One place per plan, in the order the plans come: island, coast, farmland, mountains. */
const PLAN_CAMERAS: readonly Camera[] = [
  [62, -392],
  [0, 24],
  [60, 290],
  [70, 660],
];
export function cameraForPlan(index: number): Camera {
  return PLAN_CAMERAS[Math.max(0, Math.min(PLAN_CAMERAS.length - 1, index))];
}

const FRAME_WIDTH = 390;

const FRAGMENT = `
  precision highp float;
  uniform vec2 uRes; uniform float uDpr; uniform float uT; uniform vec2 uCam; uniform float uHaze;
  float coast(float x) { return 128.0 + 12.0 * sin(x * 0.018 + 0.6) + 7.0 * sin(x * 0.051 + 2.1) + 4.0 * sin(x * 0.11); }
  float riverX(float y) { return 168.0 - (y - 120.0) * 0.30 + 9.0 * sin(y * 0.035 + 0.8) + 4.0 * sin(y * 0.09); }
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  vec2 hash2(vec2 p) { return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
  float noise(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y); }
  float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return v; }
  float fbm3(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 3; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return v; }
  float wave(vec2 p, float t) {
    return 0.55 * sin(dot(p, vec2(0.040, 0.085)) - t * 1.10) + 0.35 * sin(dot(p, vec2(-0.070, 0.050)) - t * 1.45)
         + 0.22 * sin(dot(p, vec2(0.110, 0.130)) - t * 2.10) + 0.12 * sin(dot(p, vec2(-0.170, 0.190)) - t * 2.90)
         + 0.90 * fbm(p * 0.055 + vec2(t * 0.18, t * 0.32));
  }
  float ridged(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { float n = 1.0 - abs(noise(p) * 2.0 - 1.0); v += a * n * n; p = p * 2.07 + vec2(3.1, 1.7); a *= 0.5; } return v; }
  /* Height: gentle near the shore, sharp ridges further inland. */
  float peaks(vec2 p) { float v = 0.0, a = 0.55; for (int i = 0; i < 7; i++) { v += a * (1.0 - abs(noise(p) * 2.0 - 1.0)); p = p * 2.13 + vec2(1.3, 4.7); a *= 0.5; } return v; }
  float ground(vec2 p) {
    float inland = smoothstep(10.0, 170.0, p.y - coast(p.x));
    return fbm(p * 0.011) * 0.4 + ridged(p * 0.014 + 5.0) * 1.15 * inland + fbm3(p * 0.06) * 0.08;
  }
  /* The island out at sea: signed distance to its shore in px (> 0 on land),
     a round main body with an uneven coast and a headland to the east. */
  float islD(vec2 p) {
    vec2 q = (p - vec2(230.0, -250.0)) / vec2(1.5, 1.0);
    float r = length(q);
    float rad = 66.0 + 46.0 * (fbm(q * 0.016 + 4.0) - 0.5) + 30.0 * (fbm(q * 0.045 + 8.0) - 0.5) + 10.0 * (fbm(p * 0.09) - 0.5);
    vec2 q2 = (p - vec2(372.0, -222.0)) / vec2(1.6, 1.0);
    float head = 15.0 + 10.0 * (fbm(p * 0.04 + 9.0) - 0.5) - length(q2);
    return max(rad - r, head);
  }
  float islH(vec2 p) {
    float s = islD(p);
    return smoothstep(0.0, 60.0, s) * (0.5 + 0.7 * fbm(p * 0.018 + 2.0)) + ridged(p * 0.03) * 0.22 * smoothstep(8.0, 50.0, s);
  }
  /* Trees: one per cell at most, a round crown of varying size. Returns the
     crown's cover (0..1) and how far from its centre, for the shading. */
  vec3 tree(vec2 p, float cell) {
    vec2 c = floor(p / cell);
    float best = 9.0; vec2 off = vec2(0.0); float sz = 0.0;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 g = c + vec2(float(i), float(j));
      vec2 h = hash2(g);
      vec2 o = (g + 0.15 + 0.7 * h) * cell;
      float r = cell * (0.38 + 0.22 * hash(g + 3.1));
      float d = length(p - o) / r;
      if (d < best) { best = d; off = (p - o) / r; sz = r; }
    }
    return vec3(1.0 - smoothstep(0.86, 1.0, best), off);
  }
  /* A Mediterranean town: one house per cell, a rectangle turned the way
     the lane runs there (the direction drifts across town, so lanes curve),
     sized at random and packed close. Whitewashed cubes with a parapet and
     now and then a water tank, pastel walls, terracotta roofs pitched along
     the long side, and the odd blue dome. */
  float town(vec2 p, out vec3 roof, out vec2 hid) {
    float cell = 9.0;
    vec2 c = floor(p / cell);
    roof = vec3(0.0);
    hid = c;
    float got = 0.0;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 g = c + vec2(float(i), float(j));
      if (hash(g + 2.7) < 0.07) continue;
      vec2 o = (g + 0.5 + 0.35 * (hash2(g) - 0.5)) * cell;
      float ang = (noise(o * 0.018) - 0.5) * 2.4 + (hash(g + 7.7) - 0.5) * 0.25;
      vec2 cs = vec2(cos(ang), sin(ang));
      vec2 rel = p - o;
      vec2 l = vec2(dot(rel, cs), dot(rel, vec2(-cs.y, cs.x)));
      vec2 hs = cell * vec2(0.36 + 0.16 * hash(g + 1.3), 0.27 + 0.14 * hash(g + 4.1));
      if (abs(l.x) < hs.x && abs(l.y) < hs.y) {
        float k = hash(g + 5.3);
        vec3 col = k < 0.44 ? vec3(0.96, 0.95, 0.91) : k < 0.68 ? vec3(0.80, 0.46, 0.32) : k < 0.80 ? vec3(0.93, 0.79, 0.56) : k < 0.90 ? vec3(0.94, 0.75, 0.67) : vec3(0.88, 0.86, 0.80);
        float rim = min(hs.x - abs(l.x), hs.y - abs(l.y));
        if (k >= 0.44 && k < 0.68) {
          // pitched roof: the ridge runs along the long side, one slope lit, one shaded
          float lit = dot(vec2(-cs.y, cs.x), vec2(-0.67, -0.73)) * sign(l.y);
          col *= lit > 0.0 ? 1.08 : 0.80;
          col *= 0.95 + 0.05 * sin(l.x * 3.6);
          col *= 1.0 - 0.25 * (1.0 - smoothstep(0.0, 0.5, abs(l.y)));
        } else {
          // flat roof: a parapet round the edge, a water tank on some
          col *= 1.0 - 0.13 * (1.0 - smoothstep(0.4, 1.1, rim));
          vec2 tk = vec2(hs.x * 0.45, -hs.y * 0.35);
          if (hash(g + 6.2) < 0.35 && length(l - tk) < 0.95) col = vec3(0.45, 0.47, 0.50) + 0.25 * step(0.0, -(l - tk).x - (l - tk).y);
          if (k < 0.44 && hash(g + 4.4) < 0.08 && length(l) < min(hs.x, hs.y) * 0.85) {
            col = mix(vec3(0.12, 0.30, 0.64), vec3(0.58, 0.76, 0.98), clamp(0.55 - dot(rel / (min(hs.x, hs.y) * 0.85), vec2(-0.67, -0.73)) * 0.6, 0.0, 1.0));
          }
        }
        col *= 0.93 + 0.1 * hash(g + 9.9);
        roof = col;
        hid = g;
        got = 1.0;
      }
    }
    return got;
  }
  void main() {
    vec2 sp = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;
    vec2 p = sp + uCam;
    float t = uT;
    vec3 L = normalize(vec3(-0.55, -0.6, 0.62));
    float d = coast(p.x) - p.y;                       // > 0 at sea, < 0 inland, in px
    float wash = 6.0 + 4.0 * sin(t * 1.2 + p.x * 0.045) + 3.0 * fbm3(vec2(p.x * 0.08, t * 0.6));
    vec3 col;
    if (d > -2.0) {
      /* ── sea ── */
      float e = 0.9, h = wave(p, t);
      vec3 n = normalize(vec3(-(wave(p + vec2(e, 0.0), t) - h) * 1.6, -(wave(p + vec2(0.0, e), t) - h) * 1.6, 1.0));
      float depth = smoothstep(0.0, 120.0, d);
      col = mix(vec3(0.47, 0.83, 0.82), vec3(0.17, 0.58, 0.72), smoothstep(0.0, 0.45, depth));
      col = mix(col, vec3(0.07, 0.33, 0.55), smoothstep(0.45, 1.0, depth));
      col *= 0.78 + 0.32 * clamp(dot(n, -vec3(L.x, L.y, -L.z)), 0.0, 1.0);
      vec3 Ls = normalize(vec3(0.45, -0.55, 0.70));
      vec3 R = reflect(-Ls, n);
      col += vec3(1.0, 0.97, 0.9) * (pow(clamp(R.z, 0.0, 1.0), 90.0) * 0.45 + pow(clamp(R.z, 0.0, 1.0), 900.0) * step(0.55, noise(p * 0.6 + t * 2.0)) * 1.4);
      float ca = pow(1.0 - abs(sin(fbm(p * 0.09 + vec2(t * 0.35, -t * 0.25)) * 9.0)), 6.0);
      col += vec3(0.85, 1.0, 0.95) * ca * 0.22 * (1.0 - smoothstep(0.0, 40.0, d));
      float runs = smoothstep(0.82, 1.0, sin(d * 0.32 + t * 2.2 + fbm3(p * 0.05) * 3.0)) * (1.0 - smoothstep(6.0, 46.0, d));
      float lace = smoothstep(0.45, 0.75, fbm3(p * 0.22 + vec2(t * 0.5, 0.0)));
      float foam = max(1.0 - smoothstep(wash - 4.0, wash + 3.0, d), runs * lace * 0.8);
      col = mix(col, vec3(0.97, 0.99, 1.0), clamp(foam, 0.0, 1.0) * 0.92);
      // boats crossing, each in a lane of its own (46 px apart, wider than any
      // wake), at a speed that swells and eases but never turns back
      for (int k = 0; k < 2; k++) {
        float fk = float(k);
        float dir = fk < 0.5 ? 1.0 : -1.0;
        float speed = 10.0 + fk * 4.0;
        float run = speed * t + 14.0 * sin(t * 0.23 + fk * 2.0) + 6.0 * sin(t * 0.61 + fk * 4.0);
        float lane = 36.0 + fk * 46.0;
        float drift = 2.6 * sin(t * 0.31 + fk * 1.7);
        vec2 bp = vec2(mod(fk * 190.0 + run * dir, 480.0) - 45.0, lane + drift);
        float yaw = 2.6 * 0.31 * cos(t * 0.31 + fk * 1.7) / speed;
        vec2 q = p - bp;
        q = vec2(q.x * dir, q.y);
        q = vec2(q.x + yaw * q.y, q.y - yaw * q.x);
        float back = -q.x;
        float open = 0.29 + 0.05 * sin(t * 1.3 + fk * 3.0 + back * 0.05);
        float spread = back * open;
        float churn = smoothstep(0.25, 0.65, noise(vec2(back * 0.35 - t * 1.6, q.y * 0.45 + fk * 7.0)));
        float edgeW = 0.7 + 0.8 * noise(vec2(back * 0.2 + fk * 3.0, t * 0.8));
        float fade = step(0.0, back) * (1.0 - smoothstep(8.0, 64.0, back));
        float wake = (1.0 - smoothstep(edgeW * 0.6, edgeW * 1.8, abs(abs(q.y) - spread))) * fade * (0.55 + 0.45 * churn);
        wake += (1.0 - smoothstep(0.0, 2.4, abs(q.y))) * step(0.0, back) * (1.0 - smoothstep(4.0, 30.0, back)) * 0.7 * churn;
        col = mix(col, vec3(0.96, 0.98, 1.0), clamp(wake, 0.0, 1.0) * 0.78);
        float hull = length(q / vec2(6.5, 2.4));
        col = mix(col, vec3(0.20, 0.30, 0.40), (1.0 - smoothstep(1.0, 1.5, length((q - vec2(-1.0, 1.4)) / vec2(6.5, 2.4)))) * 0.25);
        col = mix(col, mix(vec3(0.98), vec3(0.80, 0.82, 0.85), step(0.0, q.y)), 1.0 - smoothstep(0.92, 1.0, hull));
        col = mix(col, vec3(0.55, 0.36, 0.24), 1.0 - smoothstep(0.9, 1.0, length((q - vec2(-1.0, 0.0)) / vec2(2.4, 1.2))));
      }
      // the island: a shelf of shallow water, a reef, surf, a beach, a wooded hill
      if (abs(p.y + 250.0) < 175.0 && abs(p.x - 265.0) < 310.0) {
        float sI = islD(p);
        if (sI < 0.0) {
          float sd = -sI;
          float shelf = 1.0 - smoothstep(4.0, 78.0, sd);
          float ripple = 0.5 + 0.5 * sin(dot(p, vec2(0.42, 0.25)) + fbm(p * 0.05) * 6.0);
          vec3 sh = mix(vec3(0.13, 0.52, 0.66), vec3(0.40, 0.83, 0.81), smoothstep(62.0, 10.0, sd));
          sh = mix(sh, vec3(0.80, 0.86, 0.74), smoothstep(26.0, 0.0, sd) * 0.4);
          sh *= 0.95 + 0.08 * ripple * smoothstep(50.0, 4.0, sd);
          float swell = sin(sd * 0.3 + t * 1.8 + fbm3(p * 0.03) * 4.0);
          sh *= 1.0 + 0.09 * swell * smoothstep(70.0, 20.0, sd) * smoothstep(0.0, 8.0, sd);
          float reef = smoothstep(0.57, 0.68, fbm(p * 0.045 + 13.0)) * smoothstep(12.0, 22.0, sd) * (1.0 - smoothstep(46.0, 60.0, sd));
          sh = mix(sh, vec3(0.18, 0.40, 0.42) * (0.82 + 0.3 * noise(p * 0.5)), reef * 0.75);
          float lw = 0.85 + 0.3 * clamp(dot(n, -vec3(L.x, L.y, -L.z)), 0.0, 1.0);
          col = mix(col, sh * lw, shelf);
          float cs = pow(1.0 - abs(sin(fbm(p * 0.12 + vec2(t * 0.4, -t * 0.3)) * 10.0)), 7.0);
          col += vec3(0.9, 1.0, 0.95) * cs * 0.24 * smoothstep(45.0, 4.0, sd);
          // surf breaking along the reef edge, in pieces
          float reefLine = 44.0 + 12.0 * (fbm(p * 0.02 + 5.0) - 0.5);
          float brk = (1.0 - smoothstep(0.0, 2.0 + 2.5 * fbm3(p * 0.04 + vec2(t * 0.25, 0.0)), abs(sd - reefLine - 2.5 * sin(t * 0.8 + p.x * 0.03))));
          brk *= smoothstep(0.35, 0.62, noise(p * 0.08 + vec2(t * 0.6, 0.0))) * smoothstep(0.42, 0.56, fbm(p * 0.03 + 13.0));
          col = mix(col, vec3(0.96, 0.99, 1.0), brk * 0.6);
          // waves rolling in, foam lines thinning out as they come, the swash on the sand
          float lace2 = smoothstep(0.42, 0.72, fbm3(p * 0.25 + vec2(t * 0.4, 0.0)));
          float roll = smoothstep(0.9, 1.0, swell) * (1.0 - smoothstep(5.0, 26.0, sd));
          float iw = 4.5 + 3.5 * sin(t * 1.1 + fbm(p * 0.03) * 6.0);
          float swash = 1.0 - smoothstep(iw - 3.0, iw + 2.5, sd);
          col = mix(col, vec3(0.97, 0.99, 1.0), clamp(max(swash * (0.55 + 0.45 * lace2), roll * lace2 * 0.8), 0.0, 1.0) * 0.9);
        } else {
          float hI = islH(p);
          vec3 nI = normalize(vec3(-(islH(p + vec2(1.0, 0.0)) - hI) * 110.0, -(islH(p + vec2(0.0, 1.0)) - hI) * 110.0, 1.0));
          float shI = clamp(dot(nI, normalize(vec3(-L.x, -L.y, L.z))), 0.0, 1.0);
          float bwI = 5.0 + 15.0 * fbm(p * 0.03 + 2.0);
          vec3 sandI = vec3(0.95, 0.89, 0.74) + (hash(floor(p * 3.0)) - 0.5) * 0.05;
          sandI = mix(sandI, vec3(0.76, 0.69, 0.56), (1.0 - smoothstep(0.0, 4.5, sI)) * 0.75);
          float big = step(0.55, fbm(p * 0.025 + 6.0));
          vec3 tr = big > 0.5 ? tree(p, 8.0) : tree(p, 4.6);
          vec3 trS = big > 0.5 ? tree(p - vec2(2.6, 3.0), 8.0) : tree(p - vec2(1.7, 2.0), 4.6);
          float lit = clamp(0.62 - dot(tr.yz, vec2(L.x, L.y)) * 0.55, 0.0, 1.0);
          float jung = smoothstep(bwI, bwI + 8.0, sI);
          vec3 under = mix(vec3(0.46, 0.55, 0.28), vec3(0.28, 0.42, 0.19), noise(p * 0.1)) * (1.0 - 0.35 * trS.x);
          vec3 canopy = mix(vec3(0.09, 0.27, 0.12), vec3(0.42, 0.62, 0.28), lit) * (0.9 + 0.2 * noise(p * 2.0));
          vec3 landI = mix(sandI, under, jung);
          landI *= 1.0 - 0.3 * trS.x * smoothstep(bwI - 4.0, bwI, sI) * (1.0 - jung);
          landI = mix(landI, canopy, tr.x * smoothstep(bwI - 3.0, bwI + 5.0, sI) * (0.35 + 0.65 * smoothstep(0.22, 0.36, fbm(p * 0.035 + 1.0))));
          // bare rock on the steep top and boulders where the headland meets the sea
          float slI = 1.0 - nI.z;
          landI = mix(landI, vec3(0.62, 0.58, 0.50) * (0.9 + 0.15 * noise(p * 0.8)), smoothstep(0.7, 0.88, slI) * 0.6);
          vec3 bo = tree(p, 4.0);
          float blit = clamp(0.6 - dot(bo.yz, vec2(L.x, L.y)) * 0.6, 0.0, 1.0);
          vec3 rocks = mix(vec3(0.30, 0.29, 0.27), mix(vec3(0.52, 0.50, 0.46), vec3(0.80, 0.77, 0.71), blit), bo.x);
          float rk = smoothstep(0.6, 0.7, fbm(p * 0.05 + 4.0)) * (1.0 - smoothstep(bwI - 2.0, bwI + 4.0, sI));
          landI = mix(landI, rocks, rk);
          landI *= 0.5 + 0.7 * shI;
          col = mix(vec3(0.90, 0.95, 0.93), landI, smoothstep(0.0, 1.4, sI));
        }
        // a sailboat going round, well outside the reef
        float sa = t * 0.06;
        vec2 sb = vec2(230.0, -250.0) + vec2(cos(sa) * 1.5, sin(sa)) * 140.0;
        vec2 tang = normalize(vec2(-sin(sa) * 1.5, cos(sa)));
        vec2 q = p - sb;
        q = vec2(dot(q, tang), dot(q, vec2(-tang.y, tang.x)));
        float back = -q.x;
        float wk = (1.0 - smoothstep(0.5, 1.6, abs(abs(q.y) - back * 0.22))) * step(0.0, back) * (1.0 - smoothstep(6.0, 44.0, back));
        col = mix(col, vec3(0.96, 0.98, 1.0), wk * 0.7);
        col = mix(col, vec3(0.10, 0.22, 0.32), (1.0 - smoothstep(1.0, 1.4, length((q - vec2(-1.5, 2.6)) / vec2(5.0, 3.0)))) * 0.25);
        col = mix(col, vec3(0.98), 1.0 - smoothstep(0.9, 1.0, length(q / vec2(4.8, 1.7))));
        float sail = max(abs(q.x + 0.4) - 2.6, abs(q.y + 1.2 - (q.x + 0.4) * 0.15) - 0.7);
        col = mix(col, vec3(0.88, 0.86, 0.82), 1.0 - smoothstep(-0.2, 0.3, sail));
      }
    } else {
      /* ── land: hillside, macchia, and the town down at the water ── */
      float e = 1.2, h = ground(p);
      vec3 n = normalize(vec3(-(ground(p + vec2(e, 0.0)) - h) * 17.0, -(ground(p + vec2(0.0, e)) - h) * 17.0, 1.0));
      float shade = clamp(dot(n, normalize(vec3(-L.x, -L.y, L.z))), 0.0, 1.0);
      float slope = 1.0 - n.z;
      float veg = fbm(p * 0.03 + 2.0);
      vec3 base = mix(vec3(0.78, 0.72, 0.53), vec3(0.50, 0.56, 0.33), smoothstep(0.42, 0.58, veg));
      base = mix(base, vec3(0.36, 0.45, 0.25), smoothstep(0.6, 0.7, veg) * 0.8);
      base *= 0.9 + 0.16 * noise(p * 1.4) + 0.06 * (hash(floor(p * 2.0)) - 0.5);
      float shrub = smoothstep(0.42, 0.6, fbm(p * 0.022 + 11.0));
      vec3 shT = tree(p - vec2(2.0, 2.4), 6.0);
      base *= 1.0 - 0.34 * shT.x * shrub;
      vec3 tr = tree(p, 6.0);
      float lit = clamp(0.62 - dot(tr.yz, vec2(L.x, L.y)) * 0.55, 0.0, 1.0);
      vec3 leaf = mix(vec3(0.16, 0.27, 0.14), vec3(0.45, 0.55, 0.30), lit) * (0.9 + 0.2 * noise(p * 2.3));
      base = mix(base, leaf, tr.x * shrub * (1.0 - smoothstep(0.35, 0.6, slope)));
      vec3 limestone = mix(vec3(0.70, 0.66, 0.58), vec3(0.88, 0.85, 0.78), noise(p * 0.7)) * (0.92 + 0.12 * noise(p * 3.1));
      base = mix(base, limestone, smoothstep(0.3, 0.6, slope) * 0.75);
      // the town: dense by the water, thinning out up the hill, house by house
      vec3 roof, tmpRoof; vec2 hid, tmpId;
      float occ = town(p, roof, hid);
      float occS = town(p - vec2(2.4, 3.0), tmpRoof, tmpId);
      float near = exp(d / 150.0);
      float want = fbm(p * 0.011 + 3.0) * 0.75 * exp(d / 420.0) + near * 0.6;
      float here = step(0.55 + 0.12 * hash(hid + 6.6), want);
      float hereS = step(0.55 + 0.12 * hash(tmpId + 6.6), want);
      // lanes are paved only in the dense heart; where no house stands the hillside shows
      float dense = smoothstep(0.62, 0.7, want);
      vec3 stone = vec3(0.87, 0.84, 0.77) * (0.95 + 0.07 * noise(p * 1.6));
      vec3 open = roof.x < -0.5 ? mix(stone, vec3(0.48, 0.57, 0.34), step(0.5, hash(hid + 3.0))) : stone;
      col = mix(base, open, dense);
      if (occ * here > 0.5) col = roof;
      else if (occS * hereS > 0.5) col *= 0.64;
      // the hinterland: parcels with their own crop and row direction, hedges between
      float farm = smoothstep(150.0, 200.0, -d) * (1.0 - smoothstep(450.0, 510.0, -d));
      if (farm > 0.0) {
        vec2 fp = (p + vec2(fbm(p * 0.015), fbm(p * 0.015 + 7.0)) * 10.0) * vec2(0.62, 1.0);
        vec2 fc = floor(fp / 58.0);
        float b1 = 99.0, b2 = 99.0; vec2 fid = vec2(0.0);
        for (int fj = -1; fj <= 1; fj++) for (int fi = -1; fi <= 1; fi++) {
          vec2 g = fc + vec2(float(fi), float(fj));
          float dd = length(fp - (g + 0.25 + 0.5 * hash2(g)) * 58.0);
          if (dd < b1) { b2 = b1; b1 = dd; fid = g; } else if (dd < b2) { b2 = dd; }
        }
        float kind = hash(fid + 1.7);
        float ang = hash(fid + 4.2) * 3.1416;
        vec2 dir = vec2(cos(ang), sin(ang));
        float u = dot(p, dir), v = dot(p, vec2(-dir.y, dir.x));
        vec3 parcel;
        if (kind < 0.36) {
          float r = smoothstep(-0.2, 0.6, sin(u * 6.2831 / 4.0));
          vec3 vine = mix(vec3(0.24, 0.36, 0.16), vec3(0.44, 0.54, 0.25), noise(p * 1.4)) * (0.85 + 0.2 * noise(vec2(u * 0.3, v * 1.6)));
          parcel = mix(vec3(0.67, 0.57, 0.42), vine, r);
        } else if (kind < 0.56) {
          parcel = mix(vec3(0.88, 0.78, 0.52), vec3(0.80, 0.68, 0.43), 0.5 + 0.5 * sin(u * 6.2831 / 2.4)) * (0.94 + 0.1 * noise(p * 0.5));
        } else if (kind < 0.74) {
          vec2 q = vec2(u, v) / 9.0;
          vec2 qc = fract(q) - 0.5 + (hash2(floor(q)) - 0.5) * 0.18;
          float olive = 1.0 - smoothstep(0.2, 0.33, length(qc));
          float oshadow = 1.0 - smoothstep(0.2, 0.36, length(qc - vec2(0.12, 0.16)));
          vec3 soil = vec3(0.76, 0.68, 0.52) * (1.0 - 0.28 * oshadow);
          parcel = mix(soil, mix(vec3(0.36, 0.42, 0.28), vec3(0.56, 0.60, 0.42), clamp(0.6 - dot(qc, vec2(L.x, L.y)) * 1.4, 0.0, 1.0)), olive);
        } else if (kind < 0.88) {
          parcel = mix(vec3(0.50, 0.39, 0.28), vec3(0.63, 0.51, 0.37), 0.5 + 0.5 * sin(u * 6.2831 / 1.9)) * (0.95 + 0.08 * noise(p * 0.6));
        } else {
          parcel = mix(vec3(0.47, 0.57, 0.29), vec3(0.58, 0.63, 0.33), noise(p * 0.08));
        }
        // hedgerows and the odd cypress along the field edges
        float edgeD = (b2 - b1) * 0.5;
        parcel *= 0.92 + 0.16 * hash(fid + 5.5);
        float hedge = 1.0 - smoothstep(0.5, 1.5, edgeD);
        vec3 cy = tree(p, 5.0);
        parcel = mix(parcel, vec3(0.30, 0.35, 0.20), hedge * 0.75);
        parcel = mix(parcel, vec3(0.12, 0.20, 0.10), cy.x * (1.0 - smoothstep(1.5, 3.5, edgeD)) * step(0.7, hash(fid + 9.0)));
        float level = 1.0 - smoothstep(0.38, 0.6, slope);
        col = mix(col, parcel, farm * level * (1.0 - step(0.5, occ * here)));
        // a country road winding through, a car on it
        float ry = 425.0 + 26.0 * sin(p.x * 0.011 + 1.0) + 9.0 * sin(p.x * 0.029);
        float rd = abs(p.y - ry);
        col = mix(col, vec3(0.86, 0.82, 0.72), (1.0 - smoothstep(4.6, 5.6, rd)) * farm);
        col = mix(col, vec3(0.36, 0.36, 0.37) * (0.95 + 0.08 * noise(p * 2.0)), (1.0 - smoothstep(3.4, 4.2, rd)) * farm);
        col = mix(col, vec3(0.95), (1.0 - smoothstep(0.25, 0.6, rd)) * step(0.5, fract(p.x / 9.0)) * farm);
        float cx = mod(t * 22.0 + 6.0 * sin(t * 0.4), 760.0) - 120.0;
        float cyy = 425.0 + 26.0 * sin(cx * 0.011 + 1.0) + 9.0 * sin(cx * 0.029) - 1.6;
        float slopeR = 26.0 * 0.011 * cos(cx * 0.011 + 1.0) + 9.0 * 0.029 * cos(cx * 0.029);
        vec2 cq = p - vec2(cx, cyy);
        float ca = atan(slopeR);
        cq = vec2(cq.x * cos(ca) + cq.y * sin(ca), -cq.x * sin(ca) + cq.y * cos(ca));
        float body = max(abs(cq.x) - 3.4, abs(cq.y) - 1.4);
        col = mix(col, vec3(0.14, 0.14, 0.15), (1.0 - smoothstep(0.0, 1.4, max(abs(cq.x - 0.8) - 3.6, abs(cq.y - 0.9) - 1.6))) * 0.35);
        col = mix(col, vec3(0.78, 0.16, 0.13), 1.0 - smoothstep(-0.2, 0.4, body));
        col = mix(col, vec3(0.20, 0.24, 0.30), (1.0 - smoothstep(-0.2, 0.3, max(abs(cq.x - 0.9) - 1.0, abs(cq.y) - 1.0))));
      }
      col *= 0.64 + 0.5 * shade;
      col *= 1.0 - 0.1 * smoothstep(0.55, 0.0, h);
      // the high country: broad massifs, conifers in the valley, snow on the tops
      float alpine = smoothstep(470.0, 590.0, -d);
      if (alpine > 0.0) {
        float lakeD = length((p - vec2(250.0, 790.0)) / vec2(2.3, 1.0));
        float valley = mix(0.35, 1.0, smoothstep(26.0, 80.0, lakeD));
        float hA = (peaks(p * 0.006 + 5.0) * 1.3 - 0.2 + fbm(p * 0.035) * 0.05) * valley;
        float hX = (peaks((p + vec2(1.5, 0.0)) * 0.006 + 5.0) * 1.3 - 0.2 + fbm((p + vec2(1.5, 0.0)) * 0.035) * 0.05) * valley;
        float hY = (peaks((p + vec2(0.0, 1.5)) * 0.006 + 5.0) * 1.3 - 0.2 + fbm((p + vec2(0.0, 1.5)) * 0.035) * 0.05) * valley;
        vec3 nA = normalize(vec3(-(hX - hA) * 95.0, -(hY - hA) * 95.0, 1.0));
        float shA = clamp(dot(nA, normalize(vec3(-L.x, -L.y, L.z))), 0.0, 1.0);
        float slA = 1.0 - nA.z;
        vec3 rockA = mix(vec3(0.46, 0.43, 0.39), vec3(0.62, 0.58, 0.52), noise(p * 0.05)) * (0.94 + 0.08 * noise(p * 0.9));
        vec3 trA = tree(p, 4.4);
        vec3 trS = tree(p - vec2(1.6, 2.0), 4.4);
        float conifer = (1.0 - smoothstep(0.40, 0.50, hA + (noise(p * 0.06) - 0.5) * 0.08)) * (1.0 - smoothstep(0.5, 0.75, slA));
        vec3 meadow = mix(vec3(0.42, 0.50, 0.28), vec3(0.52, 0.56, 0.32), noise(p * 0.1));
        vec3 forestA = meadow * (1.0 - 0.4 * trS.x);
        forestA = mix(forestA, mix(vec3(0.07, 0.15, 0.09), vec3(0.20, 0.33, 0.18), clamp(0.6 - dot(trA.yz, vec2(L.x, L.y)) * 0.6, 0.0, 1.0)), trA.x * smoothstep(0.2, 0.5, fbm(p * 0.02 + 3.0) + 0.25));
        vec3 alp = mix(rockA, forestA, conifer);
        float snowA = smoothstep(0.75, 0.81, hA + (noise(p * 0.09) - 0.5) * 0.1) * (1.0 - smoothstep(0.55, 0.8, slA));
        snowA = max(snowA, smoothstep(0.86, 0.94, hA));
        alp *= 0.36 + 0.86 * shA;
        alp = mix(alp * vec3(0.8, 0.87, 1.05), alp * vec3(1.04, 1.0, 0.95), smoothstep(0.35, 0.8, shA));
        vec3 snowC = mix(vec3(0.70, 0.77, 0.88), vec3(0.98, 0.98, 0.97), smoothstep(0.2, 0.75, shA)) * (0.96 + 0.05 * noise(p * 0.6));
        alp = mix(alp, snowC, snowA);
        col = mix(col, alp, alpine);
      }
      // a mountain lake in a valley
      vec2 lc = vec2(250.0, 790.0);
      float ld = length((p - lc) / vec2(2.3, 1.0)) + (fbm(p * 0.05) - 0.5) * 14.0;
      if (ld < 34.0) {
        float lw = wave(p * 1.3, t * 0.6);
        vec3 lake = mix(vec3(0.12, 0.36, 0.48), vec3(0.24, 0.55, 0.62), smoothstep(34.0, 12.0, ld));
        lake *= 0.86 + 0.12 * lw;
        lake += vec3(1.0, 0.98, 0.92) * pow(noise(p * 0.6 + t * 1.2), 14.0) * 0.7;
        col = mix(col, lake, smoothstep(34.0, 31.0, ld));
        col = mix(col, vec3(0.82, 0.80, 0.74), (1.0 - smoothstep(0.0, 1.8, abs(ld - 32.0))) * 0.8);
      }
      // the shore: small coves of sand between rocks, wet where the wash runs
      float bw = 17.0 + 10.0 * fbm3(vec2(p.x * 0.03, 1.0));
      float shore = 1.0 - smoothstep(bw - 3.0, bw + 2.0, -d);
      float rock = smoothstep(0.56, 0.66, fbm(p * 0.05 + 4.0));
      vec3 sand = vec3(0.93, 0.86, 0.71) + (hash(floor(p * 3.0)) - 0.5) * 0.06;
      float wet = 1.0 - smoothstep(0.0, 6.0 + wash * 0.4, -d);
      sand = mix(sand, vec3(0.74, 0.67, 0.55), wet * 0.8);
      // boulders: round stones lit from the top left, darker in the cracks between
      vec3 bo = tree(p, 4.5);
      float blit = clamp(0.6 - dot(bo.yz, vec2(L.x, L.y)) * 0.6, 0.0, 1.0);
      vec3 rocks = mix(vec3(0.30, 0.29, 0.27), mix(vec3(0.52, 0.50, 0.46), vec3(0.80, 0.77, 0.71), blit), bo.x);
      vec3 edgeCol = mix(sand, rocks, rock);
      col = mix(col, edgeCol, shore);
    }
    // haze into the page below: a long, uneven edge that drifts slowly
    float H = uRes.y / uDpr;
    float edge = H - 118.0 + 42.0 * (fbm3(vec2(sp.x * 0.011, t * 0.04)) - 0.5) * 2.0 + 22.0 * (fbm(sp * 0.028 + vec2(t * 0.05, 0.0)) - 0.5) * 2.0;
    float mist = smoothstep(edge - 34.0, edge + 84.0, sp.y);
    mist = clamp(mist + smoothstep(H - 24.0, H, sp.y), 0.0, 1.0);
    col = mix(col, vec3(1.0, 0.98, 0.961), mist * uHaze);
    gl_FragColor = vec4(col, 1.0);
  }`;

const VERTEX = 'attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }';

export interface Scenery {
  /** Glides the camera to another place; a still picture jumps there. */
  flyTo(camera: Camera): void;
}

interface SceneryOptions {
  /** The height the scene is framed for; the box may be taller or shorter. */
  frame: number;
  camera?: Camera;
  /** The soft fade into the page at the foot of the picture; off beside a column. */
  haze?: boolean;
}

const reducedMotion = (): boolean =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function startScenery(box: HTMLElement, opts: SceneryOptions): Scenery | null {
  const canvas = document.createElement('canvas');
  canvas.className = 'scenery';
  canvas.setAttribute('aria-hidden', 'true');
  box.prepend(canvas);
  const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false, powerPreference: 'low-power' });
  if (!gl) {
    canvas.remove();
    return null;
  }
  const compile = (type: number, src: string): WebGLShader | null => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    return shader;
  };
  const program = gl.createProgram();
  const vs = compile(gl.VERTEX_SHADER, VERTEX);
  const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT);
  if (!program || !vs || !fs) {
    canvas.remove();
    return null;
  }
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    canvas.remove();
    return null;
  }
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'a');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(program, 'uRes');
  const uDpr = gl.getUniformLocation(program, 'uDpr');
  const uT = gl.getUniformLocation(program, 'uT');
  const uCam = gl.getUniformLocation(program, 'uCam');
  gl.uniform1f(gl.getUniformLocation(program, 'uHaze'), opts.haze === false ? 0 : 1);

  // The picture's resolution: the screen's, capped at 2, scaled down when frames come slow.
  let quality = 1;
  let offset: [number, number] = [0, 0];
  const resize = () => {
    const cssWidth = box.clientWidth || FRAME_WIDTH;
    const cssHeight = box.clientHeight || opts.frame;
    const ratio = Math.min(2, Math.max(1, window.devicePixelRatio || 1)) * quality;
    canvas.width = Math.max(1, Math.round(cssWidth * ratio));
    canvas.height = Math.max(1, Math.round(cssHeight * ratio));
    canvas.style.height = `${cssHeight}px`;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uDpr, canvas.width / cssWidth);
    // The scene is framed for a phone: a bigger box shows more around the same
    // centre, a smaller one (a small iPhone) the middle of it.
    offset = [(cssWidth - FRAME_WIDTH) / 2, (cssHeight - opts.frame) / 2];
  };
  resize();

  const still = reducedMotion();
  const born = performance.now();
  let camera: [number, number] = [opts.camera?.[0] ?? 0, opts.camera?.[1] ?? 0];
  let flight: { from: [number, number]; to: Camera; start: number; duration: number } | null = null;
  let running = false;
  let lastFrame = 0;
  let measured = 0;
  let slowFrames = 0;

  const draw = (now: number) => {
    if (flight) {
      const k = Math.min(1, (now - flight.start) / flight.duration);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      camera = [
        flight.from[0] + (flight.to[0] - flight.from[0]) * e,
        flight.from[1] + (flight.to[1] - flight.from[1]) * e,
      ];
      if (k >= 1) flight = null;
    }
    gl.uniform2f(uCam, camera[0] - offset[0], camera[1] - offset[1]);
    gl.uniform1f(uT, still ? 4 : (now - born) / 1000 + 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  const frame = (now: number) => {
    if (!canvas.isConnected || document.hidden) {
      running = false;
      return;
    }
    // A device that cannot keep up gets a smaller picture once, rather than a stutter.
    if (lastFrame && quality === 1 && measured < 90) {
      measured += 1;
      if (now - lastFrame > 24) slowFrames += 1;
      if (measured === 90 && slowFrames > 45) {
        quality = 0.7;
        resize();
      }
    }
    lastFrame = now;
    draw(now);
    if (!still || flight) requestAnimationFrame(frame);
    else running = false;
  };
  const run = () => {
    if (running) return;
    running = true;
    lastFrame = 0;
    requestAnimationFrame(frame);
  };
  run();

  // The loop stops in the background (document.hidden) and starts again on return.
  const wake = () => {
    if (!document.hidden && canvas.isConnected) run();
  };
  document.addEventListener('visibilitychange', wake);
  if (typeof ResizeObserver === 'function') {
    const observer = new ResizeObserver(() => {
      if (!canvas.isConnected) {
        observer.disconnect();
        document.removeEventListener('visibilitychange', wake);
        return;
      }
      resize();
      if (still) run();
    });
    observer.observe(box);
  }
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    canvas.remove();
  });

  return {
    flyTo(to: Camera) {
      if (still) {
        camera = [to[0], to[1]];
        run();
        return;
      }
      const distance = Math.hypot(to[0] - camera[0], to[1] - camera[1]);
      flight = {
        from: [camera[0], camera[1]],
        to,
        start: performance.now(),
        duration: Math.min(1700, 700 + distance * 1.1),
      };
      run();
    },
  };
}
