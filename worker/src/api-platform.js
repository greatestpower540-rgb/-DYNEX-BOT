const API_CORS_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "Vary": "Origin"
};
const FREE_MONTHLY_REQUESTS = 1000;
const PAID_MONTHLY_REQUESTS = 50000;
const MODELS = ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite"];

function response(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...API_CORS_HEADERS, ...headers } });
}
function cors(request, env) {
  const origin = request.headers.get("Origin");
  const allowed = env.DYNEX_ALLOWED_ORIGIN || "";
  if (origin && allowed && origin === allowed) {
    return { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400" };
  }
  return { "Access-Control-Allow-Origin": allowed || "null",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization" };
}
const json = (request, env, data, status = 200, extra = {}) =>
  response(data, status, { ...cors(request, env), ...extra });

function randomHex(bytes = 32) {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return [...data].map(x => x.toString(16).padStart(2, "0")).join("");
}
async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
}
async function passwordHash(password, salt) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: new TextEncoder().encode(salt), iterations: 210000, hash: "SHA-256" }, key, 256);
  return [...new Uint8Array(bits)].map(x => x.toString(16).padStart(2, "0")).join("");
}
function cookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  const found = header.split(";").map(x => x.trim()).find(x => x.startsWith(name + "="));
  return found ? decodeURIComponent(found.slice(name.length + 1)) : "";
}
function sessionCookie(token, maxAge = 60 * 60 * 24 * 30) {
  return `dynex_dev_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${maxAge}`;
}
async function bodyJson(request) {
  try { return await request.json(); } catch { return null; }
}
function id() { return crypto.randomUUID(); }
function monthStart() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString().slice(0, 19).replace("T", " ");
}
async function developerFromSession(request, env) {
  if (!env.DYNEX_DB) return null;
  const token = cookie(request, "dynex_dev_session");
  if (!token) return null;
  const hash = await sha256(token);
  return env.DYNEX_DB.prepare(`SELECT d.id,d.email,d.plan,d.status FROM developer_sessions s
    JOIN developers d ON d.id=s.developer_id WHERE s.token_hash=? AND s.expires_at > datetime('now')`)
    .bind(hash).first();
}
async function issueSession(db, developerId) {
  const token = randomHex(32);
  await db.prepare("INSERT INTO developer_sessions(token_hash,developer_id,expires_at) VALUES(?,?,datetime('now','+30 days'))")
    .bind(await sha256(token), developerId).run();
  return token;
}
async function requireDb(request, env) {
  if (!env.DYNEX_DB) return json(request, env, { error: "API platform database is not configured. Create the DYNEX_API D1 database, apply worker/migrations/0001_api_platform.sql, and bind it as DYNEX_DB." }, 503);
  return null;
}
async function handleDeveloperRoutes(request, env, url) {
  const dbError = await requireDb(request, env);
  if (dbError) return dbError;
  const db = env.DYNEX_DB;
  const path = url.pathname;

  if (path === "/developers/register" && request.method === "POST") {
    const body = await bodyJson(request);
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 10 || password.length > 128)
      return json(request, env, { error: "Enter a valid email and a password of 10–128 characters." }, 400);
    const existing = await db.prepare("SELECT id FROM developers WHERE email=?").bind(email).first();
    if (existing) return json(request, env, { error: "An account with this email already exists." }, 409);
    const salt = randomHex(16);
    const hash = await passwordHash(password, salt);
    const developerId = id();
    try {
      await db.prepare("INSERT INTO developers(id,email,password_hash,password_salt) VALUES(?,?,?,?)")
        .bind(developerId, email, hash, salt).run();
    } catch { return json(request, env, { error: "Could not create this account." }, 500); }
    const token = await issueSession(db, developerId);
    return json(request, env, { ok: true, developer: { id: developerId, email, plan: "free" } }, 201,
      { "Set-Cookie": sessionCookie(token) });
  }

  if (path === "/developers/login" && request.method === "POST") {
    const body = await bodyJson(request);
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    const user = await db.prepare("SELECT * FROM developers WHERE email=?").bind(email).first();
    if (!user || user.status !== "active" || await passwordHash(password, user.password_salt) !== user.password_hash)
      return json(request, env, { error: "Email or password is incorrect, or this account is unavailable." }, 401);
    const token = await issueSession(db, user.id);
    await db.prepare("UPDATE developers SET last_login_at=datetime('now') WHERE id=?").bind(user.id).run();
    return json(request, env, { ok: true, developer: { id: user.id, email: user.email, plan: user.plan } }, 200,
      { "Set-Cookie": sessionCookie(token) });
  }

  if (path === "/developers/logout" && request.method === "POST") {
    const token = cookie(request, "dynex_dev_session");
    if (token) await db.prepare("DELETE FROM developer_sessions WHERE token_hash=?").bind(await sha256(token)).run();
    return json(request, env, { ok: true }, 200, { "Set-Cookie": sessionCookie("", 0) });
  }

  const developer = await developerFromSession(request, env);
  if (path === "/developers/me" && request.method === "GET") {
    if (!developer) return json(request, env, { authenticated: false }, 200);
    const start = monthStart();
    const usage = await db.prepare("SELECT COALESCE(SUM(request_count),0) AS total FROM api_usage WHERE developer_id=? AND created_at>=?")
      .bind(developer.id, start).first();
    const keyCount = await db.prepare("SELECT COUNT(*) AS total FROM developer_api_keys WHERE developer_id=? AND status='active'")
      .bind(developer.id).first();
    const limit = developer.plan === "paid" ? PAID_MONTHLY_REQUESTS : FREE_MONTHLY_REQUESTS;
    return json(request, env, { authenticated: true, developer: { id: developer.id, email: developer.email, plan: developer.plan, status: developer.status },
      usage: { requests: usage?.total || 0, limit, remaining: Math.max(0, limit - (usage?.total || 0)), period: "monthly" }, active_keys: keyCount?.total || 0 });
  }

  if (path.startsWith("/developers/")) {
    if (!developer) return json(request, env, { error: "Sign in to your DYNEX developer account." }, 401);
    if (developer.status !== "active") return json(request, env, { error: "Developer account is suspended." }, 403);
    if (path === "/developers/keys" && request.method === "GET") {
      const keys = await db.prepare("SELECT id,name,key_prefix,status,created_at,last_used_at FROM developer_api_keys WHERE developer_id=? ORDER BY created_at DESC")
        .bind(developer.id).all();
      return json(request, env, { keys: keys.results || [] });
    }
    if (path === "/developers/keys" && request.method === "POST") {
      const body = await bodyJson(request);
      const name = String(body?.name || "My API key").trim().slice(0, 48);
      if (!name) return json(request, env, { error: "Give this API key a name." }, 400);
      const count = await db.prepare("SELECT COUNT(*) AS total FROM developer_api_keys WHERE developer_id=? AND status='active'").bind(developer.id).first();
      if ((count?.total || 0) >= 5) return json(request, env, { error: "You can have up to 5 active API keys." }, 429);
      const rawKey = "dnx_live_" + randomHex(32);
      const keyId = id();
      await db.prepare("INSERT INTO developer_api_keys(id,developer_id,name,key_prefix,key_hash) VALUES(?,?,?,?,?)")
        .bind(keyId, developer.id, name, rawKey.slice(0, 17), await sha256(rawKey)).run();
      return json(request, env, { key: rawKey, id: keyId, warning: "Copy this key now. It will not be shown again." }, 201);
    }
    const revoke = path.match(/^\/developers\/keys\/([0-9a-f-]+)$/);
    if (revoke && request.method === "DELETE") {
      const result = await db.prepare("UPDATE developer_api_keys SET status='revoked' WHERE id=? AND developer_id=? AND status='active'")
        .bind(revoke[1], developer.id).run();
      return json(request, env, { ok: (result.meta?.changes || 0) > 0 }, (result.meta?.changes || 0) ? 200 : 404);
    }
  }
  return null;
}

