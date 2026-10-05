/* 3D studio v2 – parametrické skákací hrady podle katalogu (hrad, combo, velká skluzavka, dráha) */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const $ = (s) => document.querySelector(s), $$ = (s) => [...document.querySelectorAll(s)];
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const PAL = { modrá: "#38B6FF", tyrkysová: "#1FC4C9", žlutá: "#FFD23F", oranžová: "#FF8A1F", červená: "#EE3B35", růžová: "#FF7DB8", fialová: "#7E5BD6", zelená: "#43C463", tmavězelená: "#1E8F4E", hnědá: "#9A5B2E", šedá: "#9AA6B6", tmavomodrá: "#1B3A63", bílá: "#F7F7F2" };
const RANGES = { arena: { w: [4, 8], d: [4, 8], h: [1.5, 3] }, hrad: { w: [3, 8], d: [3, 8], h: [3, 5.5] }, combo: { w: [4, 9], d: [4, 8], h: [3.5, 6] }, skluzavka: { w: [3, 7], d: [6, 13], h: [4, 8] }, draha: { w: [3, 5], d: [7, 15], h: [3, 5] } };
const TYPE_N = { arena: "hrací aréna", hrad: "skákací hrad", combo: "hrad se skluzavkou", skluzavka: "velká skluzavka", draha: "překážková dráha" };
const DEF = { typ: "hrad", w: 5, d: 5, h: 4, wall: "modrá", wall2: "žlutá", acc: "červená", floor: "červená", towers: "4", tstyle: "cone", walls: "tubes", stripes: "0", roof: "none", side: "right", lanes: "1", extras: ["step"], animal: "none", txt: "SKÁKACÍ HRADY", logo: null };
const S = structuredClone({ ...DEF, logo: null });
S.logo = null;

/* předlohy podle katalogu (číslo v závorce = model v katalogu) */
const PRESETS = [
  { n: "Klasický hrad", no: 53, p: { typ: "hrad", w: 4, d: 4, h: 3.5, wall: "červená", wall2: "žlutá", acc: "žlutá", floor: "červená", towers: "4", tstyle: "cone", walls: "tubes", stripes: "1", roof: "none", extras: ["step"] } },
  { n: "Duhová věž", no: 17, p: { typ: "combo", w: 6, d: 4.5, h: 4.5, wall: "červená", wall2: "zelená", acc: "modrá", floor: "modrá", towers: "4", tstyle: "cone", walls: "tubes", stripes: "1", roof: "flat", side: "right", lanes: "2", extras: ["step"] } },
  { n: "Princeznin zámek", no: 91, p: { typ: "combo", w: 6, d: 5, h: 4.5, wall: "růžová", wall2: "bílá", acc: "fialová", floor: "růžová", towers: "4", tstyle: "cone", walls: "mesh", stripes: "0", roof: "arch", side: "right", lanes: "1", extras: ["step", "flag"] } },
  { n: "Orientální palác", no: 22, p: { typ: "hrad", w: 5, d: 5, h: 4.5, wall: "žlutá", wall2: "zelená", acc: "zelená", floor: "modrá", towers: "4", tstyle: "onion", walls: "mesh", stripes: "0", roof: "none", extras: ["step"] } },
  { n: "Džungle s palmami", no: 96, p: { typ: "combo", w: 6, d: 5, h: 4.5, wall: "zelená", wall2: "žlutá", acc: "hnědá", floor: "žlutá", towers: "4", tstyle: "palm", walls: "mesh", stripes: "1", roof: "flat", side: "left", lanes: "2", extras: ["step"] } },
  { n: "Pastelkový zámek", no: 66, p: { typ: "hrad", w: 4, d: 4, h: 4, wall: "růžová", wall2: "fialová", acc: "fialová", floor: "růžová", towers: "4", tstyle: "crayon", walls: "mesh", stripes: "0", roof: "flat", extras: ["step"] } },
  { n: "Rytířská pevnost", no: 15, p: { typ: "combo", w: 6, d: 5, h: 4.5, wall: "šedá", wall2: "bílá", acc: "modrá", floor: "modrá", towers: "4", tstyle: "flat", walls: "mesh", stripes: "0", roof: "none", side: "right", lanes: "1", extras: ["step", "arch"] } },
  { n: "Pirátská loď", no: 57, p: { typ: "combo", w: 7, d: 5, h: 4.5, wall: "hnědá", wall2: "žlutá", acc: "červená", floor: "červená", towers: "2", tstyle: "ball", walls: "mesh", stripes: "1", roof: "none", side: "left", lanes: "1", extras: ["step", "flag"] } },
  { n: "Hrací centrum", no: 59, p: { typ: "combo", w: 6, d: 6, h: 4, wall: "modrá", wall2: "červená", acc: "žlutá", floor: "zelená", towers: "4", tstyle: "ball", walls: "mesh", stripes: "1", roof: "flat", side: "right", lanes: "1", extras: ["step", "hoop", "pillars"] } },
  { n: "Mega skluzavka", no: 64, p: { typ: "skluzavka", w: 5, d: 10, h: 7, wall: "žlutá", wall2: "červená", acc: "modrá", floor: "modrá", towers: "2", tstyle: "cone", stripes: "1", lanes: "3", extras: ["arch"] } },
  { n: "Ledový tobogán", no: 77, p: { typ: "skluzavka", w: 4, d: 8, h: 6, wall: "modrá", wall2: "bílá", acc: "bílá", floor: "tyrkysová", towers: "0", tstyle: "cone", stripes: "1", lanes: "2", extras: ["arch"] } },
  { n: "Překážková dráha", no: 3, p: { typ: "draha", w: 3.5, d: 12, h: 4, wall: "červená", wall2: "žlutá", acc: "modrá", floor: "modrá", towers: "0", tstyle: "cone", stripes: "1", extras: ["arch", "pillars"] } },
  { n: "Lví král", no: 9, p: { typ: "combo", w: 6, d: 5, h: 4.5, wall: "žlutá", wall2: "zelená", acc: "zelená", floor: "modrá", towers: "4", tstyle: "palm", walls: "mesh", stripes: "1", roof: "none", side: "right", lanes: "1", extras: ["step"], animal: "lev" } },
  { n: "Medvídkův hrad", no: 119, p: { typ: "hrad", w: 5, d: 5, h: 4, wall: "zelená", wall2: "žlutá", acc: "oranžová", floor: "červená", towers: "2", tstyle: "ball", walls: "mesh", stripes: "1", roof: "none", extras: ["step"], animal: "medved" } },
  { n: "Fotbalová aréna", no: 61, p: { typ: "arena", w: 7, d: 5, h: 2, wall: "červená", wall2: "bílá", acc: "zelená", floor: "zelená", towers: "4", tstyle: "ball", stripes: "1", extras: [] } },
  { n: "Kompakt do auta", no: 21, p: { typ: "hrad", w: 3, d: 4, h: 3, wall: "modrá", wall2: "žlutá", acc: "žlutá", floor: "červená", towers: "0", tstyle: "cone", walls: "mesh", stripes: "0", roof: "flat", extras: ["step"] } },
];
const SCHEMES = [
  ["Duhová", { wall: "červená", wall2: "žlutá", acc: "modrá", floor: "zelená" }], ["Klasika", { wall: "modrá", wall2: "žlutá", acc: "červená", floor: "červená" }],
  ["Princezny", { wall: "růžová", wall2: "bílá", acc: "fialová", floor: "růžová" }], ["Džungle", { wall: "zelená", wall2: "žlutá", acc: "hnědá", floor: "žlutá" }],
  ["Moře", { wall: "tyrkysová", wall2: "bílá", acc: "modrá", floor: "modrá" }], ["Hasiči", { wall: "červená", wall2: "bílá", acc: "žlutá", floor: "šedá" }],
  ["Kámen", { wall: "šedá", wall2: "bílá", acc: "tmavomodrá", floor: "modrá" }], ["Sluníčko", { wall: "žlutá", wall2: "oranžová", acc: "červená", floor: "červená" }],
];

