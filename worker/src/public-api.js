const API_SYSTEM_PROMPT = "You are DYNEX, a helpful general-purpose AI assistant. Be clear, useful, respectful, and honest. Match the user's language when possible.";

function apiJson(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Dynex-Admin-Key",
      "Cache-Control": "no-store"
    }
  });
}

function id() {
  return crypto.randomUUID();
}

function randomKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return "dx_live_" + btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

async function authenticate(request, env) {
  const authorization = request.headers.get("Authorization") || "";
  const match = authorization.match(/^Bearer\s+(dx_live_[A-Za-z0-9_-]{30,})$/);
  if (!match) return { error: apiJson({ error: "A valid DYNEX API key is required.", code: "invalid_api_key" }, 401) };
  const keyHash = await sha256(match[1]);
  const record = await env.DB.prepare(`
    SELECT k.id, k.daily_limit, d.status AS developer_status
    FROM api_keys k
    JOIN api_developers d ON d.id = k.developer_id
    WHERE k.key_hash = ? AND k.status = 'active'
    LIMIT 1
  `).bind(keyHash).first();
  if (!record || record.developer_status !== "active") {
    return { error: apiJson({ error: "This API key is invalid, revoked, or suspended.", code: "invalid_api_key" }, 401) };
  }

  const today = new Date().toISOString().slice(0, 10);
  const usage = await env.DB.prepare(`
    INSERT INTO api_usage_daily (api_key_id, usage_date, request_count)
    VALUES (?, ?, 1)
    ON CONFLICT(api_key_id, usage_date) DO UPDATE
      SET request_count = request_count + 1
      WHERE request_count < ?
    RETURNING request_count
  `).bind(record.id, today, record.daily_limit).first();

  if (!usage) return { error: apiJson({ error: "Daily API request limit reached.", code: "rate_limit_exceeded" }, 429) };
  await env.DB.prepare("UPDATE api_keys SET last_used_at = ? WHERE id = ?")
    .bind(new Date().toISOString(), record.id).run();
  return { keyId: record.id };
}

async function createDeveloper(request, env) {
  if (!env.DYNEX_API_ADMIN_SECRET) {
    return apiJson({ error: "Developer provisioning is not configured." }, 503);
  }
  const supplied = request.headers.get("X-Dynex-Admin-Key") || "";
  if (supplied.length !== env.DYNEX_API_ADMIN_SECRET.length || supplied !== env.DYNEX_API_ADMIN_SECRET) {
    return apiJson({ error: "Not authorized." }, 401);
  }

  let body;
  try { body = await request.json(); } catch { return apiJson({ error: "Invalid JSON body." }, 400); }
  const email = String(body?.email || "").trim().toLowerCase();
  const name = String(body?.name || "Default key").trim().slice(0, 80) || "Default key";
  const dailyLimit = Math.min(10000, Math.max(1, Number.parseInt(body?.daily_limit, 10) || 100));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return apiJson({ error: "A valid developer email is required." }, 400);

  const developerId = id();
  const apiKeyId = id();
  const secret = randomKey();
  const keyHash = await sha256(secret);
  const prefix = secret.slice(0, 16);

  try {
    await env.DB.batch([
      env.DB.prepare("INSERT INTO api_developers (id, email) VALUES (?, ?)").bind(developerId, email),
      env.DB.prepare("INSERT INTO api_keys (id, developer_id, key_hash, key_prefix, name, daily_limit) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(apiKeyId, developerId, keyHash, prefix, name, dailyLimit)
    ]);
  } catch (error) {
    const message = String(error?.message || "");
    if (message.includes("UNIQUE")) return apiJson({ error: "A developer with this email already exists." }, 409);
    return apiJson({ error: "Could not create the developer account." }, 500);
  }

  return apiJson({
    ok: true,
    developer: { id: developerId, email },
    api_key: secret,
    key_warning: "Copy this key now. It is shown only once and cannot be recovered.",
    daily_limit: dailyLimit
  }, 201);
}

async function chat(request, env, keyId) {
  let body;
  try { body = await request.json(); } catch { return apiJson({ error: "Invalid JSON body." }, 400); }
  if (!Array.isArray(body?.messages) || body.messages.length < 1 || body.messages.length > 20) {
    return apiJson({ error: "Send between 1 and 20 messages in a messages array." }, 400);
  }
  const contents = [];
  for (const item of body.messages) {
    const role = item?.role === "assistant" ? "model" : item?.role === "user" ? "user" : null;
    const content = String(item?.content || "").trim().slice(0, 8000);
    if (!role || !content) return apiJson({ error: "Each message needs role 'user' or 'assistant' and non-empty content." }, 400);
    const last = contents[contents.length - 1];
    if (last && last.role === role) last.parts.push({ text: content });
    else contents.push({ role, parts: [{ text: content }] });
  }
  if (contents[contents.length - 1]?.role !== "user") {
    return apiJson({ error: "The final message must be from the user." }, 400);
  }
  if (!env.GEMINI_API_KEY) return apiJson({ error: "The DYNEX chat provider is not configured." }, 503);

  const models = ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite"];
  let lastError = "AI provider is temporarily unavailable.";
  for (const model of models) {
    try {
      const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "x-goog-api-key": env.GEMINI_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: API_SYSTEM_PROMPT }] },
          contents,
          generationConfig: { maxOutputTokens: 1200 }
        })
      });
      const result = await upstream.json().catch(() => ({}));
      if (upstream.ok) {
        const reply = (result.candidates || []).flatMap(candidate => candidate.content?.parts || [])
          .filter(part => typeof part.text === "string").map(part => part.text).join("\n").trim();
        if (reply) {
          await env.DB.prepare("INSERT INTO api_usage_logs (id, api_key_id, endpoint, http_status) VALUES (?, ?, ?, ?)")
            .bind(id(), keyId, "/v1/chat", 200).run();
          return apiJson({ id: id(), object: "chat.completion", model, choices: [{ index: 0, message: { role: "assistant", content: reply }, finish_reason: "stop" }] });
        }
      }
      lastError = result?.error?.message || lastError;
      if (![429, 500, 503].includes(upstream.status)) break;
    } catch (error) {
      lastError = error?.message || lastError;
    }
  }
  await env.DB.prepare("INSERT INTO api_usage_logs (id, api_key_id, endpoint, http_status) VALUES (?, ?, ?, ?)")
    .bind(id(), keyId, "/v1/chat", 502).run();
  return apiJson({ error: "DYNEX AI could not complete the request.", detail: lastError }, 502);
}

export async function handlePublicApi(request, env, url) {
  if (!url.pathname.startsWith("/v1/")) return null;
  if (request.method === "OPTIONS") return apiJson({}, 200);
  if (!env.DB) return apiJson({ error: "DYNEX API database is not connected yet." }, 503);

  if (url.pathname === "/v1/admin/developers" && request.method === "POST") {
    return createDeveloper(request, env);
  }

  if (url.pathname === "/v1/models" && request.method === "GET") {
    const auth = await authenticate(request, env);
    if (auth.error) return auth.error;
    return apiJson({ object: "list", data: [{ id: "dynex-chat", object: "model", capabilities: ["text-generation"] }] });
  }

  if (url.pathname === "/v1/chat" && request.method === "POST") {
    const auth = await authenticate(request, env);
    if (auth.error) return auth.error;
    return chat(request, env, auth.keyId);
  }

  return apiJson({ error: "DYNEX API endpoint not found." }, 404);
}
