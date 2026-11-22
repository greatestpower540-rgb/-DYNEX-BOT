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
        configured: Boolean(env.OPENAI_API_KEY)
      });
    }

    if (url.pathname !== "/chat") {
      return json({ error: "DYNEX endpoint not found." }, 404);
    }

    if (request.method !== "POST") {
      return json({ error: "POST method required." }, 405);
    }

    if (!env.OPENAI_API_KEY) {
      return json({ error: "AI service is not configured." }, 503);
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
      role: item?.role === "assistant" ? "assistant" : "user",
      content: String(item?.content || "").trim().slice(0, 6000)
    })).filter((item) => item.content);

    if (!messages.length || messages[messages.length - 1].role !== "user") {
      return json({ error: "Your latest message is missing." }, 400);
    }

    try {
      const upstream = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL || "gpt-4o-mini",
          instructions: "You are DYNEX, a friendly, capable general-purpose AI assistant inside the DYNEX BOT mobile app. Be clear, useful, respectful, and honest. Help users learn, write, plan, reason, and solve everyday problems. Match the user's language when possible. Never claim to have performed actions outside this chat. If unsure, say so.",
          input: messages,
          max_output_tokens: 1200,
          store: false
        })
      });

      const result = await upstream.json();

      if (!upstream.ok) {
        return json({
          error: "The AI provider could not complete this request. Check the API key, model access, and billing.",
          provider_status: upstream.status
        }, 502);
      }

      let reply = result.output_text || "";

      if (!reply && Array.isArray(result.output)) {
        reply = result.output
          .filter((item) => item.type === "message")
          .flatMap((item) => item.content || [])
          .filter((part) => part.type === "output_text")
          .map((part) => part.text || "")
          .join("\n");
      }

      if (!reply.trim()) {
        return json({ error: "The AI returned no text. Please try again." }, 502);
      }

      return json({ reply: reply.trim() });
    } catch {
      return json({ error: "Could not connect to the AI provider. Please try again." }, 502);
    }
  }
};