/* ---------- scéna ---------- */
const host = $("#st-3d");
const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
r.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
r.outputColorSpace = THREE.SRGBColorSpace;
r.toneMapping = THREE.NeutralToneMapping;
host.append(r.domElement);
const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xffffff, 0x9cc4d2, 1.9));
const sun = new THREE.DirectionalLight(0xffffff, 2.1);
sun.position.set(7, 12, 9);
scene.add(sun);
const rim = new THREE.DirectionalLight(0xbfe8ff, 0.9);
rim.position.set(-8, 6, -10);
scene.add(rim);
const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 300);
cam.position.set(12, 8, 14);
const ctl = new OrbitControls(cam, r.domElement);
Object.assign(ctl, { enableDamping: true, dampingFactor: 0.08, enablePan: false, minDistance: 6, maxDistance: 45, maxPolarAngle: Math.PI * 0.49, autoRotate: !RM, autoRotateSpeed: 0.55 });
r.domElement.addEventListener("pointerdown", () => (ctl.autoRotate = false));
const fit = () => { const w = host.clientWidth, h = host.clientHeight; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
new ResizeObserver(fit).observe(host);
fit();
const canvasTex = (w, h, f) => { const c = document.createElement("canvas"); c.width = w; c.height = h; f(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
const shadowTex = canvasTex(128, 128, (x) => { const g = x.createRadialGradient(64, 64, 6, 64, 64, 62); g.addColorStop(0, "rgba(30,42,68,.38)"); g.addColorStop(1, "rgba(30,42,68,0)"); x.fillStyle = g; x.fillRect(0, 0, 128, 128); });
const floorShadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
floorShadow.rotation.x = -Math.PI / 2;
floorShadow.position.y = 0.01;
scene.add(floorShadow);
/* síťovina */
const netTex = canvasTex(128, 128, (x) => { x.clearRect(0, 0, 128, 128); x.strokeStyle = "rgba(30,42,68,.85)"; x.lineWidth = 5; for (let i = 0; i <= 128; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 128); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(128, i); x.stroke(); } });
netTex.wrapS = netTex.wrapT = THREE.RepeatWrapping;

/* ---------- materiály a díly ---------- */
const INK = new THREE.MeshBasicMaterial({ color: 0x1e2a44, side: THREE.BackSide });
const mats = new Map();
const mat = (name) => { if (!mats.has(name)) mats.set(name, new THREE.MeshPhysicalMaterial({ color: new THREE.Color(PAL[name] || name), roughness: 0.36, metalness: 0, clearcoat: 0.65, clearcoatRoughness: 0.28 })); return mats.get(name); };
let castle = new THREE.Group();
scene.add(castle);
function add(g, geo, m, x, y, z, rx = 0, ry = 0, rz = 0, outline = 1.045) {
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set(x, y, z); mesh.rotation.set(rx, ry, rz);
  if (outline) { const hull = new THREE.Mesh(geo, INK); hull.scale.setScalar(outline); mesh.add(hull); }
  g.add(mesh); return mesh;
}
const tube = (len, rad) => new THREE.CapsuleGeometry(rad, Math.max(0.01, len - rad * 2), 6, 16);
const rbox = (w, h, d, rad = 0.2) => new RoundedBoxGeometry(w, h, d, 4, Math.min(rad, w / 2.05, h / 2.05, d / 2.05));
/* vodorovná trubka podél osy x / z */
const tubeX = (g, len, rad, m, x, y, z) => add(g, tube(len, rad), m, x, y, z, 0, 0, Math.PI / 2);
const tubeZ = (g, len, rad, m, x, y, z) => add(g, tube(len, rad), m, x, y, z, Math.PI / 2);
const stripe = (i) => (S.stripes === "1" && i % 2 ? mat(S.wall2) : mat(S.wall));

function bannerMesh(wid, hgt) {
  const tex = canvasTex(1024, Math.round(1024 * hgt / wid), (x, W, H) => {
    x.fillStyle = PAL[S.acc] === PAL["bílá"] ? PAL[S.wall] : PAL[S.acc]; x.fillRect(0, 0, W, H);
    x.fillStyle = "rgba(255,255,255,.18)"; x.fillRect(0, 0, W, H * 0.22);
    let left = 30;
    if (S.logo) { const lh = H * 0.78, ar = S.logo.width / S.logo.height, lw = Math.min(W * 0.3, lh * ar); x.drawImage(S.logo, 24, (H - lw / ar) / 2, lw, lw / ar); left = 40 + lw; }
    const t = S.txt.trim().toUpperCase() || " ";
    let fs = H * 0.62; x.textAlign = "center"; x.textBaseline = "middle";
    const font = () => (x.font = `800 ${fs}px "Baloo 2", system-ui, sans-serif`); font();
    while (x.measureText(t).width > W - left - 30 && fs > 20) { fs -= 4; font(); }
    x.lineJoin = "round"; x.lineWidth = fs * 0.16; x.strokeStyle = "#1E2A44"; x.fillStyle = "#FFFFFF";
    x.strokeText(t, left + (W - left - 14) / 2, H * 0.55); x.fillText(t, left + (W - left - 14) / 2, H * 0.55);
  });
  tex.anisotropy = 4;
  return new THREE.Mesh(new THREE.PlaneGeometry(wid, hgt), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.45 }));
}

