/* 3D: hero = hrad spadne shora a gumově doskáče; příběh = hrad přiletí a opravdu se nafoukne (shader) */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

window.__3d = true;
const MODELS = { hero: "/assets/3d/017.glb", story: "/assets/3d/113.glb" };
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const DPR = Math.min(devicePixelRatio || 1, innerWidth < 700 ? 1.5 : 2);
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const outBounce = (t) => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375; return n * (t -= 2.625 / d) * t + 0.984375; };
const fail = (host) => host?.classList.add("no3d");

function stage(host) {
  const canvas = document.createElement("canvas");
  canvas.className = "c3d";
  canvas.setAttribute("aria-hidden", "true");
  const r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
  host.append(canvas);
  r.setPixelRatio(DPR);
  r.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9fb4cc, 2.4));
  const sun = new THREE.DirectionalLight(0xffffff, 1.5);
  sun.position.set(3, 6, 5);
  scene.add(sun);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.01, 100);
  const fit = () => { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  new ResizeObserver(fit).observe(host);
  fit();
  let vis = false, raf = 0, tick = null, prev = 0;
  const st = { force: false };
  new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis && !raf) { prev = 0; loop(); } }, { rootMargin: "160px" }).observe(host);
  function loop(t = performance.now()) {
    raf = 0; if (!vis && !st.force) return;
    const dt = prev ? Math.min(1 / 30, (t - prev) / 1000) : 1 / 60; prev = t;
    tick?.(t, dt); r.render(scene, cam); raf = requestAnimationFrame(loop);
  }
  return Object.assign(st, { r, scene, cam, onTick: (f) => (tick = f), kick: () => { if ((vis || st.force) && !raf) { prev = 0; loop(); } } });
}

function normalize(root) {
  root.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(root), s = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3());
  const k = 2 / Math.max(s.x, s.y, s.z);
  root.scale.multiplyScalar(k);
  root.position.set(-c.x * k, -b.min.y * k, -c.z * k);
  const g = new THREE.Group();
  g.add(root);
  return { g, size: s.multiplyScalar(k) };
}

function aim(cam, size, pad = 1.1, lift = 0) {
  const tan = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
  const wide = Math.hypot(size.x, size.z * 0.6);
  const D = Math.max((wide * pad) / (2 * tan * cam.aspect), (size.y * pad * (1.25 + lift)) / (2 * tan)) + size.z / 2;
  cam.position.set(0, size.y * 0.55 + D * 0.18, D);
  cam.lookAt(0, size.y * (0.46 + lift * 0.3), 0);
}

function shadow(size) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d"), gr = x.createRadialGradient(64, 64, 4, 64, 64, 62);
  gr.addColorStop(0, "rgba(30,42,68,.34)");
  gr.addColorStop(1, "rgba(30,42,68,0)");
  x.fillStyle = gr;
  x.fillRect(0, 0, 128, 128);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.002;
  m.userData.base = [size.x * 1.5, size.z * 1.5];
  m.scale.set(size.x * 1.5, size.z * 1.5, 1);
  return m;
}

/* gumová pružina: s < 0 = rozplácnutí, s > 0 = protažení; objem zhruba zachován */
function jelly(K = 240, C = 8.5) {
  const j = { s: 0, v: 0, hit(i) { j.v -= i; }, step(dt) { j.v += (-K * j.s - C * j.v) * dt; j.s += j.v * dt; return j.s; } };
  return j;
}
const squash = (o, s) => o.scale.set(1 - s * 0.55, 1 + s, 1 - s * 0.55);

