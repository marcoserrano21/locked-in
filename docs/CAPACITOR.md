# Capacitor native shell

Phase D readiness notes. PWA polish ships first; this doc is the wrap checklist.

## Setup (when ready)

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android @capacitor/local-notifications
npx cap init "Marco Locked-In" app.lockedin.marco --web-dir dist
npm run build
npx cap add ios
npx cap add android
npx cap sync
```

Config lives in [`capacitor.config.json`](../capacitor.config.json) (`webDir: dist`).

## Local notifications

Replace PWA `setTimeout` reminders in [`src/reminders.js`](../src/reminders.js) with `@capacitor/local-notifications` so alerts fire when the app is backgrounded.

Map existing tags:

| Tag | When |
|-----|------|
| `marco-block-reminder` | 5 min before next core block |
| `marco-streak-risk` | 9 PM if core incomplete |
| `marco-monday-flow` | Monday 12 PM if Flow open |

Deep link: `index.html#today`.

## Home screen widget (MVP)

Show:

- Now block label
- Streak count
- Day X/N

Write a small JSON snapshot on each debounced persist in [`src/store.js`](../src/store.js) for the native widget to read (App Group on iOS / DataStore on Android).

Tap → open `#today`.

## App Store checklist

- Privacy nutrition: no data collected (local-only)
- Screenshots: Today Now card, Proof heat, Fitness builder, sealed celebrate
- Icons: reuse `public/icons/`
- Premium: replace password gate with StoreKit / Play Billing; fitness stays free

## Explicit non-goals for first native ship

- Cloud sync
- HealthKit / Google Fit
- Full social feed