async function handlePublicApi(request, env) {
  if (request.method !== "POST") return response({ error: "POST method required." }, 405);
  if (!env.DYNEX_DB) return response({ error: "API platform is not configured." }, 503);
  if (!env.GEMINI_API_KEY) return response({ error: "DYNEX AI provider is not configured." }, 503);
  const authorization = request.headers.get("Authorization") || "";
  const match = authorization.match(/^Bearer\s+(dnx_live_[a-f0-9]{64})$/i);
  if (!match) return response({ error: "A valid DYNEX API key is required in the Authorization: Bearer header." }, 401);
  const keyHash = await sha256(match[1]);
  const record = await env.DYNEX_DB.prepare(`SELECT k.id AS key_id,k.developer_id,d.plan,d.status
    FROM developer_api_keys k JOIN developers d ON d.id=k.developer_id
    WHERE k.key_hash=? AND k.status='active'`).bind(keyHash).first();
  if (!record || record.status !== "active") return response({ error: "Invalid or revoked DYNEX API key." }, 401);
  const start = monthStart();
  const usage = await env.DYNEX_DB.prepare("SELECT COALESCE(SUM(request_count),0) AS total FROM api_usage WHERE developer_id=? AND created_at>=?")
    .bind(record.developer_id, start).first();
  const limit = record.plan === "paid" ? PAID_MONTHLY_REQUESTS : FREE_MONTHLY_REQUESTS;
  if ((usage?.total || 0) >= limit) return response({ error: "Monthly API request limit reached.", plan: record.plan, limit, upgrade: "/developers.html#plans" }, 429);
  let body = await bodyJson(request);
  if (!body || !Array.isArray(body.messages) || !body.messages.length || body.messages.length > 30)
    return response({ error: "Send a messages array containing 1–30 messages." }, 400);
  const messages = body.messages.map(m => ({
    role: m?.role === "assistant" ? "model" : "user",
    content: String(m?.content || "").trim().slice(0, 12000)
  })).filter(m => m.content && ["user", "model"].includes(m.role));
  if (!messages.length || messages[messages.length - 1].role !== "user")
    return response({ error: "The last message must be a non-empty user message." }, 400);
  const contents = [];
  for (const item of messages) {
    const last = contents[contents.length - 1];
    if (last && last.role === item.role) last.parts.push({ text: item.content });
    else contents.push({ role: item.role, parts: [{ text: item.content }] });
  }
  const requestedModel = String(body.model || "dynex-chat");
  let answer = "";
  let usedModel = "";
  let lastStatus = 503;
  for (const model of MODELS) {
    try {
      const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "x-goog-api-key": env.GEMINI_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: "You are DYNEX, a helpful, accurate AI assistant. Be clear, useful, respectful, and honest." }] },
          contents,
          generationConfig: { maxOutputTokens: Math.min(2048, Math.max(128, Number(body.max_tokens) || 900)) }
        })
      });
      const data = await upstream.json().catch(() => ({}));
      if (upstream.ok) {
        answer = (data.candidates || []).flatMap(c => c.content?.parts || []).filter(p => typeof p.text === "string").map(p => p.text).join("\n").trim();
        if (answer) { usedModel = model; break; }
      }
      lastStatus = upstream.status;
      if (![429, 500, 503].includes(upstream.status)) break;
    } catch { lastStatus = 502; }
  }
  if (!answer) return response({ error: "DYNEX could not complete this request right now.", provider_status: lastStatus }, 503);
  await env.DYNEX_DB.batch([
    env.DYNEX_DB.prepare("INSERT INTO api_usage(developer_id,api_key_id,endpoint,model) VALUES(?,?,?,?)")
      .bind(record.developer_id, record.key_id, "/v1/chat/completions", usedModel),
    env.DYNEX_DB.prepare("UPDATE developer_api_keys SET last_used_at=datetime('now') WHERE id=?").bind(record.key_id)
  ]);
  const created = Math.floor(Date.now() / 1000);
  return response({
    id: "chatcmpl-" + randomHex(12), object: "chat.completion", created,
    model: requestedModel, provider_model: usedModel,
    choices: [{ index: 0, message: { role: "assistant", content: answer }, finish_reason: "stop" }],
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, note: "Token metering is not yet enabled; request quotas apply." }
  }, 200);
}

