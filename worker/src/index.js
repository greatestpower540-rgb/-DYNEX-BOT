const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json; charset=utf-8"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: cors });
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
        provider: "Gemini"
      });
    }

    if (url.pathname !== "/chat") {
      return json({ error: "DYNEX endpoint not found." }, 404);
    }

    if (request.method !== "POST") {
      return json({ error: "POST method required." }, 405);
    }

    if (!env.GEMINI_API_KEY) {
      return json({ error: "Gemini AI service is not configured." }, 503);
    }

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

    // Gemini expects conversation roles to alternate. Merge consecutive turns safely.
    const contents = [];
    for (const message of messages) {
      const last = contents[contents.length - 1];
      if (last && last.role === message.role) {
        last.parts[0].text += "\n\n" + message.content;
      } else {
        contents.push({ role: message.role, parts: [{ text: message.content }] });
      }
    }

    try {
      const upstream = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        {
          method: "POST",
          headers: {
            "x-goog-api-key": env.GEMINI_API_KEY,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{
                text: "You are DYNEX, a friendly, capable general-purpose AI assistant inside the DYNEX BOT mobile app. Be clear, useful, respectful, and honest. Help users learn, write, plan, reason, and solve everyday problems. Match the user's language when possible. Never claim to have performed actions outside this chat. If unsure, say so."
              }]
            },
            contents,
            generationConfig: { maxOutputTokens: 1200 }
          })
        }
      );

      const result = await upstream.json();

      if (!upstream.ok) {
        return json({
          error: result?.error?.message || "Gemini could not complete this request. Check API key access and free-tier limits.",
          provider_status: upstream.status
        }, 502);
      }

      const reply = (result.candidates || [])
        .flatMap((candidate) => candidate.content?.parts || [])
        .filter((part) => typeof part.text === "string")
        .map((part) => part.text)
        .join("\n")
        .trim();

      if (!reply) {
        return json({ error: "Gemini returned no text. Please try again." }, 502);
      }

      return json({ reply });
    } catch {
      return json({ error: "Could not connect to Gemini. Please try again." }, 502);
    }
  }
};