/* ---------- HERO: spadne zvrchu mimo obrazovku a gumově doskáče ---------- */
async function hero() {
  const host = document.querySelector(".hero__art");
  if (!host) return;
  const S = stage(host);
  const { g, size } = normalize((await loader.loadAsync(MODELS.hero)).scene);
  const pivot = new THREE.Group(), sh = shadow(size);
  pivot.add(g, sh);
  S.scene.add(pivot);
  host.classList.add("is3d");

  const G = size.y * 14, j = jelly();
  let phase = RM ? "idle" : "fall", clock = 0, hy = 0, hv = 0, nextHop = 0, yaw = -0.35, drag = null, spin = 0;
  const startY = -(host.getBoundingClientRect().bottom + 120);
  const FALL = 0.95;
  S.r.compile(S.scene, S.cam);
  if (!RM) { host.style.transform = `translateY(${startY}px)`; S.force = true; }

  const cv = host.querySelector(".c3d");
  cv.addEventListener("pointerdown", (e) => { drag = e.clientX; cv.setPointerCapture(e.pointerId); cv.classList.add("grab"); });
  cv.addEventListener("pointermove", (e) => { if (drag === null) return; spin = (e.clientX - drag) * 0.012; yaw += spin; drag = e.clientX; });
  const up = () => { drag = null; cv.classList.remove("grab"); };
  cv.addEventListener("pointerup", up);
  cv.addEventListener("pointercancel", up);
  /* klik = ručně ho nadhodit */
  cv.addEventListener("dblclick", () => { if (phase === "idle") { hv = size.y * 2.4; phase = "air"; } });

  S.onTick((t, dt) => {
    aim(S.cam, size, 0.92, 0.12);
    clock += dt;
    const s = clock;
    if (phase === "fall") {
      const k = clamp(s / FALL);
      host.style.transform = `translateY(${(startY * (1 - k * k)).toFixed(1)}px)`;
      j.s = 0.08 * k * k; /* protažení v letu */
      if (k >= 1) { host.style.transform = ""; S.force = false; phase = "air"; j.hit(3.6); hv = size.y * 1.5; }
    } else if (phase === "air") {
      hv -= G * dt; hy += hv * dt;
      if (hy <= 0 && hv < 0) {
        const imp = Math.min(4.2, (-hv / size.y) * 1.6);
        hy = 0; j.hit(imp * 0.8); hv = -hv * 0.4;
        if (hv < size.y * 0.45) { hv = 0; phase = "idle"; nextHop = s + 2.6; }
      }
    } else if (!RM && s > nextHop && drag === null) { hv = size.y * 0.95; phase = "air"; nextHop = s + 3.2; }
    if (hv > 0 && phase === "air") j.s = Math.max(j.s, Math.min(0.12, hv / size.y * 0.05));
    squash(g, RM ? 0 : j.step(dt));
    g.position.y = hy;
    const lift = clamp(1 - hy / (size.y * 1.4), 0.35, 1);
    sh.scale.set(sh.userData.base[0] * lift, sh.userData.base[1] * lift, 1);
    sh.material.opacity = lift;
    if (drag === null) { spin *= 0.94; yaw += spin; if (!RM) yaw += (-0.35 + Math.sin(s * 0.45) * 0.4 - yaw) * 0.02; }
    pivot.rotation.y = yaw;
    pivot.rotation.z = RM ? 0 : j.s * -0.12; /* lehký „wobble“ do strany */
  });
  S.kick();
}

/* ---------- PŘÍBĚH: přiletí sbalený a opravdu se nafoukne ---------- */
const INFLATE = /* glsl */ `
vec4 wp = modelMatrix * vec4(transformed, 1.0);
float hy = wp.y;
float h = clamp(hy / uH, 0.0, 1.0);
vH = h;
float t = clamp(uInf * 1.45 - h * 0.45, 0.0, 1.0);
float u = t - 1.0;
float e = 1.0 + 2.4 * u * u * u + 1.4 * u * u;
float fl = 1.0 - clamp(e, 0.0, 1.0);
vec2 xz = wp.xz;
xz *= 1.0 + 0.16 * fl + 0.025 * sin(uTime * 5.0) * fl;
float wr = sin(wp.x * 9.0 + uTime * 0.7) * sin(wp.z * 8.0 - uTime * 0.5);
hy = hy * mix(0.05, 1.0, e) + wr * 0.012 * uH * fl;
xz.x += sin(uTime * 7.0 + hy * 4.0) * uWob * h;
wp.xz = xz;
wp.y = max(hy, 0.0);
vec4 mvPosition = viewMatrix * wp;
gl_Position = projectionMatrix * mvPosition;`;
/* barvy se „nalijí“ zespodu nahoru, do té doby je placka červená */
const TINT = /* glsl */ `
#include <map_fragment>
float rv = 1.0 - smoothstep(uCol - 0.12, uCol, vH);
diffuseColor.rgb = mix(vec3(0.62, 0.035, 0.03), diffuseColor.rgb, rv);`;

