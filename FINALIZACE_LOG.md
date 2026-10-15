# FINALIZACE_LOG – Skákací hrady prodej

Cíl: „Připraveno pro Mirka“. Tokeny rozložení: `../_layout-system.md` (Obsidian `Weby/`). Audit: Playwright `audit.mjs` (1440 / 768 / 390).

| datum | co | proč | skóre |
|---|---|---|---|
| 2026-10-15 | Tokenová vrstva v `app.css` (sekce `clamp(72px,9vw,144px)`, wrap 1200, gutter, eyebrow 12 / nadpis→text 20 / text→CTA 32, jeden gap mřížek), FAQ + asistent ve 2 sloupcích, patička s odkazy a kontaktem, matné pozadí navigace při scrollu | audit mezer měl 214 odchylek → 0; logo jezdilo přes obsah | 7 → 8 |
| 2026-10-15 | Animace jen transform/opacity: kurzor (scale), záře balónku, řádky účtenky, slunce bez neustálého repaintu, bez `transition` na box-shadow/background | pravidlo 60 fps | 8 |
| 2026-10-15 | Detail: poznámka k fukaru (doplatek 7 000 / 10 000 Kč), balení vč. fukaru a záruky 1 rok, sezónní cena v AA kontrastu | zadání detailu | 8 |
| 2026-10-15 | 404 se dvěma CTA, favicon (SVG + PNG + apple), OG obrázek 1200×630 WebP, canonical, twitter card, sitemap.xml (120 URL), robots.txt | SEO/sdílení | 8 |
| 2026-10-15 | Poptávka: bez klíče Resend API vrací 200 + mailto fallback s jasným potvrzením (žádná chyba v konzoli), prázdný pruh „V poptávce“ skrytý | flow košík → odeslání | 8 |
