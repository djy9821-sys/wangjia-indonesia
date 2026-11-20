// WANGJIA "one night at the pond" scene: a 2 HP paddle-wheel aerator modelled from the
// catalogue photos (3 HDPE floats, motor cover, gearbox, SS304 shafts, 4 PP impellers)
// working on night water. One fixed canvas; the page drives it with four scroll phases.
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
const ease = (x) => { x = clamp01(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const lerp = (a, b, t) => a + (b - a) * t;

// ---------------------------------------------------------------- textures
function waterNormals(size = 256, seed = 11) {
  let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const waves = [];
  for (let i = 0; i < 26; i++) {
    let kx, ky;
    do { kx = Math.round((rnd() * 2 - 1) * 13); ky = Math.round((rnd() * 2 - 1) * 13); } while (kx === 0 && ky === 0);
    waves.push([kx, ky, 1 / Math.pow(Math.hypot(kx, ky), 1.3), rnd() * Math.PI * 2]);
  }
  const h = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let v = 0; for (const [kx, ky, a, ph] of waves) v += a * Math.sin((2 * Math.PI * (kx * x + ky * y)) / size + ph);
    h[y * size + x] = v;
  }
  const data = new Uint8Array(size * size * 4), k = 3.2;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const xl = h[y * size + ((x - 1 + size) % size)], xr = h[y * size + ((x + 1) % size)];
    const yu = h[((y - 1 + size) % size) * size + x], yd = h[((y + 1) % size) * size + x];
    let nx = (xl - xr) * k, ny = (yu - yd) * k, nz = 1; const l = Math.hypot(nx, ny, nz);
    const i = (y * size + x) * 4;
    data[i] = (nx / l * 0.5 + 0.5) * 255; data[i + 1] = (ny / l * 0.5 + 0.5) * 255; data[i + 2] = (nz / l * 0.5 + 0.5) * 255; data[i + 3] = 255;
  }
  const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter;
  t.generateMipmaps = true; t.needsUpdate = true; return t;
}

function paddleHoles() {
  const c = document.createElement('canvas'); c.width = 160; c.height = 96; const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, 160, 96); g.fillStyle = '#000';
  for (let r = 0; r < 3; r++) for (let q = 0; q < 5; q++) { g.beginPath(); g.arc(18 + q * 31, 18 + r * 30, 8.5, 0, Math.PI * 2); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; return t;
}

// ---------------------------------------------------------------- geometry (metres)
function floatGeo() {
  const L = 1.69, r = 0.15, s = new THREE.Shape();
  s.moveTo(-r, -L / 2 + r); s.lineTo(-r, L / 2 - r);
  s.absarc(0, L / 2 - r, r, Math.PI, 0, true);
  s.lineTo(r, -L / 2 + r);
  s.absarc(0, -L / 2 + r, r, 0, -Math.PI, true);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3, curveSegments: 16 });
  g.rotateX(-Math.PI / 2); g.translate(0, -0.05, 0); // y from -0.08 to 0.14, length along z
  return g;
}
function coverGeo() {
  const hw = 0.15, h = 0.58, s = new THREE.Shape();
  s.moveTo(-hw, 0); s.lineTo(hw, 0); s.lineTo(hw, h - hw); s.absarc(0, h - hw, hw, 0, Math.PI, false); s.lineTo(-hw, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.26, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3, curveSegments: 22 });
  g.translate(0, 0.02, -0.13); return g; // y 0 .. 0.62
}
function gearboxGeo() {
  const parts = [];
  const b = new THREE.BoxGeometry(0.26, 0.17, 0.24); b.translate(0, 0.225, 0); parts.push(b);
  for (const sx of [-1, 1]) { const c = new THREE.CylinderGeometry(0.055, 0.055, 0.07, 20); c.rotateZ(Math.PI / 2); c.translate(sx * 0.165, 0.22, 0); parts.push(c); }
  const flange = new THREE.CylinderGeometry(0.12, 0.12, 0.03, 24); flange.translate(0, 0.325, 0); parts.push(flange);
  return mergeGeometries(parts);
}
function motorGeo() {
  const parts = [];
  const body = new THREE.CylinderGeometry(0.105, 0.105, 0.3, 28); body.translate(0, 0.49, 0); parts.push(body);
  for (let i = 0; i < 14; i++) { const f = new THREE.BoxGeometry(0.014, 0.24, 0.03); f.translate(0, 0.49, 0.118); f.rotateY((i / 14) * Math.PI * 2); parts.push(f); }
  const cap = new THREE.CylinderGeometry(0.09, 0.1, 0.05, 28); cap.translate(0, 0.665, 0); parts.push(cap);
  return mergeGeometries(parts);
}
function couplingGeo() { const g = new THREE.CylinderGeometry(0.065, 0.065, 0.055, 24); g.rotateZ(Math.PI / 2); return g; }
function shaftGeo() { const g = new THREE.CylinderGeometry(0.021, 0.021, 1.5, 14); g.rotateZ(Math.PI / 2); return g; }
function pillowGeo() {
  const parts = [];
  const post = new THREE.BoxGeometry(0.06, 0.07, 0.12); post.translate(0, 0.175, 0); parts.push(post);
  const house = new THREE.CylinderGeometry(0.045, 0.045, 0.075, 20); house.rotateZ(Math.PI / 2); house.translate(0, 0.22, 0); parts.push(house);
  return mergeGeometries(parts);
}
function frameGeo() {
  const parts = [];
  for (const z of [-0.3, 0.3]) { const b = new THREE.BoxGeometry(2.36, 0.034, 0.034); b.translate(0, 0.157, z); parts.push(b); }
  for (const x of [-1, 0, 1]) for (const z of [-0.3, 0.3]) { const p = new THREE.BoxGeometry(0.05, 0.02, 0.07); p.translate(x, 0.146, z); parts.push(p); }
  return mergeGeometries(parts);
}
function impellerGeos() {
  const solid = [], pads = [];
  const hub = new THREE.CylinderGeometry(0.055, 0.055, 0.27, 18); hub.rotateZ(Math.PI / 2); solid.push(hub);
  for (const x of [-0.105, 0.105]) { const f = new THREE.CylinderGeometry(0.1, 0.1, 0.016, 26); f.rotateZ(Math.PI / 2); f.translate(x, 0, 0); solid.push(f); }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    for (const x of [-0.08, 0.08]) { const arm = new THREE.BoxGeometry(0.022, 0.15, 0.018); arm.translate(x, 0.135, 0); arm.rotateX(a); solid.push(arm); }
    const p = new THREE.PlaneGeometry(0.25, 0.145); p.translate(0, 0.262, 0); p.rotateX(a + 0.12); pads.push(p);
  }
  return { solid: mergeGeometries(solid), pads: mergeGeometries(pads) };
}