async function story() {
  const host = document.querySelector(".story__art");
  if (!host) return;
  const S = stage(host);
  const { g, size } = normalize((await loader.loadAsync(MODELS.story)).scene);
  const U = { uInf: { value: 0 }, uCol: { value: 0 }, uTime: { value: 0 }, uH: { value: size.y }, uWob: { value: 0 } };
  g.traverse((m) => {
    if (!m.isMesh) return;
    m.frustumCulled = false;
    m.material = m.material.clone();
    m.material.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = "uniform float uInf, uTime, uH, uWob;\nvarying float vH;\n" + sh.vertexShader.replace("#include <project_vertex>", INFLATE);
      sh.fragmentShader = "uniform float uCol;\nvarying float vH;\n" + sh.fragmentShader.replace("#include <map_fragment>", TINT);
    };
    m.material.customProgramCacheKey = () => "inflate2";
  });
  const pivot = new THREE.Group(), sh = shadow(size);
  pivot.add(g, sh);
  S.scene.add(pivot);
  host.classList.add("is3d");
  const j = jelly(170, 5.5);
  let target = RM ? 1 : 0, p = target, full = false;
  addEventListener("story", (e) => { target = e.detail; S.kick(); });
  S.onTick((t, dt) => {
    aim(S.cam, size, 1.4, 0.05);
    p += (target - p) * (1 - Math.exp(-dt * 4));
    const inf = clamp((p - 0.06) / 0.8);
    U.uInf.value = inf;
    U.uCol.value = clamp((inf - 0.12) / 0.4) * 1.15;
    if (inf > 0.97 && !full) { full = true; j.hit(4); } else if (inf < 0.85) full = false;
    U.uWob.value = Math.abs(j.s) * size.y * 0.22;
    U.uTime.value = t / 1000;
    squash(g, j.step(dt) * 0.7);
    sh.material.opacity = 0.5 + inf * 0.5;
    pivot.rotation.y = RM ? -0.3 : -0.3 + Math.sin(t / 2800) * 0.2;
  });
  S.kick();
}


