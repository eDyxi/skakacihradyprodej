/* 3D: hero (č. 17) + skládání/nafukování (č. 34) – three r169, meshopt GLB */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

/* Modely z Meshy: doplnit cestu, null = 2D kreslený hrad */
const MODELS = { hero: null, story: null };
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const DPR = Math.min(devicePixelRatio || 1, innerWidth < 700 ? 1.5 : 2);
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const outBack = (t, s = 1.9) => 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2;
const outCubic = (t) => 1 - (1 - t) ** 3;
const outElastic = (t) => (t === 0 || t === 1 ? t : 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1);
const outBounce = (t) => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375; return n * (t -= 2.625 / d) * t + 0.984375; };

function stage(host) {
  const canvas = document.createElement("canvas");
  canvas.className = "c3d";
  canvas.setAttribute("aria-hidden", "true");
  host.append(canvas);
  const r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
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
  let vis = false, raf = 0, tick = null;
  new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis && !raf) loop(); }, { rootMargin: "120px" }).observe(host);
  function loop(t) { raf = 0; if (!vis) return; tick?.(t || 0); r.render(scene, cam); raf = requestAnimationFrame(loop); }
  return { r, scene, cam, host, onTick: (f) => (tick = f), kick: () => vis && !raf && loop() };
}

/* model vycentrovat, spodek na y=0, největší rozměr = 2 */
function normalize(root) {
  root.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(root), s = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3());
  const k = 2 / Math.max(s.x, s.y, s.z);
  root.scale.multiplyScalar(k);
  root.position.set(-c.x * k, -b.min.y * k, -c.z * k);
  const g = new THREE.Group();
  g.add(root);
  g.updateMatrixWorld(true);
  return { g, size: s.multiplyScalar(k) };
}

function aim(cam, size, pad = 1.1) {
  const tan = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
  const wide = Math.hypot(size.x, size.z * 0.6);
  const D = Math.max((wide * pad) / (2 * tan * cam.aspect), (size.y * pad * 1.25) / (2 * tan)) + size.z / 2;
  cam.position.set(0, size.y * 0.55 + D * 0.18, D);
  cam.lookAt(0, size.y * 0.46, 0);
}

function shadow(size) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d"), gr = x.createRadialGradient(64, 64, 4, 64, 64, 62);
  gr.addColorStop(0, "rgba(30,42,68,.32)");
  gr.addColorStop(1, "rgba(30,42,68,0)");
  x.fillStyle = gr;
  x.fillRect(0, 0, 128, 128);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.002;
  m.scale.set(size.x * 1.5, size.z * 1.5, 1);
  return m;
}

/* atribut na Float32 (meshopt/kvantizace) */
function f32(a) {
  const n = a.count, s = a.itemSize, o = new Float32Array(n * s), get = ["getX", "getY", "getZ", "getW"];
  for (let i = 0; i < n; i++) for (let k = 0; k < s; k++) o[i * s + k] = a[get[k]](i);
  return new THREE.BufferAttribute(o, s);
}

/* rozřezání na díly podle mřížky (těžiště trojúhelníků) */
function explode(g, grid = [4, 3, 2]) {
  const box = new THREE.Box3().setFromObject(g), size = box.getSize(new THREE.Vector3());
  const buckets = new Map();
  g.traverse((m) => {
    if (!m.isMesh) return;
    let geo = new THREE.BufferGeometry();
    for (const k of ["position", "normal", "uv"]) if (m.geometry.attributes[k]) geo.setAttribute(k, f32(m.geometry.attributes[k]));
    if (m.geometry.index) geo.setIndex(m.geometry.index.clone());
    geo = geo.index ? geo.toNonIndexed() : geo;
    geo.applyMatrix4(m.matrixWorld);
    const P = geo.attributes.position.array, N = geo.attributes.normal?.array, U = geo.attributes.uv?.array;
    for (let t = 0; t < P.length / 9; t++) {
      const cx = (P[t * 9] + P[t * 9 + 3] + P[t * 9 + 6]) / 3, cy = (P[t * 9 + 1] + P[t * 9 + 4] + P[t * 9 + 7]) / 3, cz = (P[t * 9 + 2] + P[t * 9 + 5] + P[t * 9 + 8]) / 3;
      const ix = Math.min(grid[0] - 1, Math.floor(((cx - box.min.x) / size.x) * grid[0]));
      const iy = Math.min(grid[1] - 1, Math.floor(((cy - box.min.y) / size.y) * grid[1]));
      const iz = Math.min(grid[2] - 1, Math.floor(((cz - box.min.z) / size.z) * grid[2]));
      const key = m.material.uuid + "|" + ix + iy + iz;
      let b = buckets.get(key);
      if (!b) buckets.set(key, (b = { mat: m.material, p: [], n: [], u: [], iy }));
      for (let v = 0; v < 3; v++) {
        const i = t * 3 + v;
        b.p.push(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]);
        if (N) b.n.push(N[i * 3], N[i * 3 + 1], N[i * 3 + 2]);
        if (U) b.u.push(U[i * 2], U[i * 2 + 1]);
      }
    }
  });
  const center = box.getCenter(new THREE.Vector3()), R = Math.max(size.x, size.y, size.z);
  const parts = [];
  for (const b of buckets.values()) {
    if (b.p.length < 27) continue;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(b.p, 3));
    if (b.n.length) geo.setAttribute("normal", new THREE.Float32BufferAttribute(b.n, 3)); else geo.computeVertexNormals();
    if (b.u.length) geo.setAttribute("uv", new THREE.Float32BufferAttribute(b.u, 2));
    geo.computeBoundingBox();
    const pc = geo.boundingBox.getCenter(new THREE.Vector3());
    geo.translate(-pc.x, -pc.y, -pc.z);
    const mesh = new THREE.Mesh(geo, b.mat);
    mesh.position.copy(pc);
    /* odkud díl přiletí: osa s největší odchylkou, horní patro shora */
    const d = pc.clone().sub(center);
    const dir = new THREE.Vector3();
    if (b.iy === 1 && Math.abs(d.x) < size.x * 0.2) dir.set(0, 1, 0);
    else if (Math.abs(d.x) > Math.abs(d.z)) dir.set(Math.sign(d.x) || 1, 0, 0);
    else dir.set(0, 0, Math.sign(d.z) || 1);
    const ax = ["x", "y", "z"][parts.length % 3];
    mesh.userData = { rest: pc.clone(), from: pc.clone().addScaledVector(dir, R * (1.1 + Math.random() * 0.7)), ax, rot: (parts.length % 2 ? 1 : -1) * Math.PI * (0.25 + Math.random() * 0.25), y: pc.y };
    parts.push(mesh);
  }
  parts.sort((a, b) => a.userData.y - b.userData.y || a.userData.rest.x - b.userData.rest.x);
  parts.forEach((p, i) => (p.userData.delay = 0.04 + (i / parts.length) * 0.5));
  const group = new THREE.Group();
  parts.forEach((p) => group.add(p));
  return { group, parts, size };
}

