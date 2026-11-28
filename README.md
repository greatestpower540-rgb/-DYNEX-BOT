# DYNEX BOT — Native Android app

This project is a React Native / Expo mobile application. It is not a website wrapper.

## Mobile app

- App source: `mobile/App.js`
- Android package: `com.dynexbot.app`
- Build configuration: `mobile/eas.json`

## Connect the AI service

1. Deploy the Cloudflare Worker in `worker/`.
2. Add the secret `OPENAI_API_KEY` to the Worker using Cloudflare's secret settings. Never put this key in the mobile app or commit it to GitHub.
3. Optionally set Worker variable `OPENAI_MODEL` to a model enabled for your API account.
4. Set `EXPO_PUBLIC_DYNEX_API_URL` in the Expo/EAS build environment to the deployed Worker URL ending in `/chat`. See `mobile/.env.example` for the format.
5. Build the Android APK using the preview profile in `mobile/eas.json`.

The chat UI is native React Native. Live AI replies require the Worker to be deployed and configured with a valid API key and the app to be rebuilt with its URL.

## Local development

From the `mobile` directory, install dependencies and run `npx expo start`.


## DYNEX BOT API platform

The developer portal is available at `developers.html`. API platform routes and Cloudflare D1 setup are documented in `worker/API_PLATFORM.md`. The API platform is a separate layer and preserves the existing mobile `/chat` endpoint.