async function handleAdminApi(request, env, url) {
  if (!env.DYNEX_ADMIN_SECRET) return response({ error: "DYNEX_ADMIN_SECRET is not configured." }, 503);
  if (request.headers.get("Authorization") !== `Bearer ${env.DYNEX_ADMIN_SECRET}`) return response({ error: "Unauthorized." }, 401);
  if (!env.DYNEX_DB) return response({ error: "DYNEX_DB is not configured." }, 503);
  if (url.pathname === "/admin/api/developers" && request.method === "GET") {
    const rows = await env.DYNEX_DB.prepare(`SELECT d.id,d.email,d.plan,d.status,d.created_at,
      (SELECT COUNT(*) FROM developer_api_keys k WHERE k.developer_id=d.id AND k.status='active') AS active_keys,
      (SELECT COALESCE(SUM(u.request_count),0) FROM api_usage u WHERE u.developer_id=d.id AND u.created_at>=datetime('now','start of month')) AS monthly_requests
      FROM developers d ORDER BY d.created_at DESC LIMIT 200`).all();
    return response({ developers: rows.results || [] });
  }
  const match = url.pathname.match(/^\/admin\/api\/developers\/([0-9a-f-]+)$/);
  if (match && request.method === "POST") {
    const body = await bodyJson(request);
    const plan = body?.plan;
    const status = body?.status;
    if (!["free", "paid"].includes(plan) || !["active", "suspended"].includes(status))
      return response({ error: "Provide plan (free|paid) and status (active|suspended)." }, 400);
    const result = await env.DYNEX_DB.prepare("UPDATE developers SET plan=?,status=? WHERE id=?").bind(plan, status, match[1]).run();
    return response({ ok: (result.meta?.changes || 0) > 0 });
  }
  return null;
}

export async function handleApiPlatform(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (!path.startsWith("/developers/") && path !== "/developers" && !path.startsWith("/v1/") && !path.startsWith("/admin/api/")) return null;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(request, env) });
  if (path.startsWith("/v1/")) {
    if (path === "/v1/models" && request.method === "GET") return response({ object: "list", data: [{ id: "dynex-chat", object: "model", owned_by: "dynex" }] });
    if (path === "/v1/chat/completions") return handlePublicApi(request, env);
    return response({ error: "DYNEX API endpoint not found." }, 404);
  }
  if (path.startsWith("/admin/api/")) return (await handleAdminApi(request, env, url)) || response({ error: "Admin API endpoint not found." }, 404);
  return (await handleDeveloperRoutes(request, env, url)) || json(request, env, { error: "Developer endpoint not found." }, 404);
}