/* ---------- HERO: Duhová věž ---------- */
async function hero() {
  const host = document.querySelector(".hero__art");
  if (!host) return;
  if (!MODELS.hero) return;
  const S = stage(host);
  const gltf = await loader.loadAsync(MODELS.hero);
  const { g, size } = normalize(gltf.scene);
  const pivot = new THREE.Group();
  pivot.add(g, shadow(size));
  S.scene.add(pivot);
  host.classList.add("is3d");
  let yaw = -0.35, drag = null, vel = 0, t0 = performance.now();
  const cv = host.querySelector(".c3d");
  cv.addEventListener("pointerdown", (e) => { drag = e.clientX; cv.setPointerCapture(e.pointerId); cv.classList.add("grab"); });
  cv.addEventListener("pointermove", (e) => { if (drag === null) return; vel = (e.clientX - drag) * 0.012; yaw += vel; drag = e.clientX; });
  const up = () => { drag = null; cv.classList.remove("grab"); };
  cv.addEventListener("pointerup", up);
  cv.addEventListener("pointercancel", up);
  S.onTick((t) => {
    aim(S.cam, size, 1.02);
    const s = (t - t0) / 1000;
    const drop = RM ? 1 : clamp(s / 1.2);
    g.position.y = (1 - outBounce(drop)) * size.y * 1.6;
    if (drag === null) { vel *= 0.94; yaw += vel; if (!RM) yaw += (-0.35 + Math.sin(s * 0.5) * 0.45 - yaw) * 0.02; }
    pivot.rotation.y = yaw;
    if (!RM && drop >= 1) { const h = (s % 2.4) / 2.4, k = h > 0.62 ? Math.sin(((h - 0.62) / 0.38) * Math.PI) : 0; g.scale.set(1 + k * 0.035, 1 - k * 0.05, 1 + k * 0.035); }
  });
  S.kick();
}

/* ---------- PŘÍBĚH: Hasiči 150 se poskládá a nafoukne ---------- */
async function story() {
  const host = document.querySelector(".story__art");
  if (!host) return;
  if (!MODELS.story) return;
  const S = stage(host);
  const gltf = await loader.loadAsync(MODELS.story);
  const { g, size } = normalize(gltf.scene);
  const { group, parts } = explode(g, [3, 2, 2]);
  const pivot = new THREE.Group();
  const sh = shadow(size);
  pivot.add(group, sh);
  S.scene.add(pivot);
    host.classList.add("is3d");
  let target = RM ? 1 : 0, p = target;
  addEventListener("story", (e) => { target = e.detail; S.kick(); });
  const q = new THREE.Quaternion(), e3 = new THREE.Euler();
  S.onTick((t) => {
    aim(S.cam, size, 1.28);
    p += (target - p) * 0.12;
    const s = t / 1000;
    for (const m of parts) {
      const u = m.userData, k = clamp((p - u.delay) / 0.34);
      m.position.lerpVectors(u.from, u.rest, outBack(k));
      e3.set(0, 0, 0);
      e3[u.ax] = u.rot * (1 - outCubic(k));
      m.quaternion.copy(q.setFromEuler(e3));
      const inf = outElastic(clamp((p - u.delay - 0.1) / 0.32));
      m.scale.set(1 + (1 - inf) * 0.18, 0.4 + 0.6 * inf, 1 + (1 - inf) * 0.18);
      m.visible = k > 0.001 || p > 0.02;
    }
    /* finální „hop“ */
    const f = clamp((p - 0.9) / 0.1), hop = Math.sin(f * Math.PI);
    group.scale.set(1 + hop * 0.04, 1 - hop * 0.06, 1 + hop * 0.04);
    sh.material.opacity = 0.4 + p * 0.6;
    pivot.rotation.y = RM ? 0 : Math.sin(s * 0.4) * 0.32 + (1 - p) * 0.5;
  });
  S.kick();
}

hero().catch((e) => console.warn("3D hero:", e));
const st = document.querySelector(".story");
if (st) new IntersectionObserver(([e], o) => { if (e.isIntersecting) { o.disconnect(); story().catch((x) => console.warn("3D story:", x)); } }, { rootMargin: "600px" }).observe(st);
