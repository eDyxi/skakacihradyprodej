const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json; charset=utf-8" } });
const esc = (v) => String(v ?? "").replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c])).slice(0, 4000);

async function poptavka(req, env) {
  if (req.method !== "POST") return json({ ok: false }, 405);
  if (!env.RESEND_API_KEY || !env.MAIL_TO || !env.MAIL_FROM) return json({ ok: false, fallback: "mailto" }, 503);
  let d;
  try { d = await req.json(); } catch { return json({ ok: false, error: "bad_json" }, 400); }
  if (d.web) return json({ ok: true }); // honeypot
  if (!d.jmeno || !(d.email || d.telefon)) return json({ ok: false, error: "missing" }, 422);
  const items = Array.isArray(d.kosik) ? d.kosik.map((i) => `<li>${esc(i.nazev)} (č. ${esc(i.id)}) – ${esc(i.fukar || "bez fukaru")} – ${esc(i.cena)} Kč</li>`).join("") : "";
  const html = `<h2>Nová poptávka – skakacihradyprodej.cz</h2><p><b>${esc(d.jmeno)}</b><br>${esc(d.email)}<br>${esc(d.telefon)}<br>${esc(d.mesto)}</p><ul>${items}</ul><p>${esc(d.zprava)}</p>`;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: env.MAIL_FROM, to: env.MAIL_TO.split(","), reply_to: d.email || undefined, subject: `Poptávka: ${esc(d.jmeno)}`, html }),
  });
  return r.ok ? json({ ok: true }) : json({ ok: false, fallback: "mailto" }, 502);
}

export default {
  async fetch(req, env) {
    const { pathname } = new URL(req.url);
    if (pathname === "/api/poptavka") return poptavka(req, env);
    if (pathname.startsWith("/api/")) return json({ ok: false }, 404);
    return env.ASSETS.fetch(req);
  },
};
