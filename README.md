# DYNEX BOT

DYNEX BOT is being built as a native Android app with React Native and Expo. The mobile app lives in `mobile/`. The `admin.html`, `css/admin.css`, and `js/admin.js` administration files are preserved.

## Current mobile app
- Native React Native chat screen, not a web page embedded in the app.
- Neon Warrior mascot and DYNEX identity.
- Message composer, conversation bubbles, typing indicator, new-chat action, and suggested prompts.
- Sends messages to the secure DYNEX AI Worker API.

## Enable real AI replies

The app and backend source are prepared, but live replies require your own OpenAI API key and a deployed Cloudflare Worker. **Never put the API key in the mobile app or commit it to GitHub.**

### 1. Deploy the Worker
1. Sign in to Cloudflare.
2. Open **Workers & Pages** and choose **Create** → **Worker**.
3. Create a Worker named `dynex-bot-ai`.
4. Open its code editor and replace the starter code with the complete contents of `worker/src/index.js`.
5. Deploy the Worker.

### 2. Add the API key as a secret
1. Open the Worker in Cloudflare.
2. Go to **Settings** → **Variables and Secrets**.
3. Add a secret named `OPENAI_API_KEY` and paste your OpenAI API key as its value.
4. Save and redeploy if Cloudflare asks.
5. Optional: add a text variable named `OPENAI_MODEL` with value `gpt-4o-mini`.

Keep the key private. Do not send it in this chat or put it in GitHub.

### 3. Connect the Android app
After deploying, Cloudflare gives you a Worker URL similar to:

`https://dynex-bot-ai.YOUR-SUBDOMAIN.workers.dev`

Open `mobile/App.js` and replace the `API_URL` value near the top with:

`https://YOUR-WORKER-URL.workers.dev/chat`

Commit the change, then build and install the Android app again.

### 4. Check the Worker
Open `https://YOUR-WORKER-URL.workers.dev/health`. It should return JSON with `"ok": true` and `"configured": true`.

## Run the Android app locally

From the `mobile/` folder, use a Node.js 22.13+ environment:

```bash
npm install
npx expo start
```

For an installable Android APK, configure EAS Build and run an Android preview build.

## Important
- AI replies will not work until the Worker is deployed, the API key secret is set, and `API_URL` points to that Worker.
- API usage may incur charges from the AI provider.
- The Worker keeps the provider key on the server and does not expose it to the app.
- Admin files are intentionally preserved.