/* ---------- díly ---------- */
function tower(g, x, z, th, tr) {
  const ma = mat(S.acc), mw = mat(S.wall), m2 = mat(S.wall2);
  const st = S.tstyle;
  if (st === "palm") {
    add(g, new THREE.CylinderGeometry(tr * 0.82, tr, th, 18), mat("hnědá"), x, th / 2, z);
    for (let k = 0; k < 4; k++) add(g, new THREE.TorusGeometry(tr * 0.86, 0.07, 8, 20), mat("tmavězelená"), x, th * (0.2 + k * 0.2), z, Math.PI / 2, 0, 0, 0);
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; const leaf = add(g, new THREE.SphereGeometry(0.7, 16, 8), mat("zelená"), x + Math.cos(a) * 0.62, th + 0.12, z + Math.sin(a) * 0.62, 0, -a, 0.55); leaf.scale.set(1.35, 0.22, 0.5); }
    add(g, new THREE.SphereGeometry(tr * 0.7, 16, 12), mat("zelená"), x, th + 0.25, z);
    return;
  }
  add(g, new THREE.CylinderGeometry(tr, tr * 1.04, th, 26), st === "crayon" ? ma : mw, x, th / 2, z);
  add(g, new THREE.TorusGeometry(tr * 1.03, 0.11, 10, 26), st === "crayon" ? m2 : ma, x, th * 0.6, z, Math.PI / 2);
  if (st === "crayon") { add(g, new THREE.TorusGeometry(tr * 1.03, 0.09, 10, 26), m2, x, th * 0.28, z, Math.PI / 2); add(g, new THREE.CylinderGeometry(tr * 0.35, tr, 0.9, 6), mat("bílá"), x, th + 0.45, z); add(g, new THREE.CylinderGeometry(0.02, tr * 0.35, 0.35, 6), ma, x, th + 1.07, z); return; }
  if (st === "flat") { add(g, new THREE.TorusGeometry(tr * 1.1, 0.16, 10, 26), ma, x, th, z, Math.PI / 2); for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; add(g, rbox(0.28, 0.4, 0.28, 0.08), mw, x + Math.cos(a) * tr, th + 0.28, z + Math.sin(a) * tr); } return; }
  add(g, new THREE.TorusGeometry(tr * 1.09, 0.14, 10, 26), ma, x, th, z, Math.PI / 2);
  if (st === "cone") add(g, new THREE.ConeGeometry(tr * 1.28, 1.15, 26), ma, x, th + 0.64, z);
  else if (st === "ball") add(g, new THREE.SphereGeometry(tr * 1.06, 24, 16), ma, x, th + 0.45, z);
  else if (st === "onion") { const o = add(g, new THREE.SphereGeometry(tr * 1.15, 24, 16), ma, x, th + 0.5, z); o.scale.set(1, 1.05, 1); add(g, new THREE.ConeGeometry(tr * 0.55, 0.9, 20), ma, x, th + 1.25, z); }
  if (S.extras.includes("flag") && (st === "cone" || st === "onion")) { add(g, new THREE.CylinderGeometry(0.03, 0.03, 0.7, 6), mat("tmavomodrá"), x, th + 1.55, z, 0, 0, 0, 0); const f = add(g, rbox(0.5, 0.32, 0.04, 0.02), mat(S.wall2), x + 0.27, th + 1.75, z, 0, 0, 0, 1.08); f.userData.flag = 1; }
}