const IMP_X = [-1.5, -0.5, 0.5, 1.5];

function buildAerator(G, M) {
  const g = new THREE.Group(), p = {};
  p.floats = [-1, 0, 1].map((k) => { const m = new THREE.Mesh(G.float, M.hdpe); m.position.x = k; g.add(m); return m; });
  p.frame = new THREE.Mesh(G.frame, M.steel); g.add(p.frame);
  p.gearbox = new THREE.Mesh(G.gearbox, M.cast); g.add(p.gearbox);
  p.motor = new THREE.Mesh(G.motor, M.motor); g.add(p.motor);
  p.cover = new THREE.Mesh(G.cover, M.hdpe); p.cover.position.y = 0.155; g.add(p.cover);
  p.coup = [-1, 1].map((s) => { const m = new THREE.Mesh(G.coupling, M.hdpeDark); m.position.set(s * 0.225, 0.22, 0); g.add(m); return m; });
  p.shafts = [-1, 1].map((s) => { const m = new THREE.Mesh(G.shaft, M.steel); m.position.set(s * 0.98, 0.22, 0); g.add(m); return m; });
  p.pillows = [-1, 1].map((s) => { const m = new THREE.Mesh(G.pillow, M.cast); m.position.x = s; g.add(m); return m; });
  p.imps = IMP_X.map((x) => {
    const r = new THREE.Group(); r.position.set(x, 0.22, 0);
    r.add(new THREE.Mesh(G.impSolid, M.pp)); r.add(new THREE.Mesh(G.impPads, M.ppPad)); g.add(r); return r;
  });
  return { group: g, parts: p, explode: -1 };
}

function applyExplode(a, e) {
  if (Math.abs(a.explode - e) < 1e-4) return; a.explode = e;
  const k = smooth(e), p = a.parts;
  p.cover.position.y = 0.155 + 0.66 * k;
  p.motor.position.y = 0.5 * k;
  p.gearbox.position.y = 0.3 * k;
  p.coup.forEach((m, i) => { const s = i ? 1 : -1; m.position.set(s * (0.225 + 0.16 * k), 0.22 + 0.3 * k, 0); });
  p.shafts.forEach((m, i) => { const s = i ? 1 : -1; m.position.set(s * (0.98 + 0.38 * k), 0.22 + 0.3 * k, 0); });
  p.pillows.forEach((m, i) => { const s = i ? 1 : -1; m.position.set(s * (1 + 0.5 * k), 0.2 * k, 0); });
  p.floats.forEach((m, i) => { m.position.x = (i - 1) * (1 + 0.5 * k); });
  p.frame.position.y = 0.1 * k;
  p.imps.forEach((m, i) => { const x = IMP_X[i], s = Math.sign(x), outer = Math.abs(x) > 1; m.position.set(x + s * (outer ? 1.0 : 0.5) * k, 0.22 + 0.3 * k, 0); });
}

// ---------------------------------------------------------------- shaders
const NOISE = /* glsl */`
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3. - 2. * f);
  return mix(mix(hash12(i), hash12(i + vec2(1., 0.)), u.x), mix(hash12(i + vec2(0., 1.)), hash12(i + vec2(1., 1.)), u.x), u.y); }
float fbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 4; i++) { s += a * vnoise(p); p *= 2.03; a *= .5; } return s; }
`;

