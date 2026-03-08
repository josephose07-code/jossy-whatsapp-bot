# jossy-whatsapp-bot
for my chatbot
# 🤖 Jossy Creative Shot — WhatsApp AI Bot

## What This Does
Automatically replies to WhatsApp messages using Claude AI, customized for your photography brand.

---

## Setup Guide (Step by Step)

### STEP 1 — Get your Meta API credentials
1. Go to https://developers.facebook.com → Create App → Choose "Business"
2. Add **WhatsApp** product to your app
3. Under WhatsApp > API Setup, note down:
   - **Phone Number ID**
   - **Temporary Access Token** (get a permanent one later)
4. Choose a **Verify Token** — any secret word, e.g. `jossy_bot_secret`

### STEP 2 — Get your Anthropic API Key
1. Go to https://console.anthropic.com
2. Create an account and generate an API key

### STEP 3 — Deploy to Render (free)
1. Push this folder to a GitHub repo
2. Go to https://render.com → New Web Service → Connect your repo
3. Set these Environment Variables in Render:
   - `VERIFY_TOKEN` = your chosen verify token (e.g. jossy_bot_secret)
   - `WHATSAPP_TOKEN` = your Meta access token
   - `PHONE_NUMBER_ID` = your Meta phone number ID
   - `ANTHROPIC_API_KEY` = your Anthropic API key
4. Set Start Command: `npm start`
5. Deploy — copy the public URL (e.g. https://jossy-bot.onrender.com)

### STEP 4 — Connect Webhook to Meta
1. Back in Meta Developer Portal → WhatsApp → Configuration
2. Set Webhook URL: `https://jossy-bot.onrender.com/webhook`
3. Set Verify Token: same as your `VERIFY_TOKEN`
4. Click Verify and Subscribe
5. Subscribe to the **messages** webhook field

### STEP 5 — Test it!
Send a WhatsApp message to your test number and the bot will reply 🎉

---

## Customization
Edit the `system` prompt in `index.js` to change how the bot introduces your brand, prices, and services.