/* stěna z válců nebo s okny, mezi body (x1,z1)–(x2,z2), výška hW */
function wall(g, x1, z1, x2, z2, hW, rad = 0.22) {
  const len = Math.hypot(x2 - x1, z2 - z1), along = Math.abs(x2 - x1) > Math.abs(z2 - z1), cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
  const T = (y, m, r2 = rad) => (along ? tubeX(g, len, r2, m, cx, y, cz) : tubeZ(g, len, r2, m, cx, y, cz));
  if (S.walls === "mesh") {
    T(0.5 + rad, stripe(0)); T(0.5 + rad * 3, stripe(1));
    T(hW, stripe(0), rad * 1.15);
    const posts = Math.max(2, Math.round(len / 1.4));
    for (let i = 0; i <= posts; i++) { const t = i / posts, px = x1 + (x2 - x1) * t, pz = z1 + (z2 - z1) * t; add(g, tube(hW - 0.5, rad * 0.9), stripe(i), px, 0.5 + (hW - 0.5) / 2, pz); }
    const nm = new THREE.MeshBasicMaterial({ map: netTex.clone(), transparent: true, side: THREE.DoubleSide, depthWrite: false });
    nm.map.repeat.set(len / 0.5, (hW - 0.5 - rad * 4) / 0.5); nm.map.needsUpdate = true;
    const net = new THREE.Mesh(new THREE.PlaneGeometry(len, hW - 0.5 - rad * 4), nm);
    net.position.set(cx, 0.5 + rad * 4 + (hW - 0.5 - rad * 4) / 2 - rad, cz); if (!along) net.rotation.y = Math.PI / 2; g.add(net);
  } else {
    const rows = Math.max(3, Math.round((hW - 0.5) / (rad * 2)));
    const rh = (hW - 0.5) / rows;
    for (let j = 0; j < rows; j++) T(0.5 + rh * (j + 0.5), stripe(j), rh * 0.5);
  }
}

function floorTubes(g, x1, x2, z1, z2, y = 0.58) {
  const W = x2 - x1, n = Math.max(3, Math.round(W / 0.55)), fw = W / n, mf = mat(S.floor);
  for (let i = 0; i < n; i++) tubeZ(g, z2 - z1, fw * 0.46, mf, x1 + fw * (i + 0.5), y, (z1 + z2) / 2);
}

function slideRun(g, x, w, zTop, zBot, yTop, yBot, lanes) {
  const L = Math.hypot(zBot - zTop, yTop - yBot), ang = Math.atan2(yTop - yBot, zBot - zTop), cy = (yTop + yBot) / 2, cz = (zTop + zBot) / 2;
  const lw = w / lanes;
  for (let i = 0; i < lanes; i++) add(g, rbox(lw - 0.08, 0.28, L, 0.12), i % 2 ? mat(S.wall2) : mat(S.acc), x - w / 2 + lw * (i + 0.5), cy, cz, ang);
  for (let i = 1; i < lanes; i++) add(g, tube(L, 0.1), mat(S.wall), x - w / 2 + lw * i, cy + 0.2, cz, Math.PI / 2 + ang);
  [-1, 1].forEach((sd) => { add(g, tube(L, 0.2), stripe(0), x + sd * (w / 2 + 0.12), cy + 0.42, cz, Math.PI / 2 + ang); add(g, tube(L, 0.2), stripe(1), x + sd * (w / 2 + 0.12), cy + 0.84, cz, Math.PI / 2 + ang); });
  /* dopadová zóna */
  add(g, rbox(w + 0.6, 0.5, 1.6, 0.2), mat(S.floor), x, 0.25, zBot + 0.7);
  tubeX(g, w + 0.6, 0.28, mat(S.wall), x, 0.55, zBot + 1.55);
}

function archGate(g, x, z, span, y0) {
  const a = add(g, new THREE.TorusGeometry(span / 2, 0.24, 12, 32, Math.PI), mat(S.acc), x, y0, z);
  a.rotation.set(0, 0, 0);
  add(g, new THREE.TorusGeometry(span / 2 - 0.34, 0.12, 10, 32, Math.PI), mat(S.wall2), x, y0, z + 0.02, 0, 0, 0, 0);
}

function hoop(g, x, y, z) {
  add(g, rbox(1.1, 0.8, 0.12, 0.05), mat("bílá"), x, y, z);
  add(g, new THREE.TorusGeometry(0.28, 0.04, 8, 20), mat("oranžová"), x, y - 0.25, z + 0.3, Math.PI / 2);
}

function animalHead(g, x, y, z) {
  if (S.animal === "none") return;
  const k = S.animal, col = { medved: "hnědá", lev: "žlutá", kocka: "růžová" }[k];
  if (k === "lev") { const mane = add(g, new THREE.TorusGeometry(0.78, 0.36, 12, 28), mat("oranžová"), x, y, z - 0.12); mane.scale.set(1, 1, 0.6); }
  const head = add(g, new THREE.SphereGeometry(0.72, 28, 20), mat(col), x, y, z); head.scale.set(1, 0.95, 0.8);
  if (k === "kocka") [-1, 1].forEach((sd) => add(g, new THREE.ConeGeometry(0.26, 0.5, 4), mat(col), x + sd * 0.42, y + 0.68, z - 0.05, 0, Math.PI / 4, sd * -0.25));
  else if (k === "medved") [-1, 1].forEach((sd) => { add(g, new THREE.SphereGeometry(0.26, 18, 12), mat(col), x + sd * 0.55, y + 0.55, z - 0.05); add(g, new THREE.SphereGeometry(0.14, 14, 10), mat("bílá"), x + sd * 0.55, y + 0.55, z + 0.12, 0, 0, 0, 0); });
  const muz = add(g, new THREE.SphereGeometry(0.34, 20, 14), mat("bílá"), x, y - 0.2, z + 0.48); muz.scale.set(1.15, 0.8, 0.7);
  add(g, new THREE.SphereGeometry(0.1, 12, 10), mat("tmavomodrá"), x, y - 0.1, z + 0.72, 0, 0, 0, 0);
  [-1, 1].forEach((sd) => { add(g, new THREE.SphereGeometry(0.1, 12, 10), mat("tmavomodrá"), x + sd * 0.26, y + 0.16, z + 0.55, 0, 0, 0, 0); add(g, new THREE.SphereGeometry(0.035, 8, 6), mat("bílá"), x + sd * 0.26 + 0.03, y + 0.2, z + 0.64, 0, 0, 0, 0); });
}