const skyShader = {
  uniforms: { uNight: { value: 1 }, uTime: { value: 0 }, uMoonDir: { value: new THREE.Vector3(-0.42, 0.2, -1).normalize() }, uSunDir: { value: new THREE.Vector3(0.18, 0.04, -1).normalize() } },
  vertexShader: /* glsl */`varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    uniform float uNight, uTime; uniform vec3 uMoonDir, uSunDir; varying vec3 vDir;
    float h3(vec3 p){ p = fract(p * .3183099 + .1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
    void main(){
      vec3 d = normalize(vDir); float y = max(d.y, 0.0);
      vec3 night = mix(vec3(.012, .022, .050), vec3(.0015, .0035, .010), pow(y, .38));
      vec3 dawn = mix(vec3(1.0, .42, .17), vec3(.05, .085, .22), pow(y, .34));
      float sd = max(dot(d, uSunDir), 0.0);
      float sunK = smoothstep(.55, .0, uNight);
      dawn += vec3(1.0, .45, .16) * pow(sd, 5.0) * .8 + sunK * (vec3(1.0, .78, .45) * smoothstep(.9994, .9997, sd) * 7.0 + vec3(1., .6, .28) * pow(sd, 90.) * 2.2);
      vec3 col = mix(dawn, night, uNight);
      float md = max(dot(d, uMoonDir), 0.0);
      col += uNight * (vec3(.86, .9, 1.0) * smoothstep(.99988, .99993, md) * 5.0 + vec3(.40, .50, .85) * pow(md, 900.) * .9 + vec3(.16, .22, .48) * pow(md, 14.) * .22);
      if (d.y > 0.015) {
        vec3 sp = d * 460.0; vec3 cell = floor(sp); float r = h3(cell);
        float star = step(.9982, r) * smoothstep(.36, .0, length(fract(sp) - .5));
        col += uNight * star * (.55 + .45 * sin(uTime * 1.7 + r * 90.)) * smoothstep(.015, .22, d.y) * .9;
      }
      col = mix(col, mix(vec3(.9,.42,.2), vec3(.012,.02,.04), uNight), smoothstep(0.0, -0.06, d.y));
      gl_FragColor = vec4(col, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
};

function waterShader(nIMP) {
  return {
    name: 'PondWater',
    uniforms: {
      color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null },
      tNormal: { value: null }, uTime: { value: 0 }, uNight: { value: 1 }, uLamp: { value: 1 },
      uLampPos: { value: new THREE.Vector3(2.8, 2.1, 3.4) }, uMoonDir: { value: new THREE.Vector3() }, uSunDir: { value: new THREE.Vector3() },
      uImp: { value: Array.from({ length: nIMP }, () => new THREE.Vector4(0, 0, 0, 0)) },
    },
    vertexShader: /* glsl */`
      uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vW;
      void main(){ vUv = textureMatrix * vec4(position, 1.0); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      #define NIMP ${nIMP}
      uniform sampler2D tDiffuse, tNormal; uniform float uTime, uNight, uLamp;
      uniform vec3 uLampPos, uMoonDir, uSunDir; uniform vec4 uImp[NIMP];
      varying vec4 vUv; varying vec3 vW;
      ${NOISE}
      vec3 nmap(vec2 uv){ return texture2D(tNormal, uv).xzy * 2.0 - 1.0; }
      void main(){
        vec2 p = vW.xz; float t = uTime;
        vec3 n = nmap(p * .055 + vec2(t * .010, t * .006)) + nmap(p * .13 - vec2(t * .015, -t * .011)) * .7 + nmap(p * .41 + vec2(-t * .03, t * .02)) * .35;
        n.xz *= .38;
        float foam = 0.0, churn = 0.0;
        for (int i = 0; i < NIMP; i++) {
          vec4 im = uImp[i]; if (im.w <= 0.0) continue;
          vec2 d = p - im.xy; float back = clamp(-d.y, 0.0, 4.0);
          vec2 q = vec2(d.x / (.26 + back * .16), d.y / (.32 + back * 1.1));
          float fall = exp(-dot(q, q) * 1.3);
          float r = length(d * vec2(1.0, .8));
          churn += im.w * exp(-r * 1.6);
          n.xz += im.w * normalize(d + 1e-4) * sin(r * 16.0 - t * 7.5) * exp(-r * 1.5) * .22;
          float nz = vnoise(p * 7.5 + vec2(0.0, t * 2.6)) * vnoise(p * 3.2 - vec2(t * .7, t * 1.9));
          foam += im.w * fall * smoothstep(.16, .5, nz + fall * .32);
        }
        n.xz += (vec2(vnoise(p * 9. + t * 4.), vnoise(p * 9. - t * 4. + 7.)) - .5) * churn * .5;
        n = normalize(n);
        vec3 V = normalize(vW - cameraPosition); float dist = length(vW - cameraPosition);
        vec4 uv = vUv; uv.xy += n.xz * (.08 + .55 * clamp(1. - dist / 26., 0., 1.)) * uv.w;
        vec3 refl = texture2DProj(tDiffuse, uv).rgb;
        float fres = .03 + .97 * pow(1. - max(dot(-V, n), 0.), 5.);
        vec3 deep = mix(vec3(.05, .045, .05), vec3(.002, .006, .014), uNight);
        vec3 col = mix(deep, refl * .9, clamp(fres * 1.1 + .04, 0., 1.));
        vec3 R = reflect(V, n);
        col += uNight * vec3(.75, .82, 1.0) * pow(max(dot(R, uMoonDir), 0.), 900.) * 5.0;
        col += (1. - uNight) * vec3(1.0, .72, .45) * pow(max(dot(R, uSunDir), 0.), 500.) * 8.0;
        vec3 L = uLampPos - vW; float ld = length(L); L /= ld; vec3 H = normalize(L - V);
        col += uLamp * vec3(1.0, .62, .26) * pow(max(dot(n, H), 0.), 160.) * 2.6 / (1. + .06 * ld * ld);
        foam = clamp(foam, 0., 1.);
        vec3 foamCol = mix(vec3(1.0, .80, .66), vec3(.42, .50, .66), uNight) + uLamp * vec3(.30, .16, .05);
        col = mix(col, foamCol, foam * .62);
        col = mix(col, mix(vec3(.95, .46, .22), vec3(.010, .018, .036), uNight), 1. - exp(-dist * .022));
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  };
}

function sprayMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uAmt: { value: 1 }, uScale: { value: 300 }, uEmit: { value: IMP_X.map((x) => new THREE.Vector3(x, 0.22, 0)) }, uNight: { value: 1 }, uLamp: { value: 1 } },
    vertexShader: /* glsl */`
      attribute float aEmit; attribute vec4 aSeed;
      uniform float uTime, uAmt, uScale; uniform vec3 uEmit[4];
      varying float vA; varying float vK;
      void main(){
        float life = .75 + aSeed.x * .85;
        float t = mod(uTime * (.85 + aSeed.y * .3) + aSeed.z * 13.7, life); float k = t / life;
        vec3 e = uEmit[int(aEmit)];
        bool front = aSeed.w > .78;
        vec3 p0 = e + vec3((aSeed.w - .5) * .27, -.2, front ? .1 : -.16 - aSeed.x * .1);
        vec3 v0 = front ? vec3((aSeed.z - .5) * .4, .9 + aSeed.y * 1.1, .25 + aSeed.x * .4)
                        : vec3((aSeed.z - .5) * .8, 1.6 + aSeed.y * 2.0, -.6 - aSeed.x * 1.8);
        vec3 p = p0 + v0 * t + vec3(0., -4.6, 0.) * t * t;
        vK = k; vA = uAmt * smoothstep(0., .1, k) * (1. - k) * step(-.03, p.y);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = max(1.5, (.012 + aSeed.y * .032) * uScale / -mv.z);
      }`,
    fragmentShader: /* glsl */`
      uniform float uNight, uLamp; varying float vA; varying float vK;
      void main(){
        float d = length(gl_PointCoord - .5); float a = smoothstep(.5, .05, d) * vA;
        vec3 night = vec3(.55, .66, .9) + uLamp * vec3(.45, .25, .06);
        vec3 dawn = vec3(1.0, .72, .45);
        gl_FragColor = vec4(mix(dawn, night, uNight) * a * .5, 1.0);
      }`,
  });
}

