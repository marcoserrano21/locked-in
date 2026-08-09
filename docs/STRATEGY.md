# Marco Locked-In — Improvement strategy

Living backlog. Local-only PWA: export is the account. Barlow / Instrument Serif / build-green stay.

## North star metrics

| Metric | Why |
|---|---|
| Current streak (core only) | Identity loop |
| Monday Flow completion | Freelance / hustle survival |
| Miles under soft-stop | Money truth |
| Day 30 answered N/M | Finish strong |
| Second profile week sealed | Multi-user proof |

## Shipped — retention P0–P5

Backup nudge, import validation, Today Track|Edit, Profile, Hustle tabs, interactive Day 30, install tip, toast/copy, a11y focus, SW updates.

## Phase 0 — Performance (shipping)

1. Theme apply only on boot / theme change  
2. Single Google Fonts link (Instrument Serif included); no CSS `@import`  
3. Debounced `localStorage` persist (~75ms)  
4. SW v4 shell precache + network-first navigations  

## Phase 1 — On-device profiles (shipping)

1. Store `marco-tracker-v4` with `profiles` + `activeProfileId`  
2. Migrate v3 → one Marco profile  
3. Add Blank or Marco preset; switch profiles  
4. Challenge length 7 / 14 / 30 / 90 per profile  
5. Editable Day 30 questions per profile  

## Meta / pills / Update Today (shipping)

1. Task meta: time column + aligned pills, large gap, max 2 chips  
2. Tag tones: neutral / build / maintain / danger  
3. Full-width row dividers  
4. Week templates **Update Today** → write today’s date schedule + jump to Track  

## Coach Brain (shipping)

Rule-based on-device hints (streak risk, Monday Flow, soft-stop, Day 21+, empty day). No cloud ML.

## Next (not this ship)

- Blank setup wizard polish (week shape UI)  
- Generic Money module rename + module toggles  
- Hustle packs library (job hunt / content / blank)  
- Capacitor / App Store wrap + local reminders  
- Partial DOM updates for block toggles  

## Threat model

No auth. Device wipe = data loss. Export is the account. Escape all user HTML.

## Explicit non-goals

Cloud sync now, TensorFlow in-app, font swaps away from Barlow, CRM billing.