/* ---------- stavba podle typu ---------- */
function build() {
  scene.remove(castle);
  castle.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material?.map && o.material !== INK) o.material.map.dispose?.(); });
  const g = (castle = new THREE.Group());
  const W = S.w, D = S.d, H = S.h, T = 0.46, mw = mat(S.wall), ma = mat(S.acc), mf = mat(S.floor);
  let span = Math.max(W, D);
  const towerAt = (pts, th, tr) => { if (S.towers === "0") return; pts.filter((_, i) => S.towers === "4" || i >= pts.length - 2).forEach(([x, z]) => tower(g, x, z, th, tr)); };

  if (S.typ === "hrad" || S.typ === "combo") {
    const laneW = S.typ === "combo" ? 1.15 + 0.7 * +S.lanes : 0;
    const bx1 = -W / 2, bx2 = W / 2 - laneW, sideX = S.side === "left" ? -1 : 1;
    const mirror = (x) => (sideX < 0 ? -x : x);
    const WH = Math.max(1.6, H * 0.52);
    add(g, rbox(W, 0.5, D, 0.22), mw, 0, 0.25, 0);
    floorTubes(g, Math.min(mirror(bx1 + T), mirror(bx2 - T)), Math.max(mirror(bx1 + T), mirror(bx2 - T)), -D / 2 + T, D / 2 - T * 0.6);
    /* stěny: zadní, boční, vnitřní u skluzavky */
    wall(g, mirror(bx1), -D / 2 + T / 2, mirror(bx2), -D / 2 + T / 2, WH);
    wall(g, mirror(bx1 + T / 2), -D / 2, mirror(bx1 + T / 2), D / 2 - 0.25, WH);
    wall(g, mirror(bx2 - T / 2), -D / 2, mirror(bx2 - T / 2), D / 2 - 0.25, WH);
    /* přední trám s nápisem */
    const bw = (bx2 - bx1) - 0.7, beamY = WH + 0.28, bcx = mirror((bx1 + bx2) / 2);
    add(g, rbox(bw, 0.62, 0.5, 0.25), ma, bcx, beamY, D / 2 - T / 2);
    const b = bannerMesh(bw - 0.6, 0.48); b.position.set(bcx, beamY, D / 2 - T / 2 + 0.26); g.add(b);
    if (S.extras.includes("arch")) archGate(g, bcx, D / 2 - T / 2, Math.min(bw, 3), beamY + 0.32);
    animalHead(g, bcx, beamY + 1.05, D / 2 - T / 2 + 0.05);
    if (S.extras.includes("step")) tubeX(g, (bx2 - bx1) * 0.62, 0.3, mf, bcx, 0.3, D / 2 + 0.36);
    /* stříška */
    const roofY = WH + 0.95;
    if (S.roof === "arch") { const rg = new THREE.CylinderGeometry((bx2 - bx1) / 2, (bx2 - bx1) / 2, D - 0.4, 32, 1, false, 0, Math.PI); rg.rotateX(Math.PI / 2); rg.rotateZ(Math.PI / 2); const rf = add(g, rg, stripe(1), bcx, roofY - 0.1, 0); rf.scale.y = 0.42; }
    else if (S.roof === "flat") { add(g, rbox((bx2 - bx1) - 0.1, 0.42, D - 0.3, 0.2), stripe(1), bcx, roofY, 0); }
    /* věže v rozích hracího prostoru */
    const tr = 0.42, th = Math.max(WH + 0.9, H * 0.88);
    towerAt([[mirror(bx1 + tr * 0.5), -D / 2 + tr * 0.5], [mirror(bx2 - tr * 0.5), -D / 2 + tr * 0.5], [mirror(bx1 + tr * 0.5), D / 2 - tr * 0.5], [mirror(bx2 - tr * 0.5), D / 2 - tr * 0.5]], th, tr);
    /* vybavení */
    if (S.extras.includes("hoop")) hoop(g, mirror(bx1 + (bx2 - bx1) * 0.5), WH - 0.2, -D / 2 + T + 0.08);
    if (S.extras.includes("pillars")) [0.33, 0.66].forEach((t, i) => add(g, tube(WH * 0.85, 0.28), stripe(i), mirror(bx1 + (bx2 - bx1) * t), 0.5 + WH * 0.42, -D * 0.08 + (i ? 0.5 : -0.4)));
    /* skluzavka v boku (combo) */
    if (S.typ === "combo") {
      const sx = mirror(bx2 + laneW / 2), sw = laneW - 0.55, zTop = -D / 2 + 1.5, yTop = WH + 0.1;
      add(g, rbox(laneW, yTop, 1.5, 0.2), mw, sx, yTop / 2, -D / 2 + 0.75);
      tubeX(g, laneW, 0.26, ma, sx, yTop + 0.25, -D / 2 + 0.2);
      for (let k = 0; k < 4; k++) add(g, rbox(laneW * 0.7, 0.18, 0.3, 0.08), mat(S.wall2), sx, 0.6 + k * (yTop - 0.6) / 4, -D / 2 - 0.05 - k * 0.02, 0, 0, 0, 0);
      slideRun(g, sx, sw, zTop, D / 2 - 0.3, yTop, 0.55, +S.lanes);
      wall(g, mirror(W / 2 - 0.12), -D / 2, mirror(W / 2 - 0.12), zTop + 0.5, yTop + 0.8, 0.2);
    }
    span = Math.max(W, D + 2);
  } else if (S.typ === "arena") {
    const WH = Math.max(1.1, H * 0.7);
    add(g, rbox(W, 0.45, D, 0.2), mw, 0, 0.22, 0);
    add(g, rbox(W - 2 * T, 0.12, D - 2 * T, 0.05), mf, 0, 0.5, 0, 0, 0, 0, 0);
    [[-W / 2 + T / 2, -D / 2, -W / 2 + T / 2, D / 2], [W / 2 - T / 2, -D / 2, W / 2 - T / 2, D / 2], [-W / 2, -D / 2 + T / 2, W / 2, -D / 2 + T / 2], [-W / 2, D / 2 - T / 2, W / 2, D / 2 - T / 2]].forEach(([a1, b1, a2, b2]) => wall(g, a1, b1, a2, b2, WH, 0.24));
    /* branka + koš */
    const gw = Math.min(2.4, W * 0.4), gz = -D / 2 + T + 0.05;
    [-1, 1].forEach((sd) => add(g, tube(1.3, 0.07), mat("bílá"), sd * gw / 2, 0.5 + 0.65, gz));
    tubeX(g, gw + 0.14, 0.07, mat("bílá"), 0, 0.5 + 1.3, gz);
    const nm = new THREE.MeshBasicMaterial({ map: netTex.clone(), transparent: true, side: THREE.DoubleSide, depthWrite: false }); nm.map.repeat.set(gw / 0.3, 1.3 / 0.3); nm.map.needsUpdate = true;
    const net = new THREE.Mesh(new THREE.PlaneGeometry(gw, 1.3), nm); net.position.set(0, 1.15, gz - 0.02); g.add(net);
    if (S.extras.includes("hoop")) hoop(g, 0, WH + 0.9, D / 2 - T);
    if (S.extras.includes("pillars")) [-0.25, 0.25].forEach((t, i) => add(g, tube(WH, 0.26), stripe(i), t * W, 0.5 + WH / 2, 0.3));
    const b = bannerMesh(Math.min(W - 1.4, 3), 0.42); b.position.set(0, WH + 0.05, D / 2 + 0.02); g.add(b);
    const tr = 0.36;
    towerAt([[-W / 2 + 0.3, -D / 2 + 0.3], [W / 2 - 0.3, -D / 2 + 0.3], [-W / 2 + 0.3, D / 2 - 0.3], [W / 2 - 0.3, D / 2 - 0.3]], WH + 0.6, tr);
    span = Math.max(W, D);
  } else if (S.typ === "skluzavka") {
    const plat = Math.min(2.2, D * 0.24), zTop = -D / 2 + plat, zBot = D / 2 - 1.9, top = H - 0.4;
    add(g, rbox(W, 0.5, D, 0.22), mw, 0, 0.25, 0);
    add(g, rbox(W, top, plat, 0.25), mw, 0, top / 2, -D / 2 + plat / 2);
    /* boční stěny plošiny + horní oblouk */
    [-1, 1].forEach((sd) => { add(g, rbox(0.5, top + 1.3, plat, 0.2), stripe(0), sd * (W / 2 - 0.25), (top + 1.3) / 2, -D / 2 + plat / 2); });
    tubeX(g, W, 0.3, ma, 0, top + 1.3, -D / 2 + 0.2);
    archGate(g, 0, zTop - 0.1, W - 0.8, top + 1.0);
    const b = bannerMesh(Math.min(W - 1.4, 3.6), 0.5); b.position.set(0, top + 1.7, zTop - 0.05); g.add(b);
    animalHead(g, 0, top + 2.75, zTop - 0.2);
    add(g, rbox(Math.min(W - 1.2, 3.8), 0.62, 0.3, 0.2), ma, 0, top + 1.7, zTop - 0.25);
    /* šplhací stěna vzadu */
    for (let k = 0; k < 6; k++) add(g, rbox(W * 0.55, 0.2, 0.32, 0.08), mat(S.wall2), 0, 0.7 + k * (top - 0.7) / 6, -D / 2 - 0.08, 0, 0, 0, 0);
    slideRun(g, 0, W - 1.0, zTop, zBot, top, 0.55, +S.lanes);
    /* velké boční oblouky */
    if (S.extras.includes("arch")) [-1, 1].forEach((sd) => { const a = add(g, new THREE.TorusGeometry(1.1, 0.22, 10, 26, Math.PI), stripe(1), sd * (W / 2 + 0.05), top * 0.62, zTop + 1.2, 0, Math.PI / 2, 0); a.scale.set(1, 1.3, 1); });
    const tr = 0.4;
    towerAt([[-W / 2 + 0.3, -D / 2 + 0.3], [W / 2 - 0.3, -D / 2 + 0.3], [-W / 2 + 0.3, -D / 2 + plat - 0.3], [W / 2 - 0.3, -D / 2 + plat - 0.3]], top + 1.4, tr);
    span = Math.max(W, D) * 1.05;
  } else {
    /* překážková dráha */
    const WH = Math.max(1.4, H * 0.48);
    add(g, rbox(W, 0.5, D, 0.22), mw, 0, 0.25, 0);
    floorTubes(g, -W / 2 + T, W / 2 - T, -D / 2 + T, D / 2 - T);
    wall(g, -W / 2 + T / 2, -D / 2 + 0.2, -W / 2 + T / 2, D / 2 - 0.2, WH);
    wall(g, W / 2 - T / 2, -D / 2 + 0.2, W / 2 - T / 2, D / 2 - 0.2, WH);
    const seg = Math.max(3, Math.floor((D - 2) / 2.2));
    for (let i = 0; i < seg; i++) {
      const z = -D / 2 + 1.4 + i * ((D - 2.8) / Math.max(1, seg - 1)), kind = i % 3;
      if (kind === 0) [-0.35, 0, 0.35].forEach((t, k) => add(g, tube(WH * 0.8, 0.22), stripe(k + i), t * (W - 1.2), 0.5 + WH * 0.4, z));
      else if (kind === 1) { const a = add(g, new THREE.TorusGeometry((W - 1) / 2, 0.3, 12, 28, Math.PI), stripe(i), 0, 0.5, z); a.scale.set(1, 1.15, 1); }
      else { add(g, rbox(W - 1.1, WH * 0.75, 0.55, 0.22), stripe(i + 1), 0, 0.5 + WH * 0.37, z); add(g, rbox(W - 1.2, 0.25, 1.4, 0.1), mat(S.acc), 0, 0.5 + WH * 0.42, z + 0.95, -0.55, 0, 0, 0); }
    }
    { archGate(g, 0, -D / 2 + 0.25, W - 0.3, WH); archGate(g, 0, D / 2 - 0.25, W - 0.3, WH); }
    const b = bannerMesh(Math.min(W - 0.8, 3), 0.42); b.position.set(0, WH + 0.95, D / 2 - 0.1); g.add(b);
    add(g, rbox(Math.min(W - 0.6, 3.2), 0.55, 0.25, 0.2), ma, 0, WH + 0.95, D / 2 - 0.28);
    const tr = 0.38, th = WH + 0.9;
    towerAt([[-W / 2 + 0.3, -D / 2 + 0.3], [W / 2 - 0.3, -D / 2 + 0.3], [-W / 2 + 0.3, D / 2 - 0.3], [W / 2 - 0.3, D / 2 - 0.3]], th, tr);
    span = Math.max(W, D);
  }
  scene.add(g);
  floorShadow.scale.set(span * 1.6, span * 1.6, 1);
  frame(span, H);
  pop = 0;
  price();
}

