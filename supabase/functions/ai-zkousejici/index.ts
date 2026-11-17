// Maturitní deska – AI zkoušející zdarma (Supabase Edge Function → Groq / jiné OpenAI-kompatibilní API)
// Klíč k AI je jen tady na serveru (secret AI_KEY), do hry ani na GitHub se nedostane.
import { createClient } from "jsr:@supabase/supabase-js@2";

const env = (k: string, d = "") => Deno.env.get(k) ?? d;
const AI_URL = env("AI_BASE_URL", "https://api.groq.com/openai/v1").replace(/\/$/, "");
const AI_KEY = env("AI_KEY");
// víc modelů za sebou: každý má na Groqu vlastní free limit, při vyčerpání se zkusí další
const AI_MODELS = env("AI_MODELS", "").split(",").map((m) => m.trim()).filter(Boolean);   // volitelně: vlastní pořadí
// pořadí podle kvality češtiny; skutečně dostupné modely se zjistí u poskytovatele (GET /models)
const PREFER = ["llama-4-maverick", "gpt-oss-120b", "llama-4-scout", "llama-3.3-70b", "kimi-k2", "qwen3", "gpt-oss-20b", "gemma", "llama-3.1-8b"];
let modelCache: { at: number; ids: string[] } | null = null;
async function chatModels(): Promise<string[]> {
  if (modelCache && Date.now() - modelCache.at < 3600_000) return modelCache.ids;
  let ids: string[] = [];
  try {
    const r = await fetch(AI_URL + "/models", { headers: { "Authorization": "Bearer " + AI_KEY } });
    if (r.ok) {
      const j = await r.json();
      ids = (j?.data ?? []).map((m: any) => String(m?.id ?? "")).filter((id: string) => id && !/whisper|guard|tts|playai|orpheus|compound|allam|distil|embed|vision-preview/i.test(id));
    }
  } catch { /* fallback níž */ }
  const rank = (id: string) => { const i = PREFER.findIndex((p) => id.includes(p)); return i < 0 ? 99 : i; };
  ids = ids.filter((id) => rank(id) < 99).sort((a, b) => rank(a) - rank(b));
  const fixed = AI_MODELS.length ? AI_MODELS : [];
  const all = [...fixed, ...ids.filter((id) => !fixed.includes(id))];
  const out = all.length ? all : ["openai/gpt-oss-120b", "llama-3.3-70b-versatile"];
  if (ids.length) modelCache = { at: Date.now(), ids: out };
  return out;
}
const STT_MODELS = env("AI_STT_MODELS", "whisper-large-v3,whisper-large-v3-turbo").split(",").map((m) => m.trim()).filter(Boolean);
const LIMIT_PLAYER = Number(env("AI_LIMIT_PLAYER", "80"));   // dotazů na hráče za den
const LIMIT_IP = Number(env("AI_LIMIT_IP", "200"));          // dotazů z jedné IP za den (škola = jedna IP)
const LIMIT_ALL = Number(env("AI_LIMIT_ALL", "900"));        // dotazů celkem za den (pod free limitem Groqu)

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "apikey, authorization, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { code: "method" });
  if (!AI_KEY) return json(500, { code: "no_key", message: "Na serveru chybí AI_KEY." });

  let body: any;
  try { body = await req.json(); } catch { return json(400, { code: "bad_request" }); }
  const player = typeof body?.player === "string" && /^[\w-]{8,64}$/.test(body.player) ? body.player : "";
  if (!player) return json(400, { code: "bad_request" });
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "?";
  const sb = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));
  const take = async () => {
    const { data: verdict, error } = await sb.rpc("ai_take", { p_player: player, p_ip: ip, lp: LIMIT_PLAYER, li: LIMIT_IP, lg: LIMIT_ALL });
    if (error) return json(500, { code: "upstream_error", message: "Počítadlo limitů nefunguje (spusť AI-ZKOUSEJICI.sql)." });
    if (verdict !== "ok") {
      const why = verdict === "player" ? "Dnes jsi vyčerpal svůj limit AI. Zítra zase." : verdict === "ip" ? "Z této sítě je dnešní limit AI vyčerpaný." : "Dnešní limit AI pro celou třídu je vyčerpaný. Zítra zase.";
      return json(429, { code: "rate_limited", message: why });
    }
    return null;
  };

  // ---- mluvení → text (Whisper) ----
  if (body?.kind === "stt") {
    const b64 = typeof body.audio === "string" ? body.audio : "";
    if (!b64 || b64.length > 6_000_000) return json(413, { code: "too_long", message: "Nahrávka je moc dlouhá." });
    const lim = await take(); if (lim) return lim;
    let bytes: Uint8Array;
    try { bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)); } catch { return json(400, { code: "bad_request" }); }
    const mime = typeof body.mime === "string" && /^audio\/[\w.+-]+(;.*)?$/.test(body.mime) ? body.mime : "audio/webm";
    const ext = mime.includes("ogg") ? "ogg" : mime.includes("mp4") ? "m4a" : mime.includes("wav") ? "wav" : "webm";
    let last = 0;
    for (const model of STT_MODELS) {
      const fd = new FormData();
      fd.append("file", new Blob([bytes], { type: mime.split(";")[0] }), "rec." + ext);
      fd.append("model", model); fd.append("language", "cs");
      if (typeof body.prompt === "string" && body.prompt.trim()) fd.append("prompt", body.prompt.slice(0, 800)); fd.append("response_format", "json"); fd.append("temperature", "0");
      const up = await fetch(AI_URL + "/audio/transcriptions", { method: "POST", headers: { "Authorization": "Bearer " + AI_KEY }, body: fd }).catch(() => null);
      if (up && up.ok) { const j = await up.json().catch(() => ({})); return json(200, { text: String(j?.text ?? "").trim() }); }
      last = up ? up.status : 0; if (up) await up.body?.cancel();
      if (last === 401 || last === 403) return json(502, { code: "auth", message: "Klíč AI_KEY na serveru nefunguje." });
    }
    return json(last === 429 ? 429 : 502, last === 429 ? { code: "busy", message: "Přepis řeči je teď přetížený. Zkus to za chvíli." } : { code: "upstream_error", message: "Přepis řeči nefunguje (" + last + ")." });
  }

  if (body?.kind === "models") return json(200, { chat: await chatModels(), stt: STT_MODELS });

  const system = typeof body?.system === "string" ? body.system : "";
  const msgs = Array.isArray(body?.messages) ? body.messages : [];
  if (msgs.length < 1 || msgs.length > 40 || system.length > 24000) return json(400, { code: "bad_request" });
  const messages = msgs.map((m: any) => ({ role: m?.role === "assistant" ? "assistant" : "user", content: String(m?.content ?? "").slice(0, 6000) }));
  if (messages.reduce((s: number, m: any) => s + m.content.length, 0) > 40000) return json(413, { code: "too_long" });

  // denní limity (atomicky v databázi)
  const lim = await take(); if (lim) return lim;

  let last = 0; const tried: string[] = [];
  for (const model of (await chatModels()).slice(0, 6)) {
    const payload: Record<string, unknown> = {
      model, stream: true, temperature: 0.6, max_completion_tokens: 1200,
      messages: [{ role: "system", content: system }, ...messages],
    };
    if (model.includes("gpt-oss")) payload.reasoning_effort = "low";
    const up = await fetch(AI_URL + "/chat/completions", {
      method: "POST",
      headers: { "Authorization": "Bearer " + AI_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null);
    if (up && up.ok) {
      return new Response(up.body, { headers: { ...cors, "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "X-AI-Model": model } });
    }
    last = up ? up.status : 0; tried.push(model.split("/").pop() + ":" + last);
    if (up) await up.body?.cancel();
    if (last === 404) modelCache = null;
    if (last === 401 || last === 403) return json(502, { code: "auth", message: "Klíč AI_KEY na serveru nefunguje." });
    // 429 = limit modelu, 404/400 = model už neexistuje, 5xx = výpadek → zkus další model
  }
  const anyBusy = tried.some((x) => x.endsWith(":429"));
  return json(anyBusy ? 429 : 502, anyBusy
    ? { code: "busy", message: "AI je teď přetížená (free limit). Zkus to za minutu.", tried }
    : { code: "upstream_error", message: "AI služba neodpovídá (" + tried.join(", ") + ").", tried });
});
