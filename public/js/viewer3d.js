/* 3D prohlížeč na detailu hradu – načítá se až po kliknutí */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

export async function mount3d(host, url) {
  const canvas = document.createElement("canvas");
  canvas.className = "v3d";
  canvas.setAttribute("aria-label", "3D model hradu – tažením otočíte, kolečkem přiblížíte");
  host.append(canvas);
  const r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  r.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  r.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9fb4cc, 2.4));
  const sun = new THREE.DirectionalLight(0xffffff, 1.5);
  sun.position.set(3, 6, 5);
  scene.add(sun);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.01, 100);

  const g = (await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(url)).scene;
  const b = new THREE.Box3().setFromObject(g), s = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3()), k = 2 / Math.max(s.x, s.y, s.z);
  g.scale.setScalar(k);
  g.position.set(-c.x * k, -b.min.y * k, -c.z * k);
  s.multiplyScalar(k);
  const pivot = new THREE.Group();
  pivot.add(g);
  scene.add(pivot);

  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let yaw = -0.5, pitch = 0.32, zoom = 1, vel = 0, last = null, idle = 0, raf = 0, alive = true;
  const fit = () => { const w = host.clientWidth, h = host.clientHeight; if (w && h) { r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); } };
  const ro = new ResizeObserver(fit);
  ro.observe(host);
  fit();

  canvas.addEventListener("pointerdown", (e) => { last = [e.clientX, e.clientY]; canvas.setPointerCapture(e.pointerId); canvas.classList.add("grab"); idle = 0; });
  canvas.addEventListener("pointermove", (e) => {
    if (!last) return;
    vel = (e.clientX - last[0]) * 0.01; yaw += vel;
    pitch = Math.min(0.95, Math.max(0.02, pitch + (e.clientY - last[1]) * 0.006));
    last = [e.clientX, e.clientY];
  });
  const up = () => { last = null; canvas.classList.remove("grab"); };
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
  canvas.addEventListener("wheel", (e) => { e.preventDefault(); zoom = Math.min(1.6, Math.max(0.6, zoom * (e.deltaY > 0 ? 1.08 : 0.92))); idle = 0; }, { passive: false });

  function loop() {
    if (!alive) return;
    if (!last) { vel *= 0.93; yaw += vel; idle++; if (idle > 120 && !RM) yaw += 0.004; }
    pivot.rotation.y = yaw;
    const tan = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const wide = Math.hypot(s.x, s.z);
    const D = (Math.max((wide * 1.05) / (2 * tan * cam.aspect), (s.y * 1.4) / (2 * tan)) + s.z * 0.3) * zoom;
    cam.position.set(0, s.y * 0.45 + Math.sin(pitch) * D, Math.cos(pitch) * D);
    cam.lookAt(0, s.y * 0.42, 0);
    r.render(scene, cam);
    raf = requestAnimationFrame(loop);
  }
  loop();
  return { destroy() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); r.dispose(); canvas.remove(); } };
}
