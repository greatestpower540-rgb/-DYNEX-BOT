const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json; charset=utf-8"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: cors });
}

const SYSTEM_PROMPT = "You are DYNEX, a friendly, capable general-purpose AI assistant inside the DYNEX BOT mobile app. Be clear, useful, respectful, and honest. Help users learn, write, plan, reason, and solve everyday problems. Match the user's language when possible. Never claim to have performed actions outside this chat. If unsure, say so.";

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (url.pathname === "/" && request.method === "GET") {
      return json({ ok: true, service: "DYNEX BOT AI", message: "DYNEX AI server is running." });
    }

    if (url.pathname === "/health" && request.method === "GET") {
      return json({
        ok: true,
        service: "DYNEX BOT AI",
        configured: Boolean(env.GEMINI_API_KEY),
        provider: "Gemini",
        models: ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite"]
      });
    }

    if (url.pathname !== "/chat") return json({ error: "DYNEX endpoint not found." }, 404);
    if (request.method !== "POST") return json({ error: "POST method required." }, 405);
    if (!env.GEMINI_API_KEY) return json({ error: "Gemini AI service is not configured." }, 503);

    let body;
    try {
      const length = Number(request.headers.get("content-length") || 0);
      if (length > 30000) return json({ error: "Message is too large." }, 413);
      body = await request.json();
    } catch {
      return json({ error: "Invalid request body." }, 400);
    }

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return json({ error: "Please send a messages array." }, 400);
    }

    const messages = body.messages.slice(-20).map((item) => ({
      role: item?.role === "assistant" ? "model" : "user",
      content: String(item?.content || "").trim().slice(0, 6000)
    })).filter((item) => item.content);

    if (!messages.length || messages[messages.length - 1].role !== "user") {
      return json({ error: "Your latest message is missing." }, 400);
    }

    const contents = [];
    for (const message of messages) {
      const last = contents[contents.length - 1];
      if (last && last.role === message.role) {
        last.parts[0].text += "\n\n" + message.content;
      } else {
        contents.push({ role: message.role, parts: [{ text: message.content }] });
      }
    }

    const models = ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite"];
    let lastStatus = 503;
    let lastError = "Gemini is temporarily busy. Please try again shortly.";

    for (const model of models) {
      // One bounded retry for temporary capacity/rate-limit responses, then fall back.
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const upstream = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
            {
              method: "POST",
              headers: {
                "x-goog-api-key": env.GEMINI_API_KEY,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
                contents,
                generationConfig: { maxOutputTokens: 900 }
              })
            }
          );

          const result = await upstream.json().catch(() => ({}));

          if (upstream.ok) {
            const reply = (result.candidates || [])
              .flatMap((candidate) => candidate.content?.parts || [])
              .filter((part) => typeof part.text === "string")
              .map((part) => part.text)
              .join("\n")
              .trim();

            if (reply) return json({ reply, model });
            lastError = "Gemini returned no text. Please try again.";
            lastStatus = 502;
            break;
          }

          lastStatus = upstream.status;
          lastError = result?.error?.message || "Gemini could not complete this request.";
          if (upstream.status !== 503 && upstream.status !== 429 && upstream.status !== 500) {
            return json({ error: lastError, provider_status: lastStatus, model }, 502);
          }
        } catch {
          lastError = "Could not connect to Gemini. Please try again.";
          lastStatus = 502;
          break;
        }

        if (attempt === 0) await wait(700);
      }
    }

    return json({
      error: "Gemini models are busy right now. DYNEX tried its available free models; please try again in a little while.",
      provider_status: lastStatus,
      detail: lastError
    }, 503);
  }
};
