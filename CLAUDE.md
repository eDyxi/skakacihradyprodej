# Skákací hrady prodej – pravidla pro Claude

Česky, stručně. Statické HTML bez build kroku, Cloudflare Worker (`src/worker.js` = jen `/api/*`, zbytek `public/` jako assets).

## Deploy (wrangler, ne Git integrace)
- Preview: `npx wrangler versions upload --preview-alias finalizace` → https://finalizace-skakacihradyprodej.edyxiedyxi.workers.dev (má `noindex`, SEO tam vychází 66–69, to je OK)
- Produkce: z `main` `npx wrangler deploy` → https://skakacihradyprodej.edyxiedyxi.workers.dev
- Tajné klíče jen přes `wrangler secret put` (RESEND_API_KEY, MAIL_TO, MAIL_FROM). Zatím NEJSOU nastavené → poptávka padá na `mailto` s potvrzením (API vrací 200 + `fallback`).

## Struktura
- `public/index.html` úvod (hero 3D, zamčené scény GSAP: Jak to probíhá, Nejžádanější, Témata, Na rovinu, Na míru, FAQ + asistent, poptávka)
- `katalog.html`, `hrad.html?id=N` (detail, render JS), `kosik.html` (poptávka), `studio.html` (3D návrhář), `404.html`
- `js/data.js` katalog 116 modelů (NEMĚNIT ceny/parametry), `js/app.js` vše UI, `js/hero3d.js` 3D úvod, `js/studio.js` 3D studio, `js/vendor/` GSAP 3.12.5 + ScrollTrigger + Lenis (lokálně)
- `css/app.css` vrstvy po iteracích; NA KONCI je „FINALIZACE 10/2026 – tokeny rozložení“ (přebíjí starší vrstvy)
- fonty lokálně v `assets/fonts` (Fredoka, Plus Jakarta Sans, Baloo 2 logo, Caveat ručně psané)

## Tokeny (Weby/_layout-system.md)
`--sec-y: clamp(72px,9vw,144px)` · wrap 1200 + `--gutter: clamp(16px,4vw,32px)` · eyebrow→nadpis 12 · nadpis→text 20 · text→CTA 32 · `--gap: clamp(16px,2vw,24px)` · text max `32em` (~65 znaků).
Výjimky s vlastním rytmem: hero, zamčené scény, balónková Témata, hlavičky podstránek (`--s-block`).

## Výkon (nerozbít!)
- Mobil/dotyk: hero ukazuje poster `assets/hero-hrad.webp`, 3D (`hero3d.js`) se načte až po první interakci (`window.__3dCalm` = bez pádu). Studio totéž s `assets/studio-hrad.webp`.
- Úvod: skripty se vkládají až po prvním vykreslení (inline loader dole v index.html). Scény (piny) na dotyku vznikají až při prvním doteku/scrollu (`ready` v `home()`), po kouscích (`await later()`).
- Detail: inline skript v `hrad.html` přednačítá hlavní fotku; seznam id se studiovou fotkou `[9,16,17,34,54,57,70,81,90,102,111,113]` musí odpovídat `ph` v data.js.
- Animace jen transform/opacity/filter, každá s reduced-motion fallbackem. Žádné `transition` na box-shadow/background.
- Lighthouse mobil (medián 3 běhů, `--disable-gpu`): home 95, katalog 93, detail 92–95, košík 99, studio 94.

## Vzhled hradů
Červená nafukovací podlaha, červený vstupní schod, dveře rozepnuté a srolované. Modrá + žlutá, kreslený × moderní, navy obrysy, tvrdé stíny.

## Kontrola před commitem
`node --check` na změněné JS, audit mezer + screenshoty (Playwright skripty ve scratchpadu: audit.mjs, shoot.mjs), verze assetů `?v=YYYYMMDDx`.

## Stav
Hotovo k prezentaci (2026-10-15). Zbývá: Resend klíč pro skutečné odesílání poptávek, vlastní doména (sitemap/canonical teď na workers.dev), otázky v `Weby/Mirek_schuzka.md`.
