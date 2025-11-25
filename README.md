<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1dpE9M1idZHf7ItQtBE7b2Wn8eRhMkRkU

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in `.env.local` to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy on Vercel

1. Push this repo to GitHub / GitLab / Bitbucket.
2. In Vercel, create a new project and select this repo.
3. When prompted, set these values:
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. In the Vercel project settings, add an environment variable:
   - `GEMINI_API_KEY` = your Gemini API key
5. Trigger a deployment. Vercel will build with `npm run build` and serve the static files from `dist`.