/* ---------- NA MÍRU: hrad se nejdřív nakreslí (obrys + skica), pak se vybarví ---------- */
const CUSTOM_MODEL = "/assets/3d/017.glb";
const NOISE = `
float hash3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vnoise(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash3(i), hash3(i + vec3(1,0,0)), f.x), mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x), mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y), f.z); }
`;
async function custom() {
  const host = document.querySelector(".custom__art");
  if (!host) return;
  const S = stage(host);
  const { g, size } = normalize((await loader.loadAsync(CUSTOM_MODEL)).scene);
  const U = { uDraw: { value: -1 }, uFill: { value: 0 }, uH: { value: size.y }, uThick: { value: size.y * 0.014 } };
  const VW = "varying vec3 vW;\n";
  const cut = "if (vW.y > uDraw + sin(vW.x * 38.0 + vW.z * 21.0) * 0.012 * uH) discard;\n";
  const hull = new THREE.MeshBasicMaterial({ color: 0x1e2a44, side: THREE.BackSide });
  hull.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = "uniform float uThick, uH;\n" + VW + sh.vertexShader.replace("#include <project_vertex>", "vec4 wp = modelMatrix * vec4(transformed, 1.0);\nvec3 nn = mat3(modelMatrix) * normal;\nnn = dot(nn, nn) > 1e-6 ? normalize(nn) : normalize(wp.xyz - vec3(0.0, uH * 0.45, 0.0));\nwp.xyz += nn * uThick;\nvW = wp.xyz;\nvec4 mvPosition = viewMatrix * wp;\ngl_Position = projectionMatrix * mvPosition;");
    sh.fragmentShader = "uniform float uDraw, uH;\n" + VW + sh.fragmentShader.replace("void main() {", "void main() {\n" + cut);
  };
  hull.customProgramCacheKey = () => "hull";
  const hulls = [];
  g.traverse((m) => {
    if (!m.isMesh) return;
    m.frustumCulled = false;
    m.material = m.material.clone();
    m.material.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = VW + sh.vertexShader.replace("#include <project_vertex>", "#include <project_vertex>\nvW = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      sh.fragmentShader = "uniform float uDraw, uFill, uH;\n" + VW + NOISE + sh.fragmentShader
        .replace("void main() {", "void main() {\n" + cut)
        .replace("#include <map_fragment>", `#include <map_fragment>
float n = vnoise(vW * 5.5) * 0.75 + vnoise(vW * 17.0) * 0.25;
float paint = smoothstep(n - 0.05, n + 0.05, uFill * 1.1);
float hatch = step(0.82, fract((vW.x + vW.y * 1.3) * 34.0)) * (1.0 - paint);
vec3 paper = vec3(0.98, 0.97, 0.93) * (1.0 - 0.22 * hatch);
diffuseColor.rgb = mix(paper, diffuseColor.rgb, paint);`);
    };
    m.material.customProgramCacheKey = () => "paint";
    const h = new THREE.Mesh(m.geometry, hull);
    h.frustumCulled = false;
    hulls.push([m, h]);
  });
  hulls.forEach(([m, h]) => { m.parent.add(h); h.position.copy(m.position); h.quaternion.copy(m.quaternion); h.scale.copy(m.scale); });
  const pivot = new THREE.Group(), sh = shadow(size);
  pivot.add(g, sh);
  S.scene.add(pivot);
  host.classList.add("is3d");
  const label = host.querySelector("[data-gen]"), j = jelly(190, 7);
  let target = window.__customP ?? (RM ? 1 : 0), p = target, done = false, yaw = -0.45, drag = null, spin = 0;
  addEventListener("custom", (e) => { target = e.detail; S.kick(); });
  const cv = host.querySelector(".c3d");
  cv.addEventListener("pointerdown", (e) => { drag = e.clientX; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener("pointermove", (e) => { if (drag === null) return; spin = (e.clientX - drag) * 0.012; yaw += spin; drag = e.clientX; });
  cv.addEventListener("pointerup", () => (drag = null));
  S.onTick((t, dt) => {
    aim(S.cam, size, 1.18, 0.05);
    p += (target - p) * (1 - Math.exp(-dt * 5));
    const d = clamp((p - 0.04) / 0.46), f = clamp((p - 0.52) / 0.4);
    U.uDraw.value = -0.06 * size.y + d * size.y * 1.15;
    U.uFill.value = f;
    sh.material.opacity = d;
    if (label) label.textContent = f > 0.99 ? "hotovo ✓" : f > 0 ? `barvy ${Math.round(f * 100)} %` : `skica ${Math.round(d * 100)} %`;
    if (f > 0.98 && !done) { done = true; j.hit(3.5); } else if (f < 0.9) done = false;
    squash(g, j.step(dt));
    if (drag === null) { spin *= 0.94; yaw += spin + (RM ? 0 : dt * 0.18); }
    pivot.rotation.y = yaw;
  });
  S.kick();
}

hero().catch((e) => { console.warn("3D hero:", e); fail(document.querySelector(".hero__art")); });
const st = document.querySelector(".story");
if (st) new IntersectionObserver(([e], o) => { if (e.isIntersecting) { o.disconnect(); story().catch((x) => { console.warn("3D story:", x); fail(document.querySelector(".story__art")); }); } }, { rootMargin: "700px" }).observe(st);
const cu = document.querySelector(".custom__art");
if (cu) new IntersectionObserver(([e], o) => { if (e.isIntersecting) { o.disconnect(); custom().catch((x) => { console.warn("3D návrh:", x); }); } }, { rootMargin: "600px" }).observe(cu);
