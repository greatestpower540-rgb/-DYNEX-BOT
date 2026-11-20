
require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const crypto = require("crypto");

const app = express();

app.disable("x-powered-by");
app.use(helmet());

const PORT = Number(process.env.PORT) || 3000;

const processedMessages = new Map();

const config = {
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
  appSecret: process.env.WHATSAPP_APP_SECRET,
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  apiVersion: process.env.WHATSAPP_API_VERSION,
  autoReply: process.env.AUTO_REPLY_ENABLED === "true",
  defaultReply:
    process.env.DEFAULT_AUTO_REPLY ||
    "Thanks for contacting us! We have received your message."
};

/* =================================
   CONFIGURATION CHECK
================================= */

function isConfigured() {
  return Boolean(
    config.verifyToken &&
    config.appSecret &&
    config.accessToken &&
    config.phoneNumberId &&
    config.apiVersion &&
    config.apiVersion !== "vXX.X"
  );
}

/* =================================
   WEBHOOK SIGNATURE VERIFICATION
================================= */

function verifySignature(rawBody, signature) {
  if (!config.appSecret || !signature) {
    return false;
  }

  const expected =
    "sha256=" +
    crypto
      .createHmac("sha256", config.appSecret)
      .update(rawBody)
      .digest("hex");

  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  return (
    receivedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

/* =================================
   HEALTH CHECK
================================= */

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    application: "DYNEX BOT",
    server: "online",
    whatsappConfigured: isConfigured(),
    autoReplyEnabled: config.autoReply,
    time: new Date().toISOString()
  });
});

/* =================================
   WHATSAPP WEBHOOK VERIFICATION
================================= */

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (!config.verifyToken) {
    return res.status(503).send("Webhook is not configured.");
  }

  if (
    mode === "subscribe" &&
    typeof token === "string" &&
    token === config.verifyToken &&
    typeof challenge === "string"
  ) {
    console.log("DYNEX BOT: WhatsApp webhook verified.");

    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

/* =================================
   SEND WHATSAPP TEXT MESSAGE
================================= */

async function sendWhatsAppMessage(to, message) {
  if (!isConfigured()) {
    throw new Error("WhatsApp API credentials are incomplete.");
  }

  const url =
    `https://graph.facebook.com/${config.apiVersion}/` +
    `${config.phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: "POST",

    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: {
        preview_url: false,
        body: message
      }
    })
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error?.message || "WhatsApp message delivery failed."
    );
  }

  return result;
}

/* =================================
   HANDLE INCOMING MESSAGES
================================= */

async function handleIncomingMessage(message) {
  if (!message || !message.id || !message.from) {
    return;
  }

  // Ignore duplicate webhook deliveries.
  if (processedMessages.has(message.id)) {
    return;
  }

  processedMessages.set(message.id, Date.now());

  // Keep the temporary cache bounded.
  if (processedMessages.size > 5000) {
    const oldest = processedMessages.keys().next().value;
    processedMessages.delete(oldest);
  }

  console.log("DYNEX BOT: Incoming message received.");

  if (!config.autoReply) {
    return;
  }

  if (message.type !== "text") {
    return;
  }

  try {
    await sendWhatsAppMessage(
      message.from,
      config.defaultReply
    );

    console.log("DYNEX BOT: Automatic reply submitted.");
  } catch (error) {
    console.error("DYNEX BOT reply error:", error.message);
  }
}

/* =================================
   PROCESS WEBHOOK EVENTS
================================= */

async function processWebhook(payload) {
  if (payload.object !== "whatsapp_business_account") {
    return;
  }

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};

      for (const message of value.messages || []) {
        await handleIncomingMessage(message);
      }
    }
  }
}

/* =================================
   RECEIVE WHATSAPP WEBHOOK
================================= */

app.post(
  "/webhook",
  express.raw({
    type: "application/json",
    limit: "1mb"
  }),
  (req, res) => {
    if (!Buffer.isBuffer(req.body)) {
      return res.sendStatus(400);
    }

    const signature = req.get("X-Hub-Signature-256");

    if (!verifySignature(req.body, signature)) {
      console.warn("DYNEX BOT: Invalid webhook signature.");
      return res.sendStatus(401);
    }

    let payload;

    try {
      payload = JSON.parse(req.body.toString("utf8"));
    } catch {
      return res.sendStatus(400);
    }

    // Acknowledge Meta promptly, then process the event.
    res.sendStatus(200);

    processWebhook(payload).catch(error => {
      console.error("DYNEX BOT webhook processing error:", error.message);
    });
  }
);

/* =================================
   ERROR HANDLER
================================= */

app.use((err, req, res, next) => {
  console.error("DYNEX BOT server error:", err.message);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    success: false,
    message: "An internal server error occurred."
  });
});

/* =================================
   START SERVER
================================= */

app.listen(PORT, () => {
  console.log("--------------------------------");
  console.log("       DYNEX BOT SERVER");
  console.log("--------------------------------");
  console.log(`Server running on port ${PORT}`);
  console.log(`WhatsApp configured: ${isConfigured()}`);
  console.log("--------------------------------");
});
              
