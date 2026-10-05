/* 3D studio – parametrický skákací hrad (three.js), živý náhled, odeslání do poptávky */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const $ = (s) => document.querySelector(s), $$ = (s) => [...document.querySelectorAll(s)];
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const PAL = { modrá: "#38B6FF", žlutá: "#FFD23F", červená: "#F2453D", zelená: "#43C463", fialová: "#7E5BD6", růžová: "#FF7DB8", oranžová: "#FF8A1F", tmavě: "#1B3A63", bílá: "#F7F7F2" };
const S = { w: 5, d: 5, h: 4, wall: "modrá", acc: "žlutá", floor: "červená", tower: "cone", slide: "none", txt: "SKÁKACÍ HRADY", logo: null };

/* ---------- scéna ---------- */
const host = $("#st-3d");
const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
r.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
r.outputColorSpace = THREE.SRGBColorSpace;
host.append(r.domElement);
const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xffffff, 0x8fb7c9, 2.1));
const sun = new THREE.DirectionalLight(0xffffff, 1.7);
sun.position.set(6, 10, 7);
scene.add(sun);
const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
cam.position.set(11, 7.5, 13);
const ctl = new OrbitControls(cam, r.domElement);
Object.assign(ctl, { enableDamping: true, dampingFactor: 0.08, enablePan: false, minDistance: 8, maxDistance: 28, maxPolarAngle: Math.PI * 0.48, autoRotate: !RM, autoRotateSpeed: 0.6 });
ctl.target.set(0, 1.6, 0);
r.domElement.addEventListener("pointerdown", () => (ctl.autoRotate = false));
const fit = () => { const w = host.clientWidth, h = host.clientHeight; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
new ResizeObserver(fit).observe(host);
fit();
/* podložka se stínem */
const shadowTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d"), g = x.createRadialGradient(64, 64, 6, 64, 64, 62); g.addColorStop(0, "rgba(30,42,68,.35)"); g.addColorStop(1, "rgba(30,42,68,0)"); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
const floorShadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
floorShadow.rotation.x = -Math.PI / 2;
scene.add(floorShadow);

/* ---------- stavebnice ---------- */
const INK = new THREE.MeshBasicMaterial({ color: 0x1e2a44, side: THREE.BackSide });
const mat = (hex) => new THREE.MeshStandardMaterial({ color: new THREE.Color(hex), roughness: 0.32, metalness: 0 });
let castle = new THREE.Group();
scene.add(castle);
function add(g, geo, m, x, y, z, rx = 0, ry = 0, rz = 0) {
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set(x, y, z); mesh.rotation.set(rx, ry, rz);
  const hull = new THREE.Mesh(geo, INK); hull.scale.setScalar(1.045); mesh.add(hull); /* kreslený obrys */
  g.add(mesh); return mesh;
}
const tube = (len, rad) => new THREE.CapsuleGeometry(rad, Math.max(0.01, len - rad * 2), 6, 16);

function banner(wid) {
  const c = document.createElement("canvas"); c.width = 1024; c.height = 220;
  const x = c.getContext("2d");
  x.fillStyle = PAL[S.acc]; x.fillRect(0, 0, 1024, 220);
  let left = 40;
  if (S.logo) { const s = 170, ar = S.logo.width / S.logo.height; const lw = Math.min(260, s * ar); x.drawImage(S.logo, 30, (220 - lw / ar) / 2, lw, lw / ar); left = 50 + lw; }
  x.fillStyle = "#1E2A44"; x.textAlign = "center"; x.textBaseline = "middle";
  let fs = 130; x.font = `800 ${fs}px "Baloo 2", system-ui, sans-serif`;
  const t = S.txt.trim().toUpperCase() || " ";
  while (x.measureText(t).width > 1024 - left - 40 && fs > 40) { fs -= 6; x.font = `800 ${fs}px "Baloo 2", system-ui, sans-serif`; }
  x.fillText(t, left + (1024 - left - 20) / 2, 118);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return new THREE.Mesh(new THREE.PlaneGeometry(wid, wid * 220 / 1024), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }));
}

