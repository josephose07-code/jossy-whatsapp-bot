const express = require("express");
const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "jossy_bot_secret";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const conversations = {};

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

app.post("/webhook", async (req, res) => {
  const body = req.body;
  if (body.object !== "whatsapp_business_account") return res.sendStatus(404);
  const entry = body.entry?.[0]?.changes?.[0]?.value;
  const message = entry?.messages?.[0];
  if (!message || message.type !== "text") return res.sendStatus(200);

  const from = message.from;
  const userText = message.text.body;
  console.log(`📩 Message from ${from}: ${userText}`);

  try {
    if (!conversations[from]) conversations[from] = [];
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: `You are a friendly AI assistant for Jossy Creative Shot — a professional photography and videography brand in Lagos, Nigeria. Help clients with info about weddings, studio shoots, events, pricing and bookings. Be warm and concise like a WhatsApp conversation.`,
    });
    const chat = model.startChat({ history: conversations[from] });
    const result = await chat.sendMessage(userText);
    const reply = result.response.text();
    conversations[from].push({ role: "user", parts: [{ text: userText }] });
    conversations[from].push({ role: "model", parts: [{ text: reply }] });
    if (conversations[from].length > 20) conversations[from] = conversations[from].slice(-20);
    await sendWhatsAppMessage(from, reply);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error:", err.message);
    await sendWhatsAppMessage(from, "Sorry, something went wrong. Please try again! 🙏");
    res.sendStatus(200);
  }
});

async function sendWhatsAppMessage(to, text) {
  await axios.post(
    `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
    { messaging_product: "whatsapp", to, type: "text", text: { body: text } },
    { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" } }
  );
}

app.get("/", (req, res) => res.send("Jossy Bot is running! 🚀"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🤖 Bot running on port ${PORT}`));
