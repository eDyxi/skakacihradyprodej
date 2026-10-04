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
    (function loop() { cx += (x - cx) * 0.22; cy += (y - cy) * 0.22; c.style.transform = `translate(${cx}px,${cy}px)`; requestAnimationFrame(loop); })();
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
      const ring = !!b.closest(".themes-anim"), w = b.offsetWidth, hh = b.offsetHeight, cy = parseFloat(getComputedStyle(b).getPropertyValue("--cy")) || hh / 2;
      const rx = Math.min(w * (ring ? 0.38 : 0.42), ring ? 430 : 460), ry = ring ? Math.max(130, Math.min(hh * 0.36, cy - 120)) : Math.min(hh * 0.33, 250);
      $$(".bub", ul).forEach((a, i) => { const ang = ring ? ((-90 + 22.5 + i * 45) * Math.PI) / 180 : -Math.PI / 2 + (i / T.length) * Math.PI * 2; a.style.setProperty("--x", (Math.cos(ang) * rx).toFixed(0) + "px"); a.style.setProperty("--y", (Math.sin(ang) * ry).toFixed(0) + "px"); });
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
  function home() {
    $$("[data-castle]").forEach((el) => (el.innerHTML = castle({ idle: el.dataset.castle === "idle", fan: el.dataset.castle === "story" })));
    const track = $("#rail-track");
    if (track) track.innerHTML = FEATURED.slice(0, 6).filter((i) => byId[i]).map((i) => card(byId[i])).join("") +
      `<div class="rail__end"><div><p>Dalších ${H.length - 6} modelů v katalogu</p><a class="btn" href="/katalog.html">Celý katalog ${I.arrow}</a></div></div>`;
    burst(); sun($("#nejzadanejsi")); 
    const printAt = receipt();
    bindForm(() => { const a = $("[data-ask-cart]"); if (a) a.hidden = true; });
    const ask = $("[data-ask-cart]"), inC = cart.get().filter((i) => byId[i.id]);
    if (ask && inC.length) { ask.hidden = false; ask.innerHTML = `V poptávce: <b>${inC.map((i) => byId[i.id].n).join(", ")}</b> – pošleme s ní. <a href="/kosik.html">Upravit</a>`; }
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
      document.addEventListener("click", (e) => { const a = e.target.closest('a[href^="#"], a[href^="/#"]'); if (!a) return; const id = a.getAttribute("href").split("#")[1]; const t = id && document.getElementById(id); if (t) { e.preventDefault(); l.scrollTo(t, { offset: -70, duration: 1.4 }); } });
    }

    /* hero intro: slova vyskočí, hrad dopadne */
    g.timeline()
      .from(".hero__logo .hl1, .hero__logo .hl2", { y: -160, scaleY: 1.35, scaleX: 0.8, opacity: 0, transformOrigin: "50% 100%", duration: 1.3, ease: "elastic.out(1, 0.4)", stagger: 0.16 })
      .from(".hero__lede, .hero__cta, .hero__facts li", { y: 24, opacity: 0, duration: 0.6, stagger: 0.05, ease: "back.out(1.8)" }, "-=.8");
    g.to(".cloud", { yPercent: (i) => -40 - i * 25, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

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
        ST.create({ trigger: ".story__pin", start: "top top", end: "+=320%", pin: true, anticipatePin: 1, scrub: 0.6, animation: tl,
          onUpdate: (s) => { depth(s.progress); dispatchEvent(new CustomEvent("story", { detail: s.progress })); const i = Math.min(steps.length - 1, Math.floor(s.progress * steps.length)); steps.forEach((li, k) => li.classList.toggle("on", k <= i)); if (gauge) gauge.textContent = Math.round(s.progress * 100) + " %"; } });
      });
      mm.add("(max-width: 860px)", () => {
        steps.forEach((s) => s.classList.add("on"));
        ST.create({ trigger: sc, start: "top 85%", end: "bottom 35%", scrub: 0.6, animation: tl, onUpdate: (s) => { dispatchEvent(new CustomEvent("story", { detail: s.progress })); if (gauge) gauge.textContent = Math.round(s.progress * 100) + " %"; } });
      });
    }

    /* carousel: horizontální jízda + prohnutí podle rychlosti */
    const rail = $("#rail");
    mm.add("(min-width: 900px)", () => {
      const dist = () => track.scrollWidth - rail.clientWidth + 8;
      const skew = g.quickTo(".rail__track .card", "skewX", { duration: 0.5, ease: "power3" });
      const tw = g.to(track, { x: () => -dist(), ease: "none",
        scrollTrigger: { trigger: "#nejzadanejsi", start: "center center", end: () => "+=" + dist(), pin: true, anticipatePin: 1, scrub: 0.5, invalidateOnRefresh: true,
          onUpdate: (s) => skew(g.utils.clamp(-9, 9, s.getVelocity() / -260)) } });
      return () => tw.kill();
    });
    mm.add("(max-width: 899px)", () => { rail.classList.add("rail--native"); return () => rail.classList.remove("rail--native"); });

    /* témata a cenovka */
    /* témata (desktop): text přijede pod žlutým pruhem; jakmile se zespodu ukáže balónek, scroll se zamkne
       (balónek bude přesně uprostřed), text hned zmizí, balónek doletí na jeho místo; pak uletí.
       Po prvním otevření balónků se zamčení zruší. */
    mm.add("(min-width: 861px)", () => {
      const sec = $("#temata"), core = $(".burst__core"), hint = $(".burst__hint"); if (!sec || !core) return;
      sec.classList.add("themes-anim");
      g.set(core, { xPercent: -50, yPercent: -50 });
      const txt = $$("#temata .sec__head h2, #temata .sec__head p");
      let cyN = 200, open = false, unpinned = false, pIn = 0, pOut = 0;
      const setCY = () => { const r = sec.getBoundingClientRect(), a = txt[0].getBoundingClientRect(), b = txt[txt.length - 1].getBoundingClientRect(); cyN = Math.round((a.top + b.bottom) / 2 - r.top); sec.style.setProperty("--cy", cyN + "px"); dispatchEvent(new Event("burst-place")); };
      setCY();
      const X = () => Math.round(innerHeight * 0.336);
      const lockY = () => sec.getBoundingClientRect().top + scrollY - X();
      const tin = g.timeline({ paused: true })
        .to(txt, { opacity: 0, y: -16, duration: 0.1, ease: "power1.in" }, 0)
        .fromTo(core, { y: "52vh", x: 0, rotation: 0 }, { keyframes: { y: ["52vh", "37vh", "23vh", "11vh", "3vh", "-1vh", "0vh"], x: [0, -42, 30, -20, 10, -3, 0], rotation: [0, -10, 7, -5, 3, -1, 0], easeEach: "sine.inOut" }, duration: 0.68 }, 0)
        .fromTo(hint, { opacity: 0 }, { opacity: 1, duration: 0.08 }, 0.72)
        .to({}, { duration: 0.2 });
      const tout = g.timeline({ paused: true })
        .to(core, { keyframes: { y: ["0vh", "-18vh", "-40vh", "-65vh", "-95vh"], x: [0, 28, -22, 18, -10], rotation: [0, 7, -6, 5, -3], easeEach: "sine.inOut" }, duration: 1, ease: "power1.in" })
        .to(hint, { opacity: 0, duration: 0.15 }, 0)
        .to(core, { opacity: 0, duration: 0.2 }, 0.8);
      tin.progress(0);
      const sync = () => { if (open) return; g.to(tin, { progress: pIn, duration: 0.5, ease: "power2.out", overwrite: true }); g.to(tout, { progress: pOut, duration: 0.5, ease: "power2.out", overwrite: true }); };
      const s1 = ST.create({ trigger: sec, start: () => "top " + X() + "px", end: "+=75%", pin: true, anticipatePin: 1, onRefreshInit: setCY, onUpdate: (s) => { if (!unpinned) { pIn = s.progress; sync(); } } });
      const sIn = ST.create({ trigger: sec, start: () => (unpinned ? lockY() - innerHeight * 0.6 : 0), end: () => (unpinned ? lockY() : 1), onUpdate: (s) => { if (unpinned) { pIn = s.progress; sync(); } } });
      const s2 = ST.create({ trigger: sec, start: () => (unpinned ? lockY() : s1.end), end: () => (unpinned ? lockY() : s1.end) + innerHeight * 0.55, onUpdate: (s) => { pOut = s.progress; sync(); } });
      const unpin = () => {
        if (unpinned) return;
        const y = scrollY, a = s1.start, b = s1.end;
        unpinned = true; s1.kill(true); ST.refresh();
        const t = y >= b ? y - (b - a) : y > a ? a : y;
        if (t !== y) { window.__lenis ? window.__lenis.scrollTo(t, { immediate: true, force: true }) : scrollTo(0, t); }
      };
      const onOpen = () => { open = true; unpin(); }, onClose = () => { open = false; sync(); };
      addEventListener("burst-open", onOpen); addEventListener("burst-close", onClose);
      return () => { if (!unpinned) s1.kill(); sIn.kill(); s2.kill(); tin.kill(); tout.kill(); sec.classList.remove("themes-anim"); sec.style.removeProperty("--cy"); removeEventListener("burst-open", onOpen); removeEventListener("burst-close", onClose); g.set([core, hint, ...txt], { clearProps: "all" }); };
    });

    /* účtenka: zamknout scroll a tisknout; karta se oddálí jako u nafukování */
    if (printAt) {
      mm.add("(min-width: 861px)", () => {
        const card = $(".receipt__card"), secR = $(".receipt");
        const qx = g.quickTo(card, "scaleX", { duration: 0.9, ease: "power3" }), qy2 = g.quickTo(card, "scaleY", { duration: 0.9, ease: "power3" }), qk = g.quickTo(secR, "--k", { duration: 0.9, ease: "power3" });
        ST.create({ trigger: ".receipt__pin", start: "top top", end: "+=200%", pin: true, anticipatePin: 1, scrub: 0.4,
          onUpdate: (s) => { const p = s.progress, k = p < 0.1 ? p / 0.1 : p > 0.9 ? (1 - p) / 0.1 : 1, e = k * k * (3 - 2 * k); qx(1 - 0.1 * e); qy2(1 - 0.1 * e); qk(e); printAt(p); } });
      });
      mm.add("(max-width: 860px)", () => {
        ST.create({ trigger: ".printer", start: "top 75%", once: true, onEnter: () => { const o = { p: 0 }; g.to(o, { p: 1, duration: 2.6, ease: "none", onUpdate: () => printAt(o.p) }); } });
      });
    }
    /* na míru: až PO účtence (pořadí pinů = pořadí v DOM) */
    const custP = (s) => { window.__customP = s.progress; dispatchEvent(new CustomEvent("custom", { detail: s.progress })); };
    mm.add("(min-width: 861px)", () => { ST.create({ trigger: "#na-miru", start: "top top", end: "+=170%", pin: true, anticipatePin: 1, scrub: 0.5, onUpdate: custP }); });
    mm.add("(max-width: 860px)", () => { ST.create({ trigger: ".custom__art", start: "top 80%", end: "bottom 30%", scrub: 0.5, onUpdate: custP }); });
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

  /* ---------- KATALOG ---------- */
  const AREA = { s: ["do 16 m²", (a) => a <= 16], m: ["16–30 m²", (a) => a > 16 && a <= 30], l: ["nad 30 m²", (a) => a > 30] };
  const SORT = { doporucene: "Doporučené", "cena-asc": "Cena ↑", "cena-desc": "Cena ↓", "velikost-desc": "Největší", cislo: "Podle čísla" };
  function katalog() {
    const P = new URLSearchParams(location.search);
    const S = { typ: new Set((P.get("typ") || "").split(",").filter(Boolean)), th: new Set((P.get("th") || "").split(",").filter(Boolean)),
      plocha: new Set((P.get("plocha") || "").split(",").filter(Boolean)), max: +P.get("max") || 0, q: P.get("q") || "", sort: P.get("sort") || "doporucene" };
    const maxP = Math.max(...H.map((h) => h.p)), minP = Math.min(...H.map((h) => h.p));
    const chips = (name, obj, count) => Object.entries(obj).map(([k, v]) => {
      const label = Array.isArray(v) ? v[0] : v, n = count(k);
      return n ? `<label class="chip"><input type="checkbox" name="${name}" value="${k}" ${S[name].has(k) ? "checked" : ""}><span>${label} · ${n}</span></label>` : "";
    }).join("");
    $("#filters-form").innerHTML = `
      <label class="field">Hledat<input class="input" type="search" name="q" value="${S.q.replace(/"/g, "")}" placeholder="název nebo číslo" autocomplete="off"></label>
      <fieldset><legend>Typ</legend><div class="chips">${chips("typ", TYP, (k) => H.filter((h) => h.t === k).length)}</div></fieldset>
      <fieldset><legend>Téma</legend><div class="chips">${chips("th", Object.fromEntries(Object.entries(TH).map(([k, v]) => [k, v[0]])), (k) => H.filter((h) => h.th === k).length)}</div></fieldset>
      <fieldset><legend>Plocha</legend><div class="chips">${chips("plocha", AREA, (k) => H.filter((h) => AREA[k][1](h.a)).length)}</div></fieldset>
      <label class="field">Cena do <output id="maxo">${kc(S.max || maxP)}</output><input type="range" name="max" min="${minP}" max="${maxP}" step="1000" value="${S.max || maxP}"></label>
      <button class="btn btn--ghost btn--sm" type="reset">Zrušit filtry</button>`;
    $("#sort").innerHTML = Object.entries(SORT).map(([k, v]) => `<option value="${k}" ${k === S.sort ? "selected" : ""}>${v}</option>`).join("");

    const grid = $("#grid"), count = $("#count");
    function run() {
      const q = S.q.trim().toLowerCase();
      let L = H.filter((h) => (!S.typ.size || S.typ.has(h.t)) && (!S.th.size || S.th.has(h.th)) &&
        (!S.plocha.size || [...S.plocha].some((k) => AREA[k][1](h.a))) && (!S.max || h.p <= S.max) &&
        (!q || h.n.toLowerCase().includes(q) || String(h.id) === q.replace(/\D/g, "")));
      const srt = { "cena-asc": (a, b) => a.p - b.p, "cena-desc": (a, b) => b.p - a.p, "velikost-desc": (a, b) => b.a - a.a, cislo: (a, b) => a.id - b.id,
        doporucene: (a, b) => (FEATURED.includes(b.id) - FEATURED.includes(a.id)) || a.id - b.id };
      L.sort(srt[S.sort] || srt.doporucene);
      count.textContent = `${L.length} ${L.length === 1 ? "model" : L.length < 5 && L.length ? "modely" : "modelů"}`;
      grid.innerHTML = L.length ? L.map((h, i) => card(h, i > 5)).join("") : `<div class="empty"><p class="hand">Nic nesedí…</p><p>Zkuste povolit filtry, nebo nám napište – hrad vyrobíme i podle vašeho nápadu.</p></div>`;
      const U = new URLSearchParams();
      ["typ", "th", "plocha"].forEach((k) => S[k].size && U.set(k, [...S[k]].join(",")));
      if (S.max && S.max < maxP) U.set("max", S.max); if (S.q) U.set("q", S.q); if (S.sort !== "doporucene") U.set("sort", S.sort);
      history.replaceState(null, "", location.pathname + (U.toString() ? "?" + U : ""));
    }
    const form = $("#filters-form");
    form.addEventListener("input", (e) => {
      const t = e.target;
      if (t.type === "checkbox") t.checked ? S[t.name].add(t.value) : S[t.name].delete(t.value);
      if (t.name === "max") { S.max = +t.value; $("#maxo").textContent = kc(S.max); }
      if (t.name === "q") S.q = t.value;
      run();
    });
    form.addEventListener("reset", () => setTimeout(() => { S.typ.clear(); S.th.clear(); S.plocha.clear(); S.max = 0; S.q = ""; $("#maxo").textContent = kc(maxP); run(); }));
    $("#sort").addEventListener("change", (e) => { S.sort = e.target.value; run(); });
    const fl = $(".filters"), scrim = $(".scrim");
    const tog = (on) => { fl.classList.toggle("open", on); scrim.classList.toggle("on", on); };
    $(".filters__toggle")?.addEventListener("click", () => tog(true));
    scrim?.addEventListener("click", () => tog(false));
    $("#filters-close")?.addEventListener("click", () => tog(false));
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
        if (r.ok) { f.innerHTML = `<p class="ok">Díky, poptávka odešla. Ozveme se nejpozději další pracovní den.</p>`; cart.set([]); onSent?.(); return; }
        throw new Error(r.status);
      } catch {
        const body = [`Jméno: ${d.jmeno}`, `E-mail: ${d.email}`, `Telefon: ${d.telefon}`, `Město/obec: ${d.mesto}`, "", ...d.kosik.map((i) => `č. ${i.id} ${i.nazev} – ${i.fukar} – ${kc(i.cena)}`), "", d.zprava].join("\n");
        location.href = `mailto:${MAIL}?subject=${encodeURIComponent("Poptávka – skákací hrady")}&body=${encodeURIComponent(body)}`;
        hint.textContent = "Otevřel se váš e-mail s připravenou poptávkou – stačí ji odeslat."; btn.disabled = false;
      }
    });
  }

  badge(); navState(); seasonal(); cursor(); dotsBg();
  ({ home, katalog, detail, kosik })[PAGE]?.();
  reveal();
})();
