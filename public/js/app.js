/* SKÁKACÍ HRADY – app.js (bez build stepu) */
(() => {
  const H = window.HRADY || [];
  const byId = Object.fromEntries(H.map((h) => [h.id, h]));
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const num = (n) => String(n).replace(".", ",");
  const kc = (n) => Math.round(n).toLocaleString("cs-CZ") + " Kč";
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PAGE = document.body.dataset.page;

  const TYP = { hrad: "Skákací hrad", combo: "Hrad se skluzavkou", skluzavka: "Skluzavka", draha: "Překážková dráha", hra: "Interaktivní hra" };
  const TH = {
    klasika: ["Klasika", "var(--sky)"], postavicky: ["Postavičky", "var(--red)"], princezny: ["Princezny", "var(--purple)"],
    zvirata: ["Zvířata a džungle", "var(--green)"], more: ["Moře a piráti", "var(--sky-2)"], pohadky: ["Pohádky", "var(--gold)"],
    sport: ["Sport a hry", "var(--gold-2)"], auta: ["Auta a hasiči", "var(--red)"],
  };
  const FAN = { 0: ["Bez fukaru", 0], 950: ["Fukar 950 W", 7000], 1500: ["Fukar 1500 W", 10000] };
  const MAIL = "agenturamarco@seznam.cz";
  const season = () => { const m = new Date().getMonth(); return m >= 9 || m <= 1; };
  const img = (h, sm = true, orig = false) => `/assets/hrady/${String(h.id).padStart(3, "0")}${h.ph && !orig ? "-studio" : ""}${sm ? "-sm" : ""}.webp`;
  const size = (h) => `${num(h.d)} × ${num(h.w)} m`;
  const I = {
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  };

  /* ---------- košík (poptávka) ---------- */
  const KEY = "shp-cart";
  const cart = {
    get() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } },
    set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} badge(); },
    has(id) { return cart.get().some((i) => i.id === id); },
    add(id, fan = 0) { const c = cart.get().filter((i) => i.id !== id); c.push({ id, fan }); cart.set(c); },
    fan(id, fan) { cart.set(cart.get().map((i) => (i.id === id ? { ...i, fan } : i))); },
    rm(id) { cart.set(cart.get().filter((i) => i.id !== id)); },
  };
  function badge(bump) {
    const n = cart.get().length;
    $$("[data-cart-count]").forEach((b) => (b.textContent = n || ""));
    if (bump) { const c = $(".nav__cart"); c?.classList.remove("bump"); void c?.offsetWidth; c?.classList.add("bump"); }
  }

  /* ---------- karta ---------- */
  const card = (h, lazy = true) => `<article class="card${cart.has(h.id) ? " in-cart" : ""}" data-cur="Detail">
  <div class="card__img"><img src="${img(h)}" alt="${h.n} – ${TYP[h.t].toLowerCase()} č. ${h.id}" width="${h.ph ? 600 : h.iw}" height="${h.ph ? 600 : h.ih}" ${lazy ? 'loading="lazy"' : ""} decoding="async">
  ${h.m3d ? '<span class="card__3d">3D</span>' : ""}<span class="card__dims">${num(h.d)} × ${num(h.w)} × ${num(h.h)} m</span></div>
  <div class="card__body"><h3><a class="card__lnk" href="/hrad.html?id=${h.id}">${h.n}</a></h3>
  <div class="card__foot"><span class="card__price">${kc(h.p)}</span>
  <button class="card__add${cart.has(h.id) ? " done" : ""}" type="button" data-add="${h.id}" aria-label="${cart.has(h.id) ? "V poptávce – otevřít" : "Přidat " + h.n + " do poptávky"}">${cart.has(h.id) ? I.ok + "<span>V poptávce</span>" : I.plus + "<span>Do poptávky</span>"}</button></div></div></article>`;

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-add]");
    if (!b) return;
    e.preventDefault();
    const id = +b.dataset.add;
    if (cart.has(id)) { miniCart(); return; }
    cart.add(id, byId[id]?.fi ? 0 : 0);
    b.classList.add("done"); b.innerHTML = I.ok + "<span>V poptávce</span>"; b.setAttribute("aria-label", "V poptávce – otevřít");
    badge(true);
  });

  /* ---------- kreslený hrad (SVG) ---------- */
  function castle(opts = {}) {
    const tower = (cls, x, y, w, h, cone, ruffle = true) => {
      const cx = x + w / 2, top = y + 6;
      return `<g class="c-tw ${cls}">
      <rect class="o f-sky" x="${x}" y="${y}" width="${w}" height="${h}" rx="${w / 2.2}"/>
      <rect class="o f-gold" x="${x - 3}" y="${y + h * 0.36}" width="${w + 6}" height="16" rx="8"/>
      <rect class="o f-gold" x="${x - 3}" y="${y + h * 0.64}" width="${w + 6}" height="16" rx="8"/>
      <path class="hl" d="M${x + 12} ${y + 30} v${h * 0.22}"/>
      ${ruffle ? `<rect class="o f-gold" x="${x - 8}" y="${y - 8}" width="${w + 16}" height="20" rx="10"/>` : ""}
      <path class="o ${cone}" d="M${x - 10} ${top} Q${cx} ${top - 14} ${x + w + 10} ${top} L${cx + 4} ${y - w * 1.15} Q${cx} ${y - w * 1.24} ${cx - 4} ${y - w * 1.15} Z"/>
      <circle class="o f-gold" cx="${cx}" cy="${y - w * 1.22}" r="7"/></g>`;
    };
    return `<svg class="castle${opts.idle ? " castle--idle" : ""}" viewBox="-20 -40 460 420" aria-hidden="true" focusable="false">
    <ellipse class="c-sh f-ink" cx="210" cy="352" rx="178" ry="14" opacity=".14"/>
    ${opts.fan ? `<g class="c-fan"><path class="o" d="M-4 330 C 20 300, 30 318, 58 306" fill="none" stroke-width="10"/><path d="M-4 330 C 20 300, 30 318, 58 306" fill="none" stroke="var(--sky-2)" stroke-width="5" stroke-linecap="round"/>
      <rect class="o f-red" x="-26" y="316" width="46" height="36" rx="10"/><circle class="o f-card" cx="-3" cy="334" r="10"/><path class="c-blade o" d="M-3 326 v16 M-11 334 h16" fill="none"/></g>` : ""}
    <g class="c-body">
      ${tower("tb1", 92, 92, 40, 170, "f-pur", false)}
      ${tower("tb2", 288, 92, 40, 170, "f-red", false)}
      <g class="c-wall"><rect class="o f-sky2" x="100" y="120" width="220" height="150" rx="20"/>
        <path class="o" d="M150 134v124M200 134v124M250 134v124M290 134v124" fill="none" stroke-width="3"/></g>
      <rect class="o f-gold2" x="104" y="236" width="212" height="44" rx="16"/>
      <path class="o" d="M130 244v30M170 244v30M210 244v30M250 244v30M290 244v30" fill="none" stroke-width="3"/>
      <rect class="o f-sky" x="50" y="270" width="320" height="58" rx="24"/>
      <path class="hl" d="M78 286h110"/>
      <g class="c-beam"><rect class="o f-gold" x="72" y="104" width="276" height="44" rx="22"/>
        <path class="hl" d="M96 116h60"/>
        <text x="210" y="134" text-anchor="middle" font-size="21" class="f-ink" letter-spacing=".5">SKÁKACÍ HRADY</text></g>
      ${tower("tf1", 40, 110, 62, 214, "f-red")}
      ${tower("tf2", 318, 110, 62, 214, "f-pur")}
      <g class="c-flagw"><path class="o" d="M349 30 V-36" fill="none"/><path class="c-flag o f-red" d="M349 -36 q24 -6 40 4 q-16 10 -40 14 z"/></g>
      <rect class="o f-gold" x="98" y="296" width="224" height="42" rx="21"/>
      <path class="hl" d="M120 308h80"/>
    </g></svg>`;
  }

  /* ---------- sdílené ---------- */
  function reveal() {
    const els = $$(".rv");
    if (RM || !("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    els.forEach((e) => io.observe(e));
  }
  function cursor() {
    if (!matchMedia("(hover:hover) and (pointer:fine)").matches || RM) return;
    const c = document.createElement("div"); c.className = "cur"; c.setAttribute("aria-hidden", "true"); document.body.append(c);
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY; const t = e.target.closest("[data-cur]"); c.classList.toggle("big", !!t); c.textContent = t ? t.dataset.cur : ""; }, { passive: true });
    document.documentElement.classList.add("has-cur");
    document.addEventListener("mouseleave", () => c.classList.add("out")); document.addEventListener("mouseenter", () => c.classList.remove("out"));
    (function loop() { cx += (x - cx) * 0.5; cy += (y - cy) * 0.5; c.style.transform = `translate(${cx}px,${cy}px)`; requestAnimationFrame(loop); })();
  }
  function navState() {
    const n = $("#nav"); if (!n) return;
    const f = () => n.classList.toggle("is-scrolled", scrollY > 12); f(); addEventListener("scroll", f, { passive: true });
  }
  /* gumová tečková mřížka reagující na kurzor (klik = vlna); host = lokálně v sekci */
  const FINE = matchMedia("(hover:hover) and (pointer:fine)").matches;
  function dotsBg(host) {
    if (RM || !FINE) return;
    const c = document.createElement("canvas"); c.className = host ? "dots dots--local" : "dots"; c.setAttribute("aria-hidden", "true");
    host ? host.prepend(c) : (document.body.prepend(c), document.documentElement.classList.add("has-dots"));
    const x = c.getContext("2d"), GAP = 26, R = 150, cs = getComputedStyle(document.documentElement); let off = 0;
    const C = { base: cs.getPropertyValue("--sky").trim(), hot: cs.getPropertyValue("--gold").trim(), ink: cs.getPropertyValue("--ink").trim() };
    let W = 0, H = 0, D = [], mx = -999, my = -999, raf = 0, active = 0, waves = [];
    const rect = () => (host ? host.getBoundingClientRect() : { left: 0, top: 0, width: W });
    function build() {
      const dpr = Math.min(devicePixelRatio || 1, 2); W = host ? host.offsetWidth : innerWidth; H = host ? host.offsetHeight : innerHeight + GAP;
      c.width = W * dpr; c.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); D = [];
      for (let yy = GAP / 2; yy < H + GAP; yy += GAP) for (let xx = GAP / 2; xx < W + GAP; xx += GAP) D.push({ ox: xx, oy: yy, x: xx, y: yy, vx: 0, vy: 0, h: 0 });
      draw();
    }
    function draw() {
      x.clearRect(0, 0, W, H);
      for (const d of D) {
        x.globalAlpha = 0.42 + d.h * 0.58; x.fillStyle = d.h > 0.35 ? C.hot : C.base;
        x.beginPath(); x.arc(d.x, d.y, 1.3 + d.h * 3.4, 0, 6.2832); x.fill();
        if (d.h > 0.35) { x.lineWidth = 1.4; x.strokeStyle = C.ink; x.stroke(); }
      }
      x.globalAlpha = 1;
    }
    function step() {
      raf = 0; let moving = false;
      for (const d of D) {
        const oy = d.oy; let tx = d.ox, ty = oy, heat = 0;
        const dx = d.x - mx, dy = d.y - my, dist = Math.hypot(dx, dy);
        if (dist < R) { const f = 1 - dist / R, push = f * f * 28; tx += (dx / (dist || 1)) * push; ty += (dy / (dist || 1)) * push; heat = f; }
        for (const w of waves) { const wx = d.ox - w.x, wy = oy - w.y, wd = Math.hypot(wx, wy), band = Math.abs(wd - w.r); if (band < 40) { const f = (1 - band / 40) * w.a; tx += (wx / (wd || 1)) * f * 22; ty += (wy / (wd || 1)) * f * 22; heat = Math.max(heat, f); } }
        d.vx = (d.vx + (tx - d.x) * 0.14) * 0.8; d.vy = (d.vy + (ty - d.y) * 0.14) * 0.8; d.x += d.vx; d.y += d.vy; d.h += (heat - d.h) * 0.2;
        if (Math.abs(d.vx) + Math.abs(d.vy) > 0.02 || d.h > 0.01) moving = true;
      }
      waves = waves.filter((w) => ((w.r += 9), (w.a *= 0.965), w.a > 0.03));
      draw();
      if (moving || waves.length || active-- > 0) raf = requestAnimationFrame(step);
    }
    const kick = () => { active = 20; if (!raf) raf = requestAnimationFrame(step); };
    const pos = (e) => { const r = rect(), k = host && r.width ? W / r.width : 1; return [(e.clientX - r.left) * k, (e.clientY - r.top) * k + (host ? 0 : off)]; };
    addEventListener("pointermove", (e) => { [mx, my] = pos(e); kick(); }, { passive: true });
    addEventListener("pointerdown", (e) => { const [px, py] = pos(e); if (px >= 0 && py >= 0 && px <= W && py <= H) { waves.push({ x: px, y: py, r: 0, a: 1 }); kick(); } }, { passive: true });
    
    host ? new ResizeObserver(() => { build(); kick(); }).observe(host) : addEventListener("resize", () => { build(); kick(); });
    document.addEventListener("mouseleave", () => { mx = my = -999; kick(); });
    build();
  }

  /* žluté slunce: střed paprsků plynule sleduje kurzor */
  function sun(sec) {
    if (!sec || RM || !FINE) return;
    let tx = 72, ty = 28, x = tx, y = ty, raf = 0;
    const step = () => { x += (tx - x) * 0.07; y += (ty - y) * 0.07; sec.style.setProperty("--gx", x.toFixed(2) + "%"); sec.style.setProperty("--gy", y.toFixed(2) + "%"); raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.05 ? requestAnimationFrame(step) : 0; };
    sec.addEventListener("pointermove", (e) => { const r = sec.getBoundingClientRect(); tx = ((e.clientX - r.left) / r.width) * 100; ty = ((e.clientY - r.top) / r.height) * 100; if (!raf) raf = requestAnimationFrame(step); });
  }

  /* témata: jeden hrad uprostřed, po kliknutí gumově vystřelí ostatní */
  const THEME_PIC = { klasika: 17, postavicky: 54, princezny: 90, zvirata: 9, more: 57, pohadky: 102, sport: 61, auta: 34 };
  function burst() {
    const b = $("#burst"); if (!b) return;
    const ul = $("#burst-items"), core = $(".burst__core", b);
    const T = Object.entries(TH).filter(([k]) => H.some((h) => h.th === k));
    ul.innerHTML = T.map(([k, [n, c]], i) => `<li><a class="bub" href="/katalog.html?th=${k}" style="--c:${c};--d:${(i * 0.055).toFixed(3)}s;--f:${(-i * 0.4).toFixed(1)}s" tabindex="-1"><span class="bal"><span class="bal__body"><img src="${img(byId[THEME_PIC[k]])}" alt="" width="122" height="139" loading="lazy"></span><i>${H.filter((h) => h.th === k).length}</i><span class="bal__knot"></span><svg class="bal__str" viewBox="0 0 20 34" aria-hidden="true"><path d="M10 0 C 5 9, 15 20, 10 34" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><animate attributeName="d" dur="${(2.2 + (i % 3) * 0.35).toFixed(2)}s" begin="-${(i * 0.3).toFixed(1)}s" repeatCount="indefinite" values="M10 0 C 5 9, 15 20, 10 34;M10 0 C 15 10, 5 22, 13 34;M10 0 C 6 8, 16 21, 8 34;M10 0 C 5 9, 15 20, 10 34"/></path></svg><b>${n}</b></span></a></li>`).join("");
    const place = () => {
      const row = !!b.closest(".themes-anim"), w = b.offsetWidth, hh = b.offsetHeight, n = T.length;
      if (row && w < 640) {
        const gap = (w * 0.94) / 4, sz = Math.min(86, gap * 0.82);
        $$(".bub", ul).forEach((a, i) => { const r2 = i < n / 2 ? 0 : 1, c = i % (n / 2); a.style.setProperty("--x", Math.round((c - 1.5) * gap) + "px"); a.style.setProperty("--y", Math.round((r2 ? 1 : -1) * Math.min(hh * 0.27, 150) + (c % 2 ? 8 : -6)) + "px"); a.style.setProperty("--s", Math.round(sz) + "px"); a.style.setProperty("--lw", Math.round(gap - 4) + "px"); });
        return;
      }
      if (row) {
        /* rozkliknuté balónky v jedné řadě, střídavě o pár px výš/níž, uprostřed místo pro „Zavřít“ */
        const gap = Math.min((w * 0.94) / (n + 1), 200), sz = Math.min(122, gap * 0.82);
        $$(".bub", ul).forEach((a, i) => { const slot = i < n / 2 ? i - n / 2 : i - n / 2 + 1; a.style.setProperty("--x", Math.round(slot * gap) + "px"); a.style.setProperty("--y", (i % 2 ? -12 : 6) + "px"); a.style.setProperty("--s", Math.round(sz) + "px"); a.style.setProperty("--lw", Math.round(gap - 8) + "px"); });
        return;
      }
      const rx = Math.min(w * 0.42, 460), ry = Math.min(hh * 0.33, 250);
      $$(".bub", ul).forEach((a, i) => { const ang = -Math.PI / 2 + (i / n) * Math.PI * 2; a.style.setProperty("--x", (Math.cos(ang) * rx).toFixed(0) + "px"); a.style.setProperty("--y", (Math.sin(ang) * ry).toFixed(0) + "px"); });
    };
    place(); new ResizeObserver(place).observe(b); addEventListener("burst-place", place);
    core.addEventListener("click", () => {
      const open = !b.classList.contains("open");
      b.classList.remove("closing");
      if (open) { b.classList.add("open"); dispatchEvent(new Event("burst-open")); } else { b.classList.remove("open"); b.classList.add("closing"); setTimeout(() => { b.classList.remove("closing"); dispatchEvent(new Event("burst-close")); }, 340); }
      core.setAttribute("aria-expanded", open); $(".core__ball b", core).textContent = open ? "Zavřít" : "Vyber svět";
      $$(".bub", ul).forEach((a) => (a.tabIndex = open ? 0 : -1));
    });
  }

  /* účtenka: tisk podle průběhu 0–1 */
  function receipt() {
    const rc = $(".rc"); if (!rc) return null;
    const lines = $$(".rc__lines li", rc), pr = $(".printer"), sec = $(".receipt");
    let last = -1, tmo = 0;
    return (p) => {
      const feed = Math.min(1, p / 0.82);
      rc.style.setProperty("--p", feed.toFixed(4));
      sec.style.setProperty("--feed", (p * 2400).toFixed(0) + "px");
      lines.forEach((li, i) => li.classList.toggle("on", feed > 0.12 + (i / lines.length) * 0.82));
      rc.classList.toggle("stamped", p > 0.9);
      if (Math.abs(p - last) > 0.002 && p < 0.86) { pr.classList.add("printing"); clearTimeout(tmo); tmo = setTimeout(() => pr.classList.remove("printing"), 180); }
      last = p;
    };
  }

  function seasonal() { $$("[data-season]").forEach((e) => (e.hidden = !season())); }

  /* ---------- ÚVOD ---------- */
  const FEATURED = [34, 17, 111, 8, 54, 105, 81, 57, 64, 90, 70, 21];
  /* mraky: 10 ks, zleva zvenku doprava ven, každý jiná výška, rychlost a vlnka */
  function clouds() {
    const hero = $(".hero"); if (!hero || RM) return;
    const P = '<path d="M22 50a16 16 0 0 1 2-32 22 22 0 0 1 40-6 18 18 0 0 1 32 10 14 14 0 0 1 2 28z"/>';
    const r = (a, b) => a + Math.random() * (b - a);
    hero.insertAdjacentHTML("afterbegin", Array.from({ length: 10 }, (_, i) => {
      const t = r(22, 40), y0 = r(-2, 90), rev = i % 2 ? ";--dir:reverse" : "";
      return `<svg class="cloud cloud--fly" viewBox="0 0 120 60" aria-hidden="true" style="--w:${Math.round(r(48, 130))}px;top:${y0.toFixed(1)}%;--t:${t.toFixed(1)}s;--o:${(Math.floor(i / 2) * 0.7 + r(0, 0.6)).toFixed(1)}s;--ym:${Math.round(r(-40, 40))}px;--y1:${Math.round(r(-30, 30))}px;opacity:${r(0.75, 1).toFixed(2)}${rev}">${P}</svg>`;
    }).join(""));
  }

  /* čáry mezi sekcemi + páska: přesně doprostřed mezery (měří se obsah, ne prázdné boxy) */
  function spacers() {
    const pairs = [
    ];
    const tape = () => { const el = $(".tape"), A = $(".hero__grid"), B = $(".story .eyebrow"); if (!el || el.hidden || !A || !B) return; el.style.translate = "0 0"; const t = el.getBoundingClientRect(), up = t.top - A.getBoundingClientRect().bottom, dn = B.getBoundingClientRect().top - t.bottom; el.style.translate = `0 ${Math.round((dn - up) / 2)}px`; };
    const run = () => { tape(); pairs.forEach((p, k) => {
      const A = $(p.a), B = $(p.b), Ab = $(p.abox), Bb = $(p.bbox), X = $(p.x); if (!A || !B || !Ab || !Bb || !X) return;
      let dv = X.querySelector(`:scope > .dv[data-k="${k}"]`); if (!dv) { dv = document.createElement("span"); dv.className = "dv"; dv.dataset.k = k; dv.setAttribute("aria-hidden", "true"); X.append(dv); }
      const above = Ab.getBoundingClientRect().bottom - A.getBoundingClientRect().bottom, below = B.getBoundingClientRect().top - Bb.getBoundingClientRect().top, off = Math.round((below - above) / 2) + (p.extra || 0);
      dv.style.top = (p.mode === "bottom" ? X.offsetHeight + off : off) + "px";
    }); };
    run(); addEventListener("resize", run); addEventListener("load", run); window.ScrollTrigger?.addEventListener("refresh", run);
  }

  const themesTL = (core, hint, pill, txt) => window.gsap.timeline({ paused: true })
        .to(txt, { opacity: 0, y: -16, duration: 0.1, ease: "power1.in" }, 0)
        .fromTo(core, { y: "52vh", x: 0, rotation: 0 }, { keyframes: { y: ["52vh", "37vh", "23vh", "11vh", "3vh", "-1vh", "0vh"], x: [0, -42, 30, -20, 10, -3, 0], rotation: [0, -10, 7, -5, 3, -1, 0], easeEach: "sine.inOut" }, duration: 0.82 }, 0)
        .to(pill, { y: 6, duration: 0.2, ease: "power2.out" }, 0.55)
        .fromTo(hint, { opacity: 0 }, { opacity: 1, duration: 0.08 }, 0.86)
        .to(core, { keyframes: { y: ["0vh", "-18vh", "-40vh", "-65vh", "-95vh"], x: [0, 28, -22, 18, -10], rotation: [0, 7, -6, 5, -3], easeEach: "sine.inOut" }, duration: 1, ease: "power1.in" }, 1)
        .to(hint, { opacity: 0, duration: 0.15 }, 1)
        .to(pill, { y: 0, duration: 0.25 }, 1.5)
        .to(txt, { opacity: 1, y: 0, duration: 0.3, stagger: 0.05 }, 1.6)
        .to(core, { opacity: 0, duration: 0.2 }, 1.8);

  function home() {
    $$("[data-castle]").forEach((el) => (el.innerHTML = castle({ idle: el.dataset.castle === "idle", fan: el.dataset.castle === "story" })));
    const track = $("#rail-track");
    if (track) track.innerHTML = FEATURED.slice(0, 6).filter((i) => byId[i]).map((i) => card(byId[i])).join("") +
      `<div class="rail__end"><div><p>Dalších ${H.length - 6} modelů v katalogu</p><a class="btn" href="/katalog.html">Celý katalog ${I.arrow}</a></div></div>`;
    burst(); sun($("#nejzadanejsi")); clouds(); setTimeout(spacers, 400); 
    const printAt = receipt();
    bindForm(() => { const a = $("[data-ask-cart]"); if (a) a.hidden = true; });
    const ask = $("[data-ask-cart]"), inC = cart.get().filter((i) => byId[i.id]);
    if (ask && inC.length) { ask.hidden = false; ask.innerHTML = `<span class="ask__lbl">V poptávce</span><span class="ask__items">${inC.map((i) => `<a class="ask__it" href="/hrad.html?id=${i.id}"><img src="${img(byId[i.id])}" alt="" width="44" height="44" loading="lazy"><span>${byId[i.id].n}</span></a>`).join("")}</span><a class="ask__edit" href="/kosik.html">Upravit</a>`; }
    setTimeout(() => { if (!window.__3d) $$(".hero__art, .story__art").forEach((e) => e.classList.add("no3d")); }, 6000);
    const cnt = $("[data-count]"); if (cnt) cnt.textContent = H.length;
    const minP = $("[data-min-price]"); if (minP) minP.textContent = kc(Math.min(...H.map((h) => h.p)));

    const g = window.gsap, ST = window.ScrollTrigger;
    const steps = $$(".story__steps li");
    if (!g || !ST || RM) { steps.forEach((s) => s.classList.add("on")); $("#rail")?.classList.add("rail--native"); printAt?.(1); window.__customP = 1; return; }
    g.registerPlugin(ST);
    if (window.Lenis) {
      const l = (window.__lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true }));
      document.documentElement.classList.add("lenis", "lenis-smooth");
      l.on("scroll", ST.update); g.ticker.add((t) => l.raf(t * 1000)); g.ticker.lagSmoothing(0);
      document.addEventListener("click", (e) => { const a = e.target.closest('a[href^="#"], a[href^="/#"]'); if (!a) return; const id = a.getAttribute("href").split("#")[1]; const t = id && document.getElementById(id); if (t) { e.preventDefault(); window.__skipLock = true; l.scrollTo(t, { offset: -70, duration: 1.4, onComplete: () => setTimeout(() => (window.__skipLock = false), 120) }); } });
      if (location.hash) { const t = document.getElementById(location.hash.slice(1)); if (t) setTimeout(() => { window.__skipLock = true; ST.refresh(); l.scrollTo(t, { offset: -70, immediate: true, force: true }); setTimeout(() => (window.__skipLock = false), 400); }, 700); }
    }

    /* hero intro: slova vyskočí, hrad dopadne */
    g.timeline()
      .from(".hero__logo .hl1, .hero__logo .hl2", { y: -160, scaleY: 1.35, scaleX: 0.8, opacity: 0, transformOrigin: "50% 100%", duration: 1.3, ease: "elastic.out(1, 0.4)", stagger: 0.16 })
      .from(".hero__lede, .hero__cta, .hero__facts li", { y: 24, opacity: 0, duration: 0.6, stagger: 0.05, ease: "back.out(1.8)" }, "-=.8");

    /* příběh: hrad se nafukuje se scrollem */
    const mm = g.matchMedia();
    const sc = $(".story .castle");
    if (sc) {
      const q = (s) => sc.querySelector(s);
      const body = q(".c-body"), tws = [q(".tb1"), q(".tb2"), q(".tf1"), q(".tf2")], beam = q(".c-beam"), flag = q(".c-flagw"), blade = q(".c-blade");
      const gauge = $(".story__gauge i");
      g.set(body, { scaleX: 1.22, scaleY: 0.14 });
      g.set(tws, { scaleY: 0.12, rotation: (i) => [-18, 16, -34, 30][i] });
      g.set(beam, { y: 110, rotation: -6, transformOrigin: "50% 50%" });
      g.set(flag, { scale: 0, transformOrigin: "0% 100%" });
      const tl = g.timeline({ defaults: { ease: "none" } })
        .to(blade, { rotation: 1440, transformOrigin: "50% 50%", duration: 1 }, 0)
        .to(body, { scaleX: 1.08, scaleY: 0.5, duration: 0.3 }, 0)
        .to(tws.slice(0, 2), { scaleY: 1, rotation: 0, duration: 0.3, stagger: 0.06 }, 0.18)
        .to(body, { scaleX: 1, scaleY: 1, duration: 0.3 }, 0.34)
        .to(tws.slice(2), { scaleY: 1, rotation: 0, duration: 0.28, stagger: 0.06, ease: "back.out(2)" }, 0.4)
        .to(beam, { y: 0, rotation: 0, duration: 0.2, ease: "back.out(2.4)" }, 0.66)
        .to(flag, { scale: 1, duration: 0.12, ease: "back.out(3)" }, 0.84)
        .to(body, { scaleY: 1.05, scaleX: 0.97, duration: 0.05 }, 0.9).to(body, { scaleY: 1, scaleX: 1, duration: 0.05 }, 0.95);
      mm.add("(min-width: 861px)", () => {
        const card = $(".story__card"), secS = $(".story");
        const qsx = g.quickTo(card, "scaleX", { duration: 0.9, ease: "power3" }), qsy = g.quickTo(card, "scaleY", { duration: 0.9, ease: "power3" }), qs = (v) => { qsx(v); qsy(v); }, qy = g.quickTo(card, "yPercent", { duration: 0.9, ease: "power3" }), qk = g.quickTo(secS, "--k", { duration: 0.9, ease: "power3" });
        const depth = (p) => { const k = p < 0.12 ? p / 0.12 : p > 0.86 ? (1 - p) / 0.14 : 1, e = k * k * (3 - 2 * k); qs(1 - 0.12 * e); qk(e); };
        ST.create({ trigger: ".story__pin", start: "top top", end: "+=320%", pin: true, scrub: 0.6, animation: tl,
          onUpdate: (s) => { depth(s.progress); secS.style.setProperty("--sfeed", (s.progress * 1800).toFixed(0) + "px"); dispatchEvent(new CustomEvent("story", { detail: s.progress })); const i = Math.min(steps.length - 1, Math.floor(s.progress * steps.length)); steps.forEach((li, k) => li.classList.toggle("on", k <= i)); if (gauge) gauge.textContent = Math.round(s.progress * 100) + " %"; } });
      });
      mm.add("(max-width: 860px)", () => {
        const card = $(".story__card"), secS = $(".story"), ol = $(".story__steps");
        $(".story").classList.add("story--m");
        const qsx = g.quickTo(card, "scaleX", { duration: 0.9, ease: "power3" }), qsy = g.quickTo(card, "scaleY", { duration: 0.9, ease: "power3" }), qk = g.quickTo(secS, "--k", { duration: 0.9, ease: "power3" });
        const depth = (p) => { const k = p < 0.1 ? p / 0.1 : p > 0.9 ? (1 - p) / 0.1 : 1, e = k * k * (3 - 2 * k); qsx(1 - 0.08 * e); qsy(1 - 0.08 * e); qk(e); };
        const dist = () => Math.max(0, ol.scrollWidth - $(".story__card").clientWidth + 40);
        const qx = g.quickTo(ol, "x", { duration: 0.5, ease: "power3" });
        const st = ST.create({ trigger: ".story__pin", start: "top top", end: "+=260%", pin: true, scrub: 0.6, animation: tl, invalidateOnRefresh: true,
          onUpdate: (s) => { const p = s.progress; depth(p); secS.style.setProperty("--sfeed", (p * 1400).toFixed(0) + "px"); dispatchEvent(new CustomEvent("story", { detail: p }));
            const t = g.utils.clamp(0, 1, (p - 0.08) / 0.82), i = Math.min(steps.length - 1, Math.floor(t * steps.length * 0.999)); steps.forEach((li, k) => li.classList.toggle("on", k <= i)); qx(-dist() * t); if (gauge) gauge.textContent = Math.round(p * 100) + " %"; } });
        return () => { st.kill(); $(".story").classList.remove("story--m"); g.set(ol, { clearProps: "x" }); };
      });
    }

    /* carousel: horizontální jízda + prohnutí podle rychlosti */
    const rail = $("#rail");
    mm.add("(min-width: 900px)", () => {
      const dist = () => track.scrollWidth - rail.clientWidth + 8;
      const skew = g.quickTo(".rail__track .card", "skewX", { duration: 0.5, ease: "power3" });
      const tw = g.to(track, { x: () => -dist(), ease: "none",
        scrollTrigger: { trigger: "#nejzadanejsi", start: "center center", end: () => "+=" + dist(), pin: true, scrub: 0.5, invalidateOnRefresh: true,
          onUpdate: (s) => skew(g.utils.clamp(-9, 9, s.getVelocity() / -260)) } });
      return () => tw.kill();
    });
    mm.add("(max-width: 899px)", () => { rail.classList.add("rail--native"); return () => rail.classList.remove("rail--native"); });

    /* témata a cenovka */
    /* témata (desktop): skutečné zamčení CELÉ stránky (nic se nehýbe, ani žlutý pruh nahoře).
       Kolečko/trackpad během zámku pohání balónek; po doletu se stránka odemkne. Nahoru stejně pozpátku. */
    mm.add("(min-width: 861px)", () => {
      const sec = $("#temata"), core = $(".burst__core"), hint = $(".burst__hint"); if (!sec || !core) return;
      sec.classList.add("themes-anim");
      g.set(core, { xPercent: -50, yPercent: -50 });
      const txt = $$("#temata .sec__head h2, #temata .sec__head p"), pill = $("#temata .eyebrow");
      let cyN = 200, open = false, locked = false, prog = 0, pOut = 0, last = scrollY;
      const setCY = () => { const r = sec.getBoundingClientRect(), a = txt[0].getBoundingClientRect(), b = txt[txt.length - 1].getBoundingClientRect(); cyN = Math.round((a.top + b.bottom) / 2 - r.top); sec.style.setProperty("--cy", cyN + "px"); dispatchEvent(new Event("burst-place")); };
      setCY();
      const lockY = () => Math.round(sec.getBoundingClientRect().top + scrollY - innerHeight * 0.336);
      const M = themesTL(core, hint, pill, txt);
      M.time(0);
      const apply = () => { if (!open) g.to(M, { time: Math.min(prog, 1) + (prog >= 1 ? pOut : 0), duration: 0.5, ease: "power2.out", overwrite: true }); };
      const L = () => window.__lenis;
      const stopPage = () => { L() ? L().stop() : (document.documentElement.style.overflow = "hidden"); };
      const startPage = () => { L() ? L().start() : (document.documentElement.style.overflow = ""); };
      const lock = () => { locked = true; const y = lockY(); L() ? L().scrollTo(y, { immediate: true, force: true }) : scrollTo(0, y); stopPage(); };
      const unlock = () => { locked = false; startPage(); };
      const drive = (dy) => {
        prog = Math.min(1, Math.max(0, prog + dy / 850)); apply();
        if ((prog >= 1 && dy > 0) || (prog <= 0 && dy < 0)) unlock();
      };
      const onWheel = (e) => { if (!locked) return; e.preventDefault(); drive(e.deltaY * (e.deltaMode === 1 ? 32 : 1)); };
      const onKey = (e) => { if (!locked) return; const k = { ArrowDown: 120, PageDown: 400, " ": 400, ArrowUp: -120, PageUp: -400 }[e.key]; if (k) { e.preventDefault(); drive(k); } };
      addEventListener("wheel", onWheel, { passive: false }); addEventListener("keydown", onKey);
      /* hlídání průjezdu bodem zámku */
      const onScroll = () => {
        if (window.__skipLock) { last = scrollY; return; }
        const y = scrollY, ly = lockY();
        if (!locked && !open) {
          if (last < ly && y >= ly && prog < 1) lock();
          else if (last > ly && y <= ly && prog > 0) lock();
        }
        last = y;
      };
      addEventListener("scroll", onScroll, { passive: true });
      const s2 = ST.create({ trigger: sec, start: () => lockY(), end: () => lockY() + innerHeight * 0.55, onUpdate: (s) => { pOut = s.progress; apply(); }, onRefreshInit: setCY });
      const onOpen = () => { open = true; if (locked) unlock(); }, onClose = () => { open = false; apply(); };
      addEventListener("burst-open", onOpen); addEventListener("burst-close", onClose);
      return () => { if (locked) unlock(); s2.kill(); M.kill(); removeEventListener("wheel", onWheel); removeEventListener("keydown", onKey); removeEventListener("scroll", onScroll); sec.classList.remove("themes-anim"); sec.style.removeProperty("--cy"); removeEventListener("burst-open", onOpen); removeEventListener("burst-close", onClose); g.set([core, hint, pill, ...txt], { clearProps: "all" }); };
    });

    mm.add("(max-width: 860px)", () => {
      const sec = $("#temata"), core = $(".burst__core"), hint = $(".burst__hint"), pill = $("#temata .eyebrow"); if (!sec || !core) return;
      sec.classList.add("themes-anim", "themes-m");
      g.set(core, { xPercent: -50, yPercent: -50 });
      const txt = $$("#temata .sec__head h2, #temata .sec__head p");
      const setCY = () => { const r = sec.getBoundingClientRect(), a = txt[0].getBoundingClientRect(), b = txt[txt.length - 1].getBoundingClientRect(); sec.style.setProperty("--cy", Math.round((a.top + b.bottom) / 2 - r.top) + "px"); dispatchEvent(new Event("burst-place")); };
      setCY();
      const M = themesTL(core, hint, pill, txt); M.time(0);
      let open = false, pIn = 0, pOut = 0;
      const apply = () => { if (!open) g.to(M, { time: pIn + (pIn >= 0.999 ? pOut : 0), duration: 0.45, ease: "power2.out", overwrite: true }); };
      const s1 = ST.create({ trigger: sec, start: "center center", end: "+=110%", pin: true, scrub: true, onRefreshInit: setCY, onUpdate: (s) => { pIn = s.progress; apply(); } });
      const s2 = ST.create({ trigger: sec, start: () => s1.end, end: () => s1.end + innerHeight * 0.45, onUpdate: (s) => { pOut = s.progress; apply(); } });
      const onOpen = () => (open = true), onClose = () => { open = false; apply(); };
      addEventListener("burst-open", onOpen); addEventListener("burst-close", onClose);
      return () => { s1.kill(); s2.kill(); M.kill(); sec.classList.remove("themes-anim", "themes-m"); sec.style.removeProperty("--cy"); removeEventListener("burst-open", onOpen); removeEventListener("burst-close", onClose); g.set([core, hint, pill, ...txt], { clearProps: "all" }); };
    });

    /* účtenka: zamknout scroll a tisknout; karta se oddálí jako u nafukování */
    if (printAt) {
      mm.add("(min-width: 861px)", () => {
        const card = $(".receipt__card"), secR = $(".receipt");
        const qx = g.quickTo(card, "scaleX", { duration: 0.9, ease: "power3" }), qy2 = g.quickTo(card, "scaleY", { duration: 0.9, ease: "power3" }), qk = g.quickTo(secR, "--k", { duration: 0.9, ease: "power3" });
        ST.create({ trigger: ".receipt__pin", start: "top top", end: "+=200%", pin: true, scrub: 0.4, onToggle: (t) => document.documentElement.classList.toggle("rpin", t.isActive),
          onUpdate: (s) => { const p = s.progress, k = p < 0.1 ? p / 0.1 : p > 0.9 ? (1 - p) / 0.1 : 1, e = k * k * (3 - 2 * k); qx(1 - 0.1 * e); qy2(1 - 0.1 * e); qk(e); printAt(p); } });
      });
      mm.add("(max-width: 860px)", () => {
        const card = $(".receipt__card"), secR = $(".receipt");
        const qx = g.quickTo(card, "scaleX", { duration: 0.9, ease: "power3" }), qy2 = g.quickTo(card, "scaleY", { duration: 0.9, ease: "power3" }), qk = g.quickTo(secR, "--k", { duration: 0.9, ease: "power3" });
        ST.create({ trigger: ".receipt__pin", start: "top top", end: "+=170%", pin: true, scrub: 0.4,
          onUpdate: (s) => { const p = s.progress, k = p < 0.1 ? p / 0.1 : p > 0.9 ? (1 - p) / 0.1 : 1, e = k * k * (3 - 2 * k); qx(1 - 0.08 * e); qy2(1 - 0.08 * e); qk(e); printAt(p); } });
      });
    }
    /* na míru: až PO účtence (pořadí pinů = pořadí v DOM) */
    const custP = (s) => { window.__customP = s.progress; dispatchEvent(new CustomEvent("custom", { detail: s.progress })); };
    mm.add("(min-width: 861px)", () => { ST.create({ trigger: "#na-miru", start: "center center", end: "+=170%", pin: true, scrub: 0.5, onUpdate: custP, onToggle: (t) => document.documentElement.classList.toggle("cpin", t.isActive) }); });
    mm.add("(max-width: 860px)", () => { ST.create({ trigger: "#na-miru", start: "top top", end: "+=150%", pin: true, scrub: 0.5, onUpdate: custP }); });
    addEventListener("load", () => ST.refresh());
  }

  /* ---------- mini košík (bublina u ikonky) ---------- */
  function miniCart() {
    let box = $(".mc");
    if (!box) {
      box = document.createElement("div"); box.className = "mc"; box.setAttribute("role", "dialog"); box.setAttribute("aria-label", "Vaše poptávka");
      document.body.append(box);
      box.addEventListener("click", (e) => {
        if (e.target === box || e.target.closest("[data-mc-close]")) close();
        const rm = e.target.closest("[data-mc-rm]"); if (rm) { cart.rm(+rm.dataset.mcRm); fill(); refreshCards(); }
      });
      addEventListener("keydown", (e) => e.key === "Escape" && close());
    }
    function fill() {
      const C = cart.get().filter((i) => byId[i.id]);
      const sum = C.reduce((s, i) => s + byId[i.id].p + (byId[i.id].fi ? 0 : FAN[i.fan][1]), 0);
      box.innerHTML = `<div class="mc__box"><div class="mc__head"><b>Vaše poptávka</b><button type="button" class="mc__x" data-mc-close aria-label="Zavřít">✕</button></div>
      ${C.length ? `<ul class="mc__list">${C.map(({ id }) => { const h = byId[id]; return `<li><img src="${img(h)}" alt="" width="64" height="48"><div><a href="/hrad.html?id=${id}">${h.n}</a><small>${num(h.d)} × ${num(h.w)} × ${num(h.h)} m</small></div><b>${kc(h.p)}</b><button type="button" data-mc-rm="${id}" aria-label="Odebrat ${h.n}">✕</button></li>`; }).join("")}</ul>
      <div class="mc__sum"><span>Celkem</span><b>${kc(sum)}</b></div>
      <div class="mc__btns"><button type="button" class="btn btn--ghost btn--sm" data-mc-close>Vybírat dál</button><a class="btn btn--sm" href="/kosik.html">Dokončit poptávku ${I.arrow}</a></div>`
      : `<p class="mc__empty"><span class="hand">Zatím prázdno.</span><br>Vyberte si hrad a klikněte na „Do poptávky“.</p><div class="mc__btns"><a class="btn btn--sm" href="/katalog.html">Do katalogu ${I.arrow}</a></div>`}</div>`;
    }
    function close() { box.classList.remove("on"); window.__lenis?.start(); }
    fill(); requestAnimationFrame(() => box.classList.add("on")); $(".mc__x", box)?.focus({ preventScroll: true });
  }
  function refreshCards() { $$("[data-add]").forEach((b) => { const on = cart.has(+b.dataset.add); b.classList.toggle("done", on); b.innerHTML = on ? I.ok + "<span>V poptávce</span>" : I.plus + "<span>Do poptávky</span>"; }); badge(); }
  document.addEventListener("click", (e) => { const a = e.target.closest(".nav__cart"); if (a && PAGE !== "kosik") { e.preventDefault(); miniCart(); } });

  /* ---------- KATALOG (výběr ve 4 krocích + lišta s aktivními filtry) ---------- */
  const AREA = { s: ["Do 16 m²", (a) => a <= 16, 0.7], m: ["16–30 m²", (a) => a > 16 && a <= 30, 0.85], l: ["Nad 30 m²", (a) => a > 30, 1] };
  const SORT = { doporucene: "Doporučené", "cena-asc": "Nejlevnější", "cena-desc": "Nejdražší", "velikost-desc": "Největší", cislo: "Podle čísla" };
  const TYPE_PIC = { hrad: 118, combo: 17, skluzavka: 64, draha: 3, hra: 61 };
  const CASTLE_ICO = (k) => `<svg viewBox="0 0 40 34" aria-hidden="true" style="width:${Math.round(26 + k * 22)}px"><path d="M4 32V12l5-8 5 8v4h12v-4l5-8 5 8v20z" fill="var(--sky)" stroke="var(--ink)" stroke-width="2.6" stroke-linejoin="round"/><rect x="13" y="22" width="14" height="10" rx="4" fill="var(--gold)" stroke="var(--ink)" stroke-width="2.6"/></svg>`;
  function katalog() {
    const P = new URLSearchParams(location.search);
    const S = { typ: new Set((P.get("typ") || "").split(",").filter(Boolean)), th: new Set((P.get("th") || "").split(",").filter(Boolean)),
      plocha: new Set((P.get("plocha") || "").split(",").filter(Boolean)), max: +P.get("max") || 0, q: P.get("q") || "", sort: P.get("sort") || "doporucene" };
    const maxP = Math.max(...H.map((h) => h.p)), minP = Math.min(...H.map((h) => h.p));
    const cnt = (f) => H.filter(f).length;
    $$("[data-count]").forEach((e) => (e.textContent = H.length));
    $("#ch-types").innerHTML = Object.entries(TYP).map(([k, n]) => `<button type="button" class="ty" data-f="typ" data-v="${k}"><img src="${img(byId[TYPE_PIC[k]])}" alt="" width="120" height="120" loading="lazy"><b>${n}</b><i>${cnt((h) => h.t === k)}</i></button>`).join("");
    $("#ch-themes").innerHTML = Object.entries(TH).map(([k, [n, c]]) => `<button type="button" class="thm" data-f="th" data-v="${k}" style="--c:${c}"><img src="${img(byId[THEME_PIC[k]])}" alt="" width="40" height="40" loading="lazy">${n}<i>${cnt((h) => h.th === k)}</i></button>`).join("");
    $("#ch-size").innerHTML = Object.entries(AREA).map(([k, [n, , sc]]) => `<button type="button" class="sz" data-f="plocha" data-v="${k}">${CASTLE_ICO(sc)}<b>${n}</b><i>${cnt((h) => AREA[k][1](h.a))}</i></button>`).join("");
    const rng = $("#ch-max"), out = $("#ch-out");
    Object.assign(rng, { min: minP, max: maxP, step: 1000, value: S.max || maxP });
    $("#q").value = S.q;
    $("#sort").innerHTML = Object.entries(SORT).map(([k, v]) => `<option value="${k}" ${k === S.sort ? "selected" : ""}>${v}</option>`).join("");
    const grid = $("#grid");
    const LBL = (f, v) => (f === "typ" ? TYP[v] : f === "th" ? TH[v][0] : AREA[v][0]);
    function run() {
      const q = S.q.trim().toLowerCase();
      const L = H.filter((h) => (!S.typ.size || S.typ.has(h.t)) && (!S.th.size || S.th.has(h.th)) && (!S.plocha.size || [...S.plocha].some((k) => AREA[k][1](h.a))) && (!S.max || h.p <= S.max) &&
        (!q || h.n.toLowerCase().includes(q) || String(h.id) === q.replace(/\D/g, "")));
      const srt = { "cena-asc": (a, b) => a.p - b.p, "cena-desc": (a, b) => b.p - a.p, "velikost-desc": (a, b) => b.a - a.a, cislo: (a, b) => a.id - b.id, doporucene: (a, b) => (FEATURED.includes(b.id) - FEATURED.includes(a.id)) || (b.ph || 0) - (a.ph || 0) || a.id - b.id };
      L.sort(srt[S.sort] || srt.doporucene);
      $("#count").innerHTML = `<span>${L.length}</span> ${L.length === 1 ? "model" : L.length < 5 && L.length ? "modely" : "modelů"}`;
      grid.innerHTML = L.length ? L.map((h, i) => card(h, i > 7).replace('<article class="card', `<article style="--i:${Math.min(i, 14)}" class="card`)).join("") : `<div class="empty"><p class="hand">Nic nesedí…</p><p>Zkuste povolit filtry, nebo nám napište – hrad vyrobíme i podle vašeho nápadu.</p></div>`;
      $$("[data-f]").forEach((b) => b.setAttribute("aria-pressed", S[b.dataset.f].has(b.dataset.v)));
      out.textContent = S.max && S.max < maxP ? kc(S.max) : "Bez limitu";
      rng.style.setProperty("--pct", (((rng.value - minP) / (maxP - minP)) * 100).toFixed(1) + "%");
      const chips = [];
      ["typ", "th", "plocha"].forEach((f) => S[f].forEach((v) => chips.push(`<button type="button" class="kchip" data-rm="${f}:${v}">${LBL(f, v)} <span aria-hidden="true">✕</span></button>`)));
      if (S.max && S.max < maxP) chips.push(`<button type="button" class="kchip" data-rm="max:">do ${kc(S.max)} <span aria-hidden="true">✕</span></button>`);
      if (S.q) chips.push(`<button type="button" class="kchip" data-rm="q:">„${S.q.replace(/[<>]/g, "")}“ <span aria-hidden="true">✕</span></button>`);
      if (chips.length > 1) chips.push(`<button type="button" class="kchip kchip--all" data-rm="all:">Zrušit vše</button>`);
      $("#kchips").innerHTML = chips.join("");
      const U = new URLSearchParams();
      ["typ", "th", "plocha"].forEach((k) => S[k].size && U.set(k, [...S[k]].join(",")));
      if (S.max && S.max < maxP) U.set("max", S.max); if (S.q) U.set("q", S.q); if (S.sort !== "doporucene") U.set("sort", S.sort);
      history.replaceState(null, "", location.pathname + (U.toString() ? "?" + U : ""));
    }
    const jump = () => { const k = $("#kbar"); if (k.getBoundingClientRect().top > innerHeight * 0.6) (window.__lenis ? window.__lenis.scrollTo(k, { offset: -10 }) : k.scrollIntoView({ behavior: "smooth" })); };
    $("#chooser").addEventListener("click", (e) => { const b = e.target.closest("[data-f]"); if (!b) return; const set = S[b.dataset.f]; set.has(b.dataset.v) ? set.delete(b.dataset.v) : set.add(b.dataset.v); run(); });
    rng.addEventListener("input", () => { S.max = +rng.value >= maxP ? 0 : +rng.value; run(); });
    $("#q").addEventListener("input", (e) => { S.q = e.target.value; run(); });
    $("#sort").addEventListener("change", (e) => { S.sort = e.target.value; run(); });
    $("#kchips").addEventListener("click", (e) => { const b = e.target.closest("[data-rm]"); if (!b) return; const [f, v] = b.dataset.rm.split(":");
      if (f === "all") { S.typ.clear(); S.th.clear(); S.plocha.clear(); S.max = 0; S.q = ""; $("#q").value = ""; rng.value = maxP; } else if (f === "max") { S.max = 0; rng.value = maxP; } else if (f === "q") { S.q = ""; $("#q").value = ""; } else S[f].delete(v); run(); });
    $("#ch-types").addEventListener("click", () => setTimeout(jump, 60), { once: true });
    run();
  }

  /* ---------- DETAIL ---------- */
  function detail() {
    const h = byId[+new URLSearchParams(location.search).get("id")];
    const root = $("#pd");
    if (!h) { root.innerHTML = `<div class="empty"><p class="hand">Tenhle hrad jsme nenašli.</p><a class="btn" href="/katalog.html">Zpět do katalogu</a></div>`; return; }
    document.title = `${h.n} (č. ${h.id}) – ${TYP[h.t]} na prodej | Skákací hrady`;
    $('meta[name="description"]')?.setAttribute("content", `${h.n}: ${TYP[h.t].toLowerCase()} ${size(h)}, ${h.m}. Cena ${kc(h.p)}, výroba na míru.`);
    $("#crumb").textContent = `${h.n} (č. ${h.id})`;
    const inCart = cart.get().find((i) => i.id === h.id);
    let fan = inCart ? inCart.fan : 0;
    const est = h.he ? '<span class="est">odhad</span>' : "";
    const fans = h.fi ? `<p class="pill pill--y">Fukar je v ceně</p>` : `<div class="fans" role="radiogroup" aria-label="Fukar">${[0, 950, 1500].map((f) =>
      `<label class="fan"><input type="radio" name="fan" value="${f}" ${f === fan ? "checked" : ""}><span>${FAN[f][0]}${f === h.fan ? "<em>doporučený</em>" : ""}</span><b>${f ? "+ " + kc(FAN[f][1]) : "—"}</b></label>`).join("")}</div>`;
    root.innerHTML = `
    <div><div class="pd__stage"><button class="pd__img" type="button" data-cur="Zvětšit" aria-label="Zvětšit fotku"><img id="pd-main" src="${img(h, false)}" alt="${h.n} – ${TYP[h.t].toLowerCase()}" width="1200" height="900"></button></div>
    ${h.ph ? `<div class="pd__thumbs">${[img(h, false), img(h, false, true)].map((src, i) => `<button type="button" data-src="${src}" aria-pressed="${!i}" aria-label="${i ? "Původní fotka" : "Studiová fotka"}"><img src="${src.replace(".webp", "-sm.webp")}" alt="" width="84" height="84" loading="lazy"></button>`).join("")}</div>` : ""}
    ${h.m3d ? `<button class="btn btn--sky pd__3dbtn" id="v3d-btn" type="button" aria-pressed="false">Prohlédnout ve 3D ↻</button>` : ""}</div>
    <div>
      <div class="pd__tags"><span class="pill pill--y">č. ${h.id}</span><a class="pill" href="/katalog.html?typ=${h.t}">${TYP[h.t]}</a><a class="pill" href="/katalog.html?th=${h.th}">${TH[h.th][0]}</a></div>
      <h1>${h.n}</h1>
      ${h.note ? `<p><strong>${h.note}</strong></p>` : ""}
      <div class="price"><b>${kc(h.p)}</b><small>konečná cena, bez dopravy · nejsme plátci DPH</small></div>
      <p class="season" data-season hidden>Mimo sezónu cca ${kc(Math.round(h.p * 0.85 / 100) * 100)} – ${kc(Math.round(h.p * 0.9 / 100) * 100)} (sleva 10–15 %)</p>
      <h2 class="sr">Fukar</h2>${fans}
      <div class="pd__actions"><button class="btn" type="button" id="add">${inCart ? "Upravit v poptávce" : "Přidat do poptávky"} ${I.plus}</button>
      <button class="btn btn--ghost" type="button" disabled title="Připravujeme">Koupit online – brzy</button></div>
      <table class="specs"><caption class="sr">Parametry</caption><tbody>
        <tr><th>Rozměr (d × š)</th><td>${size(h)}</td></tr>
        <tr><th>Výška</th><td>${num(h.h)} m${est}</td></tr>
        <tr><th>Plocha</th><td>${num(h.a)} m²</td></tr>
        ${h.t === "hra" ? "" : `<tr><th>Kapacita</th><td>až ${h.c} dětí najednou<span class="est">odhad</span></td></tr>`}
        <tr><th>Věk</th><td>${h.age[1] > 90 ? h.age[0] + "+ let" : h.age[0] + "–" + h.age[1] + " let"}<span class="est">odhad</span></td></tr>
        <tr><th>Materiál</th><td>${h.m}, ohnivzdorný, vodovzdorný, netoxický</td></tr>
        <tr><th>Certifikace</th><td>CE &amp; SGS, EN 14960:2013, EN 15649:2013</td></tr>
        <tr><th>Výroba</th><td>cca 8 týdnů, některé modely skladem</td></tr>
      </tbody></table>
      <div class="pd__box"><h3>V balení</h3><ul class="checks"><li>Hrad a přepravní obal</li><li>Opravná sada podle dohody</li><li>Záruka 1 rok, opravy podle příčiny poškození</li></ul>
      <p>Rozměr, barvy i nápisy upravíme. Jednoduché logo je v ceně.</p></div>
    </div>`;
    root.addEventListener("change", (e) => { if (e.target.name === "fan") { fan = +e.target.value; if (cart.has(h.id)) cart.fan(h.id, fan); } });
    $("#add").addEventListener("click", (e) => { cart.add(h.id, fan); badge(true); e.currentTarget.innerHTML = `Přidáno ${I.ok}`; setTimeout(() => (location.href = "/kosik.html"), 450); });
    const lb = $(".lb");
    $$(".pd__thumbs button").forEach((b) => b.addEventListener("click", () => { $("#pd-main").src = b.dataset.src; $$(".pd__thumbs button").forEach((x) => x.setAttribute("aria-pressed", x === b)); }));
    let v3d = null;
    $("#v3d-btn")?.addEventListener("click", async (e) => {
      const btn = e.currentTarget, stage = $(".pd__stage");
      if (v3d) { v3d.destroy(); v3d = null; $(".pd__3d")?.remove(); $(".pd__img").hidden = false; btn.textContent = "Prohlédnout ve 3D ↻"; btn.setAttribute("aria-pressed", "false"); return; }
      const box = document.createElement("div"); box.className = "pd__3d"; box.innerHTML = '<p class="pd__hint hand">táhni a otoč</p>';
      $(".pd__img").hidden = true; stage.append(box); btn.textContent = "Zpět na fotku"; btn.setAttribute("aria-pressed", "true");
      try { const m = await import("/js/viewer3d.js"); v3d = await m.mount3d(box, `/assets/3d/${String(h.id).padStart(3, "0")}.glb`); }
      catch { box.innerHTML = '<p class="hand" style="padding:24px">3D se nepodařilo načíst.</p>'; }
    });
    $(".pd__img").addEventListener("click", () => { lb.querySelector("img").src = $("#pd-main").src; lb.querySelector("img").alt = h.n; lb.classList.add("on"); lb.querySelector("button").focus(); });
    lb.addEventListener("click", (e) => { if (e.target === lb || e.target.closest("button")) lb.classList.remove("on"); });
    addEventListener("keydown", (e) => e.key === "Escape" && lb.classList.remove("on"));
    const rel = H.filter((x) => x.th === h.th && x.id !== h.id).sort((a, b) => Math.abs(a.p - h.p) - Math.abs(b.p - h.p)).slice(0, 4);
    $("#related").innerHTML = rel.map((x) => card(x)).join("");
    seasonal();
  }

  /* ---------- POPTÁVKA ---------- */
  function kosik() {
    const list = $("#items"), sum = $("#sum");
    function render() {
      const C = cart.get().filter((i) => byId[i.id]);
      if (!C.length) { list.innerHTML = `<div class="empty"><p class="hand">Zatím prázdno.</p><p>Vyberte hrad v katalogu, nebo rovnou napište, co hledáte.</p><a class="btn" href="/katalog.html">Do katalogu ${I.arrow}</a></div>`; sum.hidden = true; return; }
      sum.hidden = false;
      list.innerHTML = C.map(({ id, fan }) => { const h = byId[id]; return `<div class="ci">
        <img src="${img(h)}" alt="" width="120" height="90" loading="lazy">
        <div><h3><a href="/hrad.html?id=${id}">${h.n}</a></h3><p class="card__meta">č. ${id} · ${size(h)} · ${kc(h.p)}</p>
        ${h.fi ? '<p class="pill pill--y">Fukar v ceně</p>' : `<select class="select" data-fan="${id}" aria-label="Fukar k ${h.n}">${[0, 950, 1500].map((f) => `<option value="${f}" ${f === fan ? "selected" : ""}>${FAN[f][0]}${f ? " (+" + kc(FAN[f][1]) + ")" : ""}${f === h.fan ? " – doporučený" : ""}</option>`).join("")}</select>`}</div>
        <div class="ci__side"><b class="card__price">${kc(h.p + (h.fi ? 0 : FAN[fan][1]))}</b><button class="ci__rm" type="button" data-rm="${id}">Odebrat</button></div></div>`; }).join("");
      const hr = C.reduce((s, i) => s + byId[i.id].p, 0), fa = C.reduce((s, i) => s + (byId[i.id].fi ? 0 : FAN[i.fan][1]), 0);
      $("#s-hrady").textContent = kc(hr); $("#s-fans").textContent = kc(fa); $("#s-total").textContent = kc(hr + fa);
      $("#s-season").hidden = !season(); $("#s-season b").textContent = `${kc(Math.round((hr * 0.85) / 100) * 100)} – ${kc(Math.round((hr * 0.9) / 100) * 100)}`;
    }
    try {
      const dz = JSON.parse(localStorage.getItem("shp-design") || "null");
      if (dz) {
        list.insertAdjacentHTML("beforebegin", `<div class="ci ci--design"><img src="${dz.img}" alt="Váš 3D návrh" width="120" height="90"><div><h3>Váš 3D návrh</h3><p class="card__meta">${dz.sum.replace(/[<>]/g, "")}</p></div><div class="ci__side"><a class="ci__rm" href="/studio.html">Upravit</a><button class="ci__rm" type="button" id="dz-rm">Odebrat</button></div></div>`);
        const ta = $("#form textarea"); if (ta && !ta.value) ta.value = dz.sum;
        $("#dz-rm").addEventListener("click", () => { localStorage.removeItem("shp-design"); $(".ci--design").remove(); });
      }
    } catch {}
    list.addEventListener("change", (e) => { const s = e.target.closest("[data-fan]"); if (s) { cart.fan(+s.dataset.fan, +s.value); render(); } });
    list.addEventListener("click", (e) => { const b = e.target.closest("[data-rm]"); if (b) { cart.rm(+b.dataset.rm); render(); } });
    render();

    bindForm(render);
  }

  /* formulář poptávky (košík i konec úvodu) */
  function bindForm(onSent) {
    if (!$("#form")) return;
    const f = $("#form"), hint = $("#form-hint");
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(f));
      if (!d.jmeno || !(d.email || d.telefon)) { hint.textContent = "Vyplňte jméno a e-mail nebo telefon."; return; }
      d.kosik = cart.get().filter((i) => byId[i.id]).map(({ id, fan }) => ({ id, nazev: byId[id].n, fukar: byId[id].fi ? "v ceně" : FAN[fan][0], cena: byId[id].p + (byId[id].fi ? 0 : FAN[fan][1]) }));
      const btn = f.querySelector("button[type=submit]"); btn.disabled = true; hint.textContent = "Odesílám…";
      try {
        const r = await fetch("/api/poptavka", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(d) });
        if (r.ok) { localStorage.removeItem("shp-design"); f.innerHTML = `<p class="ok">Díky, poptávka odešla. Ozveme se nejpozději další pracovní den.</p>`; cart.set([]); onSent?.(); return; }
        throw new Error(r.status);
      } catch {
        const body = [`Jméno: ${d.jmeno}`, `E-mail: ${d.email}`, `Telefon: ${d.telefon}`, `Město/obec: ${d.mesto}`, "", ...d.kosik.map((i) => `č. ${i.id} ${i.nazev} – ${i.fukar} – ${kc(i.cena)}`), "", d.zprava].join("\n");
        location.href = `mailto:${MAIL}?subject=${encodeURIComponent("Poptávka – skákací hrady")}&body=${encodeURIComponent(body)}`;
        hint.textContent = "Otevřel se váš e-mail s připravenou poptávkou – stačí ji odeslat."; btn.disabled = false;
      }
    });
  }

  /* nadpisy: slova gumově vyskočí při příjezdu */
  function headWords() {
    if (RM || !("IntersectionObserver" in window)) return;
    $$("main h1:not(.hero__logo), main h2:not(.ch-t)").forEach((h) => {
      let i = 0;
      const walk = (n) => [...n.childNodes].forEach((c) => {
        if (c.nodeType === 3) { const parts = c.textContent.split(/(\s+)/); const f = document.createDocumentFragment(); parts.forEach((p) => { if (!p) return; if (/^\s+$/.test(p)) f.append(p); else { const w = document.createElement("span"); w.className = "w"; w.style.setProperty("--i", i++); w.textContent = p; f.append(w); } }); c.replaceWith(f); }
        else if (c.nodeType === 1 && !c.classList.contains("w")) walk(c);
      });
      walk(h); h.classList.add("words");
    });
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -12% 0px" });
    $$(".words").forEach((h) => io.observe(h));
    /* záloha přes ScrollTrigger (spolehlivá i uvnitř zamčených sekcí na mobilu) */
    setTimeout(() => { const ST = window.ScrollTrigger; if (ST) $$(".words:not(.in)").forEach((h) => ST.create({ trigger: h, start: "top 92%", once: true, onEnter: () => h.classList.add("in") })); }, 300);
  }
  /* pilulky = přesně mráček z oblohy (stejné obláčky, jen rozšířený; kruhy se nedeformují) */
  function cloudPills() {
    const NS = "http://www.w3.org/2000/svg";
    const draw = (el) => {
      el.querySelector(":scope > .cl")?.remove();
      const tw = el.offsetWidth, th = el.offsetHeight, pad = 4;
      /* přesně mráček z oblohy (4 laloky): mírně roztažený do šířky (max 1,55×) a zvětšený, kruhy → jemné elipsy */
      /* text sedí v plné části mráčku (x 30–95 z 109), mráček ho těsně obejme */
      const big = true, s0 = Math.max(0.85, th / 28), MX = 1.75, ratio = (tw + 6) / (76 * s0), sx = Math.min(MX, Math.max(1, ratio)), s = s0 * Math.max(1, ratio / MX);
      const C = [[21, 36, 14], [41, 24, 21], [66, 28, 16], [86, 26, 18], [104, 37, 12]].map(([x, y, r]) => [x * s * sx, y * s, r * s * sx, r * s]);
      const L = C.length - 1, minX = C[0][0] - C[0][2], maxX = C[L][0] + C[L][2], base = 50 * s, top = Math.min(...C.map(([, y, , ry]) => y - ry)), cyMin = Math.min(...C.map((c) => c[1]));
      const W = maxX - minX + pad * 2, Hh = base - top + pad * 2;
      const sh = (k) => C.map(([x, y, rx, ry]) => `<ellipse cx="${(x - minX + pad).toFixed(1)}" cy="${(y - top + pad).toFixed(1)}" rx="${(rx + k).toFixed(1)}" ry="${(ry + k).toFixed(1)}"/>`).join("") + `<rect x="${(C[0][0] - minX + pad).toFixed(1)}" y="${(cyMin - top + pad - k).toFixed(1)}" width="${(C[L][0] - C[0][0]).toFixed(1)}" height="${(base - cyMin + 2 * k).toFixed(1)}"/>`;
      const svg = document.createElementNS(NS, "svg");
      svg.setAttribute("class", "cl"); svg.setAttribute("aria-hidden", "true"); svg.setAttribute("width", W.toFixed(0)); svg.setAttribute("height", Hh.toFixed(0)); svg.setAttribute("viewBox", `0 0 ${W.toFixed(1)} ${Hh.toFixed(1)}`);
      const gid = "cg" + Math.random().toString(36).slice(2, 7), hl = C[1];
      svg.innerHTML = `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".62" stop-color="#FFFDF5"/><stop offset="1" stop-color="#DDF1FA"/></linearGradient></defs><g fill="var(--ink)">${sh(3)}</g><g fill="url(#${gid})">${sh(0)}</g><ellipse cx="${(hl[0] - minX + pad - hl[2] * 0.35).toFixed(1)}" cy="${(hl[1] - top + pad - hl[3] * 0.45).toFixed(1)}" rx="${(hl[2] * 0.32).toFixed(1)}" ry="${(hl[3] * 0.16).toFixed(1)}" fill="#fff" opacity=".9" transform="rotate(-18 ${(hl[0] - minX + pad - hl[2] * 0.35).toFixed(1)} ${(hl[1] - top + pad - hl[3] * 0.45).toFixed(1)})"/>`;
      svg.style.bottom = "-6px";
      el.prepend(svg);
    };
    const all = () => $$(".eyebrow").forEach(draw);
    all(); document.fonts?.ready.then(all); addEventListener("resize", all);
  }
  /* AI asistent v Otázkách (Workers AI, při výpadku odpovídá z otázek na stránce) */
  function assistant() {
    const box = $("#bot"); if (!box) return;
    const log = $("#bot-log"), form = $("#bot-form"), inp = $("#bot-in"), hist = [];
    const norm = (t) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ");
    const faqs = $$(".faq details").map((d) => ({ q: d.querySelector("summary").textContent, a: d.querySelector("p").textContent }));
    const local = (q) => {
      const w = norm(q).split(/\s+/).filter((x) => x.length > 2);
      let best = null, sc = 0;
      faqs.forEach((f) => { const t = norm(f.q + " " + f.a); const s2 = w.reduce((s, x) => s + (t.includes(x.slice(0, 5)) ? 1 : 0), 0); if (s2 > sc) { sc = s2; best = f; } });
      return sc >= 1 ? best.a : "Na tohle vám nejrychleji odpoví Mirek: +420 736 214 975, nebo nám napište poptávku níže – ozveme se do druhého pracovního dne.";
    };
    const add = (t, who) => { const p = document.createElement("p"); p.className = "msg msg--" + who; p.textContent = t; log.append(p); log.scrollTop = log.scrollHeight; return p; };
    async function ask(q) {
      q = q.trim(); if (!q) return;
      add(q, "me"); hist.push({ role: "user", content: q }); inp.value = "";
      const typing = add("", "bot"); typing.classList.add("msg--typing"); typing.innerHTML = "<i></i><i></i><i></i>";
      let reply;
      try { const r = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: hist }) }); const d = await r.json(); if (!d.ok) throw 0; reply = d.reply; }
      catch { reply = local(q); }
      typing.remove(); add(reply, "bot"); hist.push({ role: "assistant", content: reply });
    }
    form.addEventListener("submit", (e) => { e.preventDefault(); ask(inp.value); });
    $("#bot-chips").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) ask(b.textContent); });
  }
  badge(); navState(); seasonal(); cursor(); dotsBg(); headWords(); cloudPills(); assistant();
  ({ home, katalog, detail, kosik })[PAGE]?.();
  reveal();
})();