function build() {
  scene.remove(castle);
  castle.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
  const g = (castle = new THREE.Group());
  const W = S.w, D = S.d, H = S.h, T = 0.46, WH = Math.max(1.7, H * 0.55);
  const mw = mat(PAL[S.wall]), ma = mat(PAL[S.acc]), mf = mat(PAL[S.floor]);
  /* základna */
  add(g, new RoundedBoxGeometry(W, 0.5, D, 4, 0.22), mw, 0, 0.25, 0);
  /* podlaha z válců */
  const n = Math.max(3, Math.round((W - 2 * T) / 0.55)), fw = (W - 2 * T) / n;
  for (let i = 0; i < n; i++) add(g, tube(D - 2 * T, fw * 0.46), mf, -W / 2 + T + fw * (i + 0.5), 0.58, 0, Math.PI / 2);
  /* stěny z válců: zadní + boční */
  const rows = Math.max(3, Math.round((WH - 0.5) / 0.44)), rh = (WH - 0.5) / rows;
  for (let j = 0; j < rows; j++) {
    const y = 0.5 + rh * (j + 0.5);
    add(g, tube(W - 0.2, rh * 0.5), mw, 0, y, -D / 2 + T / 2, 0, 0, Math.PI / 2);
    add(g, tube(D - 0.2, rh * 0.5), mw, -W / 2 + T / 2, y, 0, Math.PI / 2);
    add(g, tube(D - 0.2, rh * 0.5), mw, W / 2 - T / 2, y, 0, Math.PI / 2);
  }
  /* přední trám s nápisem */
  const beamY = WH + 0.25;
  add(g, new RoundedBoxGeometry(W - 0.6, 0.6, 0.5, 4, 0.24), ma, 0, beamY, D / 2 - T / 2);
  const b = banner(W - 1.3); b.position.set(0, beamY, D / 2 - T / 2 + 0.27); g.add(b);
  add(g, new RoundedBoxGeometry(W - 0.6, 0.55, 0.5, 4, 0.24), mw, 0, beamY, -D / 2 + T / 2);
  /* vstupní schod */
  add(g, tube(W * 0.62, 0.3), mf, 0, 0.3, D / 2 + 0.38, 0, 0, Math.PI / 2);
  /* věže */
  if (S.tower !== "none") {
    const tr = 0.42, th = H * 0.86;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
      const x = sx * (W / 2 - tr * 0.6), z = sz * (D / 2 - tr * 0.6);
      add(g, new THREE.CylinderGeometry(tr, tr * 1.05, th, 24), mw, x, th / 2, z);
      add(g, new THREE.TorusGeometry(tr * 1.02, 0.11, 10, 24), ma, x, th * 0.62, z, Math.PI / 2);
      add(g, new THREE.TorusGeometry(tr * 1.08, 0.13, 10, 24), ma, x, th, z, Math.PI / 2);
      if (S.tower === "cone") add(g, new THREE.ConeGeometry(tr * 1.25, 1.05, 24), ma, x, th + 0.6, z);
      else add(g, new THREE.SphereGeometry(tr * 1.05, 24, 16), ma, x, th + 0.42, z);
    });
  }
  /* skluzavka */
  if (S.slide !== "none") {
    const sx = (S.slide === "left" ? -1 : 1) * (W / 2 + 0.95), top = WH, L = Math.hypot(top, D * 0.9), ang = Math.atan2(top, D * 0.9);
    const sl = add(g, new RoundedBoxGeometry(1.6, 0.3, L, 4, 0.12), ma, sx, top / 2 + 0.15, 0.05, ang);
    [-0.85, 0.85].forEach((o) => add(g, tube(L, 0.17), mw, sx + o, top / 2 + 0.42, 0.05, Math.PI / 2 + ang));
    add(g, new RoundedBoxGeometry(1.9, top, 0.9, 4, 0.2), mw, sx, top / 2, -D / 2 + 0.45);
    add(g, tube(1.9, 0.25), mf, sx, 0.25, D / 2 * 0.9 + 0.5, 0, 0, Math.PI / 2);
    sl.userData.k = 1;
  }
  scene.add(g);
  const span = Math.max(W + (S.slide !== "none" ? 2.6 : 0), D) * 1.25;
  floorShadow.scale.set(span, span, 1);
  pop = 0;
  price();
}

/* gumové nafouknutí při každé změně */
let pop = 1;
const clock = new THREE.Clock();
function loop() {
  const dt = Math.min(0.05, clock.getDelta());
  if (pop < 1) { pop = Math.min(1, pop + dt / 0.9); const t = pop, e = 1 - Math.pow(2, -9 * t) * Math.cos(t * 13); castle.scale.set(1 + (1 - e) * 0.12, Math.max(0.2, e), 1 + (1 - e) * 0.12); }
  ctl.update(); r.render(scene, cam); requestAnimationFrame(loop);
}