/* kamera podle velikosti */
let camGoal = null;
function frame(span, H) {
  const d = span * 1.5 + H * (S.typ === "skluzavka" ? 1.45 : 0.9) + 4;
  const dir = cam.position.clone().sub(ctl.target).setY(0).normalize();
  if (dir.lengthSq() < 0.5) dir.set(0.66, 0, 0.75);
  camGoal = { t: new THREE.Vector3(0, H * (S.typ === "skluzavka" ? 0.5 : 0.36), 0), p: new THREE.Vector3(dir.x * d, H * 0.45 + d * 0.38, dir.z * d) };
}

let pop = 1;
const clock = new THREE.Clock();
function loop() {
  const dt = Math.min(0.05, clock.getDelta()), t = clock.elapsedTime;
  if (pop < 1) { pop = Math.min(1, pop + dt / 0.9); const e = 1 - Math.pow(2, -9 * pop) * Math.cos(pop * 13); castle.scale.set(1 + (1 - e) * 0.12, Math.max(0.2, e), 1 + (1 - e) * 0.12); }
  if (camGoal) { ctl.target.lerp(camGoal.t, 0.08); cam.position.lerp(camGoal.p, 0.06); if (cam.position.distanceTo(camGoal.p) < 0.05) camGoal = null; }
  castle.traverse((o) => { if (o.userData.flag) o.rotation.y = Math.sin(t * 3 + o.position.x) * 0.25; });
  ctl.update(); r.render(scene, cam); requestAnimationFrame(loop);
}

