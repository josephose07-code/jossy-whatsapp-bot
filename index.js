const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

// ─── CONFIG (replace with your real values) ───────────────────────────────────
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "jossy_bot_secret"; // you choose this
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;   // from Meta Developer Portal
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID; // from Meta Developer Portal
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY; // from console.anthropic.com
// ─────────────────────────────────────────────────────────────────────────────

// Store conversation history per user (in-memory, resets on restart)
const conversations = {};

// ── Webhook Verification (Meta requires this on first setup) ──────────────────
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verified!");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// ── Receive Messages ──────────────────────────────────────────────────────────
app.post("/webhook", async (req, res) => {
  const body = req.body;

  if (body.object !== "whatsapp_business_account") return res.sendStatus(404);

  const entry = body.entry?.[0]?.changes?.[0]?.value;
  const message = entry?.messages?.[0];

  if (!message || message.type !== "text") return res.sendStatus(200); // ignore non-text

  const from = message.from;          // sender's phone number
  const userText = message.text.body; // their message

  console.log(`📩 Message from ${from}: ${userText}`);

  try {
    // Build conversation history
    if (!conversations[from]) {
      conversations[from] = [];
    }
    conversations[from].push({ role: "user", content: userText });

    // Keep last 10 messages to avoid token overflow
    if (conversations[from].length > 10) {
      conversations[from] = conversations[from].slice(-10);
    }

    // Call Claude API
    const aiResponse = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: `You are a helpful AI assistant for Jossy Creative Shot — a professional photography and videography brand based in Lagos, Nigeria. You help potential clients learn about our services (weddings, studio shoots, events), pricing, and bookings. Be friendly, professional, and concise. Reply in a conversational WhatsApp style — no long paragraphs.`,
        messages: conversations[from],
      },
      {
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
      }
    );

    const reply = aiResponse.data.content?.[0]?.text || "Sorry, I couldn't process that.";

    // Save assistant reply to history
    conversations[from].push({ role: "assistant", content: reply });

    // Send reply back via WhatsApp
    await sendWhatsAppMessage(from, reply);

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error:", err.response?.data || err.message);
    await sendWhatsAppMessage(from, "Sorry, something went wrong. Please try again shortly! 🙏");
    res.sendStatus(200);
  }
});

// ── Send WhatsApp Message ─────────────────────────────────────────────────────
async function sendWhatsAppMessage(to, text) {
  await axios.post(
    `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    },
    {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
  console.log(`✅ Replied to ${to}`);
}

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.send("Jossy Bot is running! 🚀"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🤖 Bot server running on port ${PORT}`));