/* ---------- cena (orientační) ---------- */
const kc = (n) => Math.round(n).toLocaleString("cs-CZ") + " Kč";
function price() {
  let p = 24000 + S.w * S.d * 1150 + (S.h - 3) * 4000 + (S.tower !== "none" ? 5000 : 0) + (S.slide !== "none" ? 18000 : 0) + (S.logo ? 0 : 0);
  p = Math.round(p / 1000) * 1000;
  $("#st-price").textContent = "od " + kc(p);
  return p;
}

/* ---------- ovládání ---------- */
["w", "d", "h"].forEach((k) => { const i = $("#" + k), o = $("#o-" + k); const upd = () => { S[k] = +i.value; o.textContent = String(i.value).replace(".", ",") + " m"; }; upd(); i.addEventListener("input", () => { upd(); build(); }); });
$$(".sw").forEach((box) => {
  const k = box.dataset.k;
  box.innerHTML = Object.entries(PAL).map(([n, c]) => `<button type="button" title="${n}" aria-label="${n}" data-c="${n}" style="--c:${c}"></button>`).join("");
  box.addEventListener("click", (e) => { const b = e.target.closest("[data-c]"); if (!b) return; S[k] = b.dataset.c; mark(); build(); });
});
$$(".st-seg").forEach((seg) => seg.addEventListener("click", (e) => { const b = e.target.closest("[data-v]"); if (!b) return; S[seg.dataset.k] = b.dataset.v; mark(); build(); }));
let tt; $("#txt").addEventListener("input", (e) => { S.txt = e.target.value; clearTimeout(tt); tt = setTimeout(build, 250); });
$("#logo").addEventListener("change", (e) => { const f = e.target.files[0]; if (!f) return; const im = new Image(); im.onload = () => { S.logo = im; build(); }; im.src = URL.createObjectURL(f); });
function mark() {
  $$(".sw").forEach((box) => box.querySelectorAll("[data-c]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.c === S[box.dataset.k])));
  $$(".st-seg").forEach((seg) => seg.querySelectorAll("[data-v]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.v === S[seg.dataset.k])));
}
$("#st-rnd").addEventListener("click", () => {
  const keys = Object.keys(PAL), pick = (a) => a[Math.floor(Math.random() * a.length)];
  Object.assign(S, { w: pick([4, 4.5, 5, 6, 7]), d: pick([4, 5, 6]), h: pick([3.5, 4, 4.5, 5]), wall: pick(keys), acc: pick(keys), floor: pick(["červená", "žlutá", "modrá", "zelená"]), tower: pick(["cone", "ball", "cone"]), slide: pick(["none", "left", "right"]) });
  ["w", "d", "h"].forEach((k) => { $("#" + k).value = S[k]; $("#" + k).dispatchEvent(new Event("input")); });
  mark(); build();
});
const shot = () => { r.render(scene, cam); return r.domElement.toDataURL("image/jpeg", 0.82); };
$("#st-png").addEventListener("click", () => { const a = document.createElement("a"); a.href = shot(); a.download = "muj-skakaci-hrad.jpg"; a.click(); });
$("#st-send").addEventListener("click", () => {
  const sum = `3D návrh ze studia: ${S.w} × ${S.d} m, výška ${S.h} m · stěny ${S.wall}, věže ${S.acc}, podlaha ${S.floor} · ${({ cone: "věže se špicí", ball: "věže s kuličkou", none: "bez věží" })[S.tower]} · ${({ none: "bez skluzavky", left: "skluzavka vlevo", right: "skluzavka vpravo" })[S.slide]} · nápis „${S.txt}“${S.logo ? " · vlastní logo (pošlu e-mailem)" : ""} · orientačně od ${kc(price())}`;
  try {
    const c = document.createElement("canvas"); c.width = 640; c.height = Math.round(640 * r.domElement.height / r.domElement.width);
    const im = new Image(); im.onload = () => { c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); localStorage.setItem("shp-design", JSON.stringify({ sum, img: c.toDataURL("image/jpeg", 0.7) })); location.href = "/kosik.html"; };
    im.src = shot();
  } catch { location.href = "/kosik.html"; }
});

document.fonts?.load('800 60px "Baloo 2"').finally(() => { mark(); build(); host.classList.add("ready"); loop(); });