/* ---------- cena ---------- */
const kc = (n) => Math.round(n).toLocaleString("cs-CZ") + " Kč";
function price() {
  const a = S.w * S.d, ex = S.extras.length * 2500, tw = { 4: 5000, 2: 2500, 0: 0 }[S.towers];
  let p = { arena: 20000 + a * 950, hrad: 22000 + a * 1150, combo: 30000 + a * 1250 + +S.lanes * 9000, skluzavka: 38000 + a * 950 + (S.h - 4) * 9000 + +S.lanes * 6000, draha: 34000 + a * 950 }[S.typ];
  p += tw + ex + (S.roof !== "none" && /hrad|combo/.test(S.typ) ? 6000 : 0) + (S.walls === "mesh" ? 2500 : 0) + Math.max(0, S.h - 3.5) * 3000;
  p = Math.round(p / 1000) * 1000;
  $("#st-price").textContent = "od " + kc(p);
  if (S.animal !== "none") p += 0; $("#st-dim").textContent = `${TYPE_N[S.typ]} · ${num(S.w)} × ${num(S.d)} × ${num(S.h)} m`;
  return p;
}
const num = (n) => String(n).replace(".", ",");

/* ---------- ovládání ---------- */
function ranges() {
  const R = RANGES[S.typ];
  ["w", "d", "h"].forEach((k) => { const i = $("#" + k); i.min = R[k][0]; i.max = R[k][1]; S[k] = Math.min(R[k][1], Math.max(R[k][0], S[k])); i.value = S[k]; $("#o-" + k).textContent = num(S[k]) + " m"; });
  document.querySelector(".st-panel").dataset.typ = S.typ;
}
["w", "d", "h"].forEach((k) => $("#" + k).addEventListener("input", (e) => { S[k] = +e.target.value; $("#o-" + k).textContent = num(S[k]) + " m"; build(); }));
$$(".sw").forEach((box) => {
  const k = box.dataset.k;
  box.innerHTML = Object.entries(PAL).map(([n, c]) => `<button type="button" title="${n}" aria-label="${n}" data-c="${n}" style="--c:${c}"></button>`).join("");
  box.addEventListener("click", (e) => { const b = e.target.closest("[data-c]"); if (!b) return; S[k] = b.dataset.c; mark(); build(); });
});
$$(".st-seg").forEach((seg) => seg.addEventListener("click", (e) => {
  const b = e.target.closest("[data-v]"); if (!b) return; const k = seg.dataset.k;
  if (k === "extras") { const i = S.extras.indexOf(b.dataset.v); i < 0 ? S.extras.push(b.dataset.v) : S.extras.splice(i, 1); }
  else S[k] = b.dataset.v;
  if (k === "typ") { ranges(); if (S.typ === "skluzavka" && S.lanes === "1") S.lanes = "2"; }
  mark(); build();
}));
$("#st-presets").innerHTML = PRESETS.map((p, i) => `<button type="button" class="st-pre" data-i="${i}"><b>${p.n}</b><small>${TYPE_N[p.p.typ]}</small></button>`).join("");
$("#st-presets").addEventListener("click", (e) => { const b = e.target.closest("[data-i]"); if (!b) return; apply(PRESETS[+b.dataset.i].p); $$(".st-pre").forEach((x) => x.setAttribute("aria-pressed", x === b)); });
$("#st-schemes").innerHTML = SCHEMES.map(([n, c], i) => `<button type="button" class="st-sch" data-i="${i}" title="${n}"><span style="background:linear-gradient(90deg,${PAL[c.wall]} 0 25%,${PAL[c.wall2]} 25% 50%,${PAL[c.acc]} 50% 75%,${PAL[c.floor]} 75%)"></span>${n}</button>`).join("");
$("#st-schemes").addEventListener("click", (e) => { const b = e.target.closest("[data-i]"); if (!b) return; Object.assign(S, SCHEMES[+b.dataset.i][1]); mark(); build(); });
let tt; $("#txt").addEventListener("input", (e) => { S.txt = e.target.value; clearTimeout(tt); tt = setTimeout(build, 250); });
$("#logo").addEventListener("change", (e) => { const f = e.target.files[0]; if (!f) return; const im = new Image(); im.onload = () => { S.logo = im; build(); }; im.src = URL.createObjectURL(f); });
function apply(p) { Object.assign(S, structuredClone({ ...DEF, ...p, logo: null })); S.logo = S.logo || null; ranges(); mark(); build(); }
function mark() {
  $$(".sw").forEach((box) => box.querySelectorAll("[data-c]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.c === S[box.dataset.k])));
  $$(".st-seg").forEach((seg) => seg.querySelectorAll("[data-v]").forEach((b) => b.setAttribute("aria-pressed", seg.dataset.k === "extras" ? S.extras.includes(b.dataset.v) : b.dataset.v === String(S[seg.dataset.k]))));
}
$("#st-rnd").addEventListener("click", () => {
  const pick = (a) => a[Math.floor(Math.random() * a.length)], keys = Object.keys(PAL);
  const typ = pick(["hrad", "combo", "combo", "skluzavka", "draha", "arena"]), R = RANGES[typ], rv = (k) => Math.round((R[k][0] + Math.random() * (R[k][1] - R[k][0])) * 2) / 2;
  const sc = pick(SCHEMES)[1];
  apply({ typ, w: rv("w"), d: rv("d"), h: rv("h"), ...sc, towers: pick(["4", "4", "2", "0"]), tstyle: pick(["cone", "ball", "onion", "crayon", "palm", "flat"]), walls: pick(["tubes", "mesh"]), stripes: pick(["0", "1"]), roof: pick(["none", "arch", "flat"]), side: pick(["left", "right"]), lanes: pick(["1", "2", typ === "skluzavka" ? "3" : "2"]), extras: ["step", ...(Math.random() > 0.5 ? ["arch"] : []), ...(Math.random() > 0.7 ? ["flag"] : [])], animal: pick(["none", "none", "medved", "lev", "kocka"]), txt: S.txt });
  $$(".st-pre").forEach((x) => x.setAttribute("aria-pressed", "false"));
  keys.length;
});
const shot = () => { r.render(scene, cam); return r.domElement.toDataURL("image/jpeg", 0.85); };
$("#st-png").addEventListener("click", () => { const a = document.createElement("a"); a.href = shot(); a.download = "muj-skakaci-hrad.jpg"; a.click(); });
$("#st-send").addEventListener("click", () => {
  const ex = { step: "vstupní schod", arch: "brána s obloukem", hoop: "basketbalový koš", pillars: "překážky uvnitř", flag: "vlajky" };
  const an = { none: "", medved: " · medvídek na čele", lev: " · lev na čele", kocka: " · kočička na čele" }[S.animal];
  const sum = `3D návrh ze studia: ${TYPE_N[S.typ]} ${num(S.w)} × ${num(S.d)} m, výška ${num(S.h)} m · stěny ${S.wall}${S.stripes === "1" ? " + pruhy " + S.wall2 : ""}, věže ${S.acc}, podlaha ${S.floor} · věže: ${S.towers === "0" ? "bez věží" : S.towers + "× " + { cone: "špice", ball: "kulička", onion: "cibule", crayon: "pastelka", palm: "palma", flat: "cimbuří" }[S.tstyle]} · stěny: ${S.walls === "mesh" ? "síťová okna" : "plné"}${/hrad|combo/.test(S.typ) ? " · stříška: " + { none: "žádná", arch: "oblouková", flat: "rovná" }[S.roof] : ""}${/combo|skluzavka/.test(S.typ) ? ` · skluzavka: ${S.lanes} dráh${S.lanes === "1" ? "a" : "y"}${S.typ === "combo" ? (S.side === "left" ? " vlevo" : " vpravo") : ""}` : ""}${S.extras.length ? " · " + S.extras.map((e) => ex[e]).join(", ") : ""} · nápis „${S.txt}“${an}${S.logo ? " · vlastní logo (pošlu e-mailem)" : ""} · orientačně od ${kc(price())}`;
  try {
    const c = document.createElement("canvas"); c.width = 640; c.height = Math.round(640 * r.domElement.height / r.domElement.width);
    const im = new Image(); im.onload = () => { c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); localStorage.setItem("shp-design", JSON.stringify({ sum, img: c.toDataURL("image/jpeg", 0.72) })); location.href = "/kosik.html"; };
    im.src = shot();
  } catch { location.href = "/kosik.html"; }
});

document.fonts?.load('800 60px "Baloo 2"').finally(() => { ranges(); mark(); build(); host.classList.add("ready"); loop(); });