function makeSpray(count) {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3), emit = new Float32Array(count), seed = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) { emit[i] = i % 4; for (let j = 0; j < 4; j++) seed[i * 4 + j] = Math.random(); }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aEmit', new THREE.BufferAttribute(emit, 1));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.5, 0), 6);
  const pts = new THREE.Points(g, sprayMaterial()); pts.frustumCulled = false; return pts;
}

function makeShore(lowPower) {
  const geo = new THREE.CylinderGeometry(92, 92, 10, lowPower ? 128 : 220, 1, true);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, uniforms: { uNight: { value: 1 } },
    vertexShader: /* glsl */`varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform float uNight; varying vec3 vP;
      float h1(float n){ return fract(sin(n) * 43758.5453); }
      float n1(float x){ float i = floor(x), f = fract(x); float u = f * f * (3. - 2. * f); return mix(h1(i), h1(i + 1.), u); }
      void main(){
        float a = atan(vP.z, vP.x); float y = vP.y + 5.0;
        float top = .9 + n1(a * 7.) * 1.5 + n1(a * 29.) * .55 + n1(a * 91.) * .22 + smoothstep(.86, 1., n1(a * 64.)) * 2.4;
        if (y > top) discard;
        vec3 col = mix(vec3(.05, .03, .05), vec3(.008, .013, .026), uNight);
        col += mix(vec3(.32, .17, .12), vec3(.012, .02, .04), uNight) * (1. - smoothstep(0., 1.1, y)) * .7;
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const m = new THREE.Mesh(geo, mat); m.position.y = 4.0; return m;
}

function makeShoreLights() {
  const n = 11, pos = new Float32Array(n * 3), sz = new Float32Array(n);
  let s = 5; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) { const a = -Math.PI * (0.12 + rnd() * 0.76); pos[i * 3] = Math.cos(a) * 88; pos[i * 3 + 1] = 0.35 + rnd() * 0.7; pos[i * 3 + 2] = Math.sin(a) * 88; sz[i] = 0.6 + rnd() * 0.8; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uNight: { value: 1 }, uTime: { value: 0 }, uScale: { value: 300 } },
    vertexShader: /* glsl */`attribute float aSize; uniform float uScale, uTime; varying float vF;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; vF = .85 + .15 * sin(uTime * 3. + position.x);
        gl_PointSize = aSize * .22 * uScale / -mv.z + 1.5; }`,
    fragmentShader: /* glsl */`uniform float uNight; varying float vF;
      void main(){ float d = length(gl_PointCoord - .5); float a = smoothstep(.5, 0., d); a = a * a;
        gl_FragColor = vec4(vec3(1., .66, .32) * a * 1.6 * vF * uNight, 1.0); }`,
  });
  const p = new THREE.Points(g, mat); p.frustumCulled = false; return p;
}

function makeMist() {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: { uTime: { value: 0 }, uMist: { value: .2 }, uNight: { value: 1 } },
    vertexShader: /* glsl */`varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`uniform float uTime, uMist, uNight; varying vec3 vW; ${NOISE}
      void main(){ float n = fbm(vW.xz * .16 + vec2(uTime * .025, uTime * .012));
        float d = length(vW - cameraPosition);
        float a = uMist * smoothstep(.38, .78, n) * smoothstep(1.5, 9., d) * (1. - smoothstep(45., 85., d));
        vec3 col = mix(vec3(1.0, .66, .42), vec3(.42, .52, .74), uNight);
        gl_FragColor = vec4(col, a);
        #include <colorspace_fragment>
      }`,
  });
  const grp = new THREE.Group();
  for (const [y, k] of [[0.12, 1], [0.45, 0.6]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(180, 180), mat); m.rotation.x = -Math.PI / 2; m.position.y = y; m.scale.setScalar(k === 1 ? 1 : 0.9); grp.add(m); }
  grp.userData.mat = mat; return grp;
}

