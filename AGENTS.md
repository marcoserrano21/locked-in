# AGENTS.md

## Cursor Cloud specific instructions

Marco Locked-In is a single, fully client-side **Vite 6 PWA** (vanilla JS ES modules + Tailwind 3). There is **no backend, database, auth, or external API** — all state lives in the browser's `localStorage` (key `marco-tracker-v4`, see `src/store.js`). Do not provision Postgres/Redis/etc.

Commands (see `package.json`):
- Dev server: `npm run dev` (Vite on `http://localhost:5173/`). This *is* the app.
- Build: `npm run build` (outputs `dist/`).
- Preview production build: `npm run preview` / `npm start` (Vite preview on `--host --port 4173`).

Non-obvious notes:
- There is **no lint tooling** (no ESLint/Prettier config) and **no automated test suite** in this repo. "Testing" means running the app and exercising the UI manually.
- The **service worker** (`public/sw.js`) generally does not register under the Vite dev server. To exercise offline / PWA-install behavior, use `npm run build` then `npm run preview` (needs `localhost` or HTTPS).
- Core flow to smoke-test: open the dev server, on the **Today** tab click **"Check this block"** (or a task row) and confirm the `X/Y core` counter and progress bar update. Data seeds come from `content/*.json` (imported at build time).
- Only the dev server needs to run for end-to-end testing; the sole runtime external dependency is Google Fonts (cosmetic, non-blocking).