async function wordTexture(lines, family) {
  const fs = 360, spec = (st) => `850 ${st ? 'extra-condensed ' : ''}${fs}px ${family}`;
  try { await document.fonts.load(spec(true), lines.join(' ')); } catch (e) { /* fallback font */ }
  const c = document.createElement('canvas'); const g = c.getContext('2d');
  const setup = () => { g.font = spec(false); if ('fontStretch' in g) g.fontStretch = 'extra-condensed'; };
  setup(); const widths = lines.map((l) => g.measureText(l).width);
  let squeeze = 1; if (!('fontStretch' in g)) squeeze = 0.62;
  const lh = fs * 0.86, w = Math.ceil(Math.max(...widths) * squeeze + 24), h = Math.ceil(lh * lines.length + fs * 0.08);
  c.width = w; c.height = h; setup();
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  const grad = g.createLinearGradient(0, 0, 0, h); grad.addColorStop(0, '#ffffff'); grad.addColorStop(1, '#bccbf2'); g.fillStyle = grad;
  lines.forEach((l, i) => { g.save(); g.translate(w / 2, fs * 0.8 + i * lh); g.scale(squeeze, 1); g.fillText(l, 0, 0); g.restore(); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true;
  return { tex: t, aspect: w / h };
}

// ---------------------------------------------------------------- poses
const POSES = {
  hero: { L: { c: [0, 0.5, 4.1], t: [0, 0.5, 0], fov: 36 }, P: { c: [0, 0.85, 7.0], t: [0, -0.3, 0], fov: 50 } },
  night: { L: { c: [-1.4, 3.7, 11.8], t: [0.6, 0.0, -11], fov: 40 }, P: { c: [-0.9, 3.4, 12.8], t: [0.2, 0.2, -11], fov: 60 } },
  anat: { L: { c: [3.0, 1.6, 4.3], t: [1.05, 0.72, 0], fov: 36 }, P: { c: [2.3, 2.3, 7.6], t: [0.15, 0.95, 0], fov: 54 } },
  dawn: { L: { c: [1.7, 0.62, 6.6], t: [-0.7, 0.85, -6], fov: 34 }, P: { c: [1.0, 0.95, 8.4], t: [-0.3, 1.0, -6], fov: 56 } },
};
const DISTANT = [[-6.6, -7.8, 0.25], [5.4, -10.6, -0.18], [-1.4, -16.5, 0.06], [9.6, -19.5, 0.3], [-11.2, -21.5, -0.22], [3.2, -27, 0.1]];

// ---------------------------------------------------------------- scene
export async function createPondScene(canvas, opts = {}) {
  const lowPower = !!opts.lowPower;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !lowPower, powerPreference: 'high-performance', alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1.25 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 600);

  // environment for metal and plastic highlights: a dark dome with a warm and a cool soft box
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 24, 12), new THREE.MeshBasicMaterial({ color: 0x0a1226, side: THREE.BackSide })));
  const warmBox = new THREE.Mesh(new THREE.PlaneGeometry(4, 3), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.62, 0.3).multiplyScalar(5) }));
  warmBox.position.set(5, 3, 6); warmBox.lookAt(0, 0, 0); envScene.add(warmBox);
  const coolBox = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 0.65, 1.0).multiplyScalar(3) }));
  coolBox.position.set(-3, 4, -8); coolBox.lookAt(0, 0, 0); envScene.add(coolBox);
  scene.environment = pmrem.fromScene(envScene, 0.04).texture;

  // sky, shore, lights, mist
  const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 48, 24), new THREE.ShaderMaterial({ ...skyShader, uniforms: THREE.UniformsUtils.clone(skyShader.uniforms), side: THREE.BackSide, depthWrite: false }));
  scene.add(sky);
  const shore = makeShore(lowPower); scene.add(shore);
  const shoreLights = makeShoreLights(); scene.add(shoreLights);

  const hemi = new THREE.HemisphereLight(0x31478a, 0x020306, 0.75); scene.add(hemi);
  const moon = new THREE.DirectionalLight(0xa8bcff, 2.6); scene.add(moon);
  const lamp = new THREE.PointLight(0xffa64d, 30, 16, 2); lamp.position.set(2.8, 2.1, 3.4); scene.add(lamp);
  const sun = new THREE.DirectionalLight(0xffb27a, 0); scene.add(sun);

  // materials and the machines
  const holes = paddleHoles();
  const M = {
    hdpe: new THREE.MeshPhysicalMaterial({ color: 0x1f55c2, roughness: 0.4, clearcoat: 0.4, clearcoatRoughness: 0.35, envMapIntensity: 0.9 }),
    hdpeDark: new THREE.MeshStandardMaterial({ color: 0x173f90, roughness: 0.5 }),
    pp: new THREE.MeshStandardMaterial({ color: 0xff951f, roughness: 0.48, envMapIntensity: 0.6 }),
    ppPad: new THREE.MeshStandardMaterial({ color: 0xff951f, roughness: 0.48, alphaMap: holes, alphaTest: 0.5, side: THREE.DoubleSide, envMapIntensity: 0.6 }),
    steel: new THREE.MeshStandardMaterial({ color: 0xdde2ea, metalness: 1, roughness: 0.26, envMapIntensity: 1.3 }),
    cast: new THREE.MeshStandardMaterial({ color: 0x30353e, metalness: 0.45, roughness: 0.55 }),
    motor: new THREE.MeshStandardMaterial({ color: 0x8793a6, metalness: 0.75, roughness: 0.32, envMapIntensity: 1.2 }),
  };
  const imp = impellerGeos();
  const G = { float: floatGeo(), cover: coverGeo(), gearbox: gearboxGeo(), motor: motorGeo(), coupling: couplingGeo(), shaft: shaftGeo(), pillow: pillowGeo(), frame: frameGeo(), impSolid: imp.solid, impPads: imp.pads };

  const main = buildAerator(G, M); scene.add(main.group); applyExplode(main, 0);
  const mainSpray = makeSpray(lowPower ? 900 : 2600); main.group.add(mainSpray);

  const far = DISTANT.slice(0, lowPower ? 3 : DISTANT.length).map(([x, z, yaw]) => {
    const a = buildAerator(G, M); a.group.position.set(x, 0, z); a.group.rotation.y = yaw; applyExplode(a, 0); scene.add(a.group);
    const sp = makeSpray(lowPower ? 180 : 420); a.group.add(sp); a.spray = sp; return a;
  });

  // water with a real reflection of everything above it
  const nIMP = 4 + far.length * 2;
  const water = new Reflector(new THREE.PlaneGeometry(400, 400), {
    shader: waterShader(nIMP), textureWidth: 512, textureHeight: 512, clipBias: 0.002, multisample: lowPower ? 0 : 4,
  });
  water.rotation.x = -Math.PI / 2; scene.add(water);
  const WU = water.material.uniforms; WU.tNormal.value = waterNormals(lowPower ? 128 : 256);
  // the giant word is typography, not an object: keep it out of the reflection (layer 1)
  water.getReflectionCamera(camera).layers.set(0); camera.layers.enable(1);

  const mist = makeMist(); scene.add(mist);

  // the giant word behind the machine (Design World composition, but lit by the same night)
  const wordMat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, fog: false, toneMapped: false, color: new THREE.Color(0.66, 0.71, 0.86) });
  const word = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), wordMat); word.position.set(0, 1, -5.2); word.renderOrder = -1; word.layers.set(1); scene.add(word);
  const words = { L: await wordTexture(['KINCIR AIR'], opts.family || 'Archivo'), P: await wordTexture(['KINCIR', 'AIR'], opts.family || 'Archivo') };

  // ------------------------------------------------------------ state driven by the page
  const S = { p0: 1, p1: 0, p2: 0, p3: 0, p4: 0 };
  let playing = !opts.still, visible = true, dirty = true, time = 0, last = performance.now();
  const ptr = { x: 0, y: 0, sx: 0, sy: 0 };
  if (opts.parallax) addEventListener('pointermove', (e) => { ptr.x = e.clientX / innerWidth * 2 - 1; ptr.y = e.clientY / innerHeight * 2 - 1; }, { passive: true });

  let W = 1, H = 1, aspect = 1;
  const v3 = new THREE.Vector3(), tgt = new THREE.Vector3(), tmp = new THREE.Vector3();
  function resize(w, h) {
    W = w; H = h; aspect = w / h; renderer.setSize(w, h, false); camera.aspect = aspect; camera.updateProjectionMatrix();
    const pr = renderer.getPixelRatio(), rs = lowPower ? 0.4 : 0.5;
    water.getRenderTarget().setSize(Math.round(w * pr * rs), Math.round(h * pr * rs));
    dirty = true;
  }
  const pk = () => clamp01((1.25 - aspect) / 0.6);
  function pose(name) {
    const q = POSES[name], k = pk();
    return { c: q.L.c.map((v, i) => lerp(v, q.P.c[i], k)), t: q.L.t.map((v, i) => lerp(v, q.P.t[i], k)), fov: lerp(q.L.fov, q.P.fov, k) };
  }
  function mix(a, b, t) { return { c: a.c.map((v, i) => lerp(v, b.c[i], t)), t: a.t.map((v, i) => lerp(v, b.t[i], t)), fov: lerp(a.fov, b.fov, t) }; }

  let impAngle = 0;
  function update(dt) {
    const { p0, p1, p2, p3, p4 } = S;
    // camera path
    let P = mix(pose('hero'), pose('night'), ease(p1));
    P.c[2] -= 2.2 * smooth(p2); P.c[1] -= 0.5 * smooth(p2); P.t[0] -= 0.8 * smooth(p2);
    P = mix(P, pose('anat'), ease(clamp01(p3 / 0.42)));
    P = mix(P, pose('dawn'), ease(p4));
    P.c[2] += 1.5 * (1 - p0); P.c[1] += 0.28 * (1 - p0);
    ptr.sx += (ptr.x - ptr.sx) * 0.05; ptr.sy += (ptr.y - ptr.sy) * 0.05;
    const drift = playing ? 1 : 0;
    camera.position.set(P.c[0] + ptr.sx * 0.18 + Math.sin(time * 0.21) * 0.05 * drift, P.c[1] - ptr.sy * 0.07 + Math.sin(time * 0.33) * 0.025 * drift, P.c[2]);
    tgt.set(P.t[0], P.t[1], P.t[2]); camera.lookAt(tgt);
    if (Math.abs(camera.fov - P.fov) > 1e-3) { camera.fov = P.fov; camera.updateProjectionMatrix(); }

    // light: night slides toward first light at the end of the night section, then dawn
    const night = 1 - 0.1 * smooth((p2 - 0.75) / 0.25) * (1 - smooth(p3 / 0.3)) * (1 - p4) - ease(p4);
    const nightK = clamp01(night);
    const lampK = clamp01(1 - ease(p4) * 1.2) * (1 - 0.35 * smooth((p2 - 0.6) / 0.4));
    const mAz = lerp(-0.42, 0.3, p2), mEl = lerp(0.2, 0.11, p2);
    const moonDir = tmp.set(mAz, mEl, -1).normalize();
    sky.material.uniforms.uNight.value = nightK; sky.material.uniforms.uMoonDir.value.copy(moonDir); sky.material.uniforms.uTime.value = time;
    WU.uMoonDir.value.copy(moonDir); WU.uSunDir.value.copy(sky.material.uniforms.uSunDir.value);
    WU.uNight.value = nightK; WU.uLamp.value = lampK; WU.uTime.value = time;
    shore.material.uniforms.uNight.value = nightK; shoreLights.material.uniforms.uNight.value = nightK; shoreLights.material.uniforms.uTime.value = time;
    moon.position.copy(moonDir).multiplyScalar(30); moon.intensity = 2.6 * nightK;
    sun.position.copy(sky.material.uniforms.uSunDir.value).multiplyScalar(30); sun.intensity = 3.2 * (1 - nightK);
    lamp.intensity = 46 * lampK;
    hemi.intensity = lerp(1.1, 0.75, nightK); hemi.color.setRGB(lerp(0.85, 0.19, nightK), lerp(0.55, 0.28, nightK), lerp(0.45, 0.54, nightK));
    mist.userData.mat.uniforms.uNight.value = nightK; mist.userData.mat.uniforms.uTime.value = time;
    mist.userData.mat.uniforms.uMist.value = 0.16 + 0.2 * smooth((p2 - 0.5) / 0.5) * (1 - p4) + 0.16 * ease(p4);
    renderer.toneMappingExposure = lerp(1.0, 1.0, nightK);
    const ps = H * renderer.getPixelRatio() / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    mainSpray.material.uniforms.uScale.value = ps; far.forEach((a) => (a.spray.material.uniforms.uScale.value = ps)); shoreLights.material.uniforms.uScale.value = ps;

    // machine: exploded view and turn during the anatomy chapter, whole again at dawn
    const ex = clamp01((p3 - 0.28) / 0.4) * (1 - smooth(p4 * 4));
    applyExplode(main, ex);
    main.group.rotation.y = -0.5 * smooth(p3 / 0.5) * (1 - smooth(p4 * 4));
    if (playing) impAngle += dt * 3.4;
    main.parts.imps.forEach((r) => (r.rotation.x = impAngle));
    far.forEach((a, i) => a.parts.imps.forEach((r) => (r.rotation.x = impAngle * (0.94 + i * 0.03) + i)));

    const sprayK = (1 - smooth(ex * 4));
    const su = mainSpray.material.uniforms; su.uTime.value = time * 0.62; su.uAmt.value = sprayK; su.uNight.value = nightK; su.uLamp.value = lampK;
    main.parts.imps.forEach((r, i) => su.uEmit.value[i].copy(r.position));
    far.forEach((a) => { const u = a.spray.material.uniforms; u.uTime.value = time * 0.62; u.uNight.value = nightK; u.uLamp.value = lampK * 0.4; });

    // water churn under each impeller that is in the water
    let j = 0;
    main.parts.imps.forEach((r) => { r.getWorldPosition(v3); WU.uImp.value[j++].set(v3.x, v3.z, 0, sprayK); });
    far.forEach((a) => [0, 3].forEach((i) => { a.parts.imps[i].getWorldPosition(v3); WU.uImp.value[j++].set(v3.x, v3.z, 0, 0.8); }));

    // the word: fits the hero framing, fades as the camera rises
    const wk = 1 - smooth(p1 * 1.7);
    word.visible = wk > 0.002;
    if (word.visible) {
      const useP = aspect < 0.9, wt = useP ? words.P : words.L;
      if (wordMat.map !== wt.tex) { wordMat.map = wt.tex; wordMat.needsUpdate = true; }
      const hero = pose('hero'); const d = hero.c[2] - word.position.z;
      const visH = 2 * d * Math.tan(THREE.MathUtils.degToRad(hero.fov / 2)), visW = visH * aspect;
      const ww = Math.min(visW * (useP ? 0.9 : 0.94), visH * wt.aspect * 0.78), wh = ww / wt.aspect;
      word.scale.set(ww, wh, 1); word.position.y = (useP ? 0.1 + wh / 2 : 0.02 + wh / 2) - 0.9 * (1 - p0);
      wordMat.opacity = wk * 0.96 * smooth(p0 * 1.4);
    }
  }

  function render(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (playing) time += dt;
    update(dt);
    renderer.render(scene, camera);
    dirty = false;
    opts.onFrame && opts.onFrame();
  }
  function loop(now) {
    requestAnimationFrame(loop);
    if (!visible) { last = now; return; }
    if (!playing && !dirty) { last = now; return; }
    render(now);
  }
  requestAnimationFrame(loop);

  // anchors for HTML labels (machine-local points that follow the exploded parts)
  const anchor = {
    motor: () => tmp.set(0, 0.6, 0.1).add(new THREE.Vector3(0, main.parts.motor.position.y, 0)),
    gearbox: () => tmp.set(0.14, 0.24 + main.parts.gearbox.position.y, 0.12),
    shaft: () => tmp.set(main.parts.shafts[1].position.x - 0.1, main.parts.shafts[1].position.y + 0.03, 0),
    impeller: () => tmp.copy(main.parts.imps[2].position).add(new THREE.Vector3(0.0, 0.34, 0)),
    float: () => tmp.set(main.parts.floats[1].position.x + 0.1, 0.14, 0.8),
    cover: () => tmp.set(0, main.parts.cover.position.y + 0.62, 0),
  };
  function project(name) {
    const p = anchor[name](); main.group.localToWorld(p); p.project(camera);
    return { x: (p.x * 0.5 + 0.5) * W, y: (-p.y * 0.5 + 0.5) * H, ok: p.z < 1 };
  }

  // one still frame at a given size, for the poster shown before WebGL starts (and without WebGL)
  function snapshot(w, h, type = 'image/webp', q = 0.8) {
    const pw = W, ph = H, pr = renderer.getPixelRatio();
    renderer.setPixelRatio(1); resize(w, h); update(0); renderer.render(scene, camera);
    const url = canvas.toDataURL(type, q);
    renderer.setPixelRatio(pr); resize(pw, ph); dirty = true; return url;
  }

  return {
    state: S, resize, project, renderer, snapshot,
    set(k, v) { if (S[k] !== v) { S[k] = v; dirty = true; } },
    play(on) { playing = on; dirty = true; },
    get playing() { return playing; },
    setVisible(v) { visible = v; dirty = true; },
    invalidate() { dirty = true; },
    debug: { scene, camera, main, M, POSES, water, sky, lamp, moon, hemi, sun, word },
  };
}
