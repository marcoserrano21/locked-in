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

## Phase A — PWA polish (shipping)

1. Today stats rail (Day X/N · Streak · Core)  
2. Check-seal CSS motion + reduced-motion  
3. Partial DOM patches on block toggle  
4. Backup nudge on Today after Day 3  
5. Identity commit copy (Marco vs blank / focus)  
6. Reminders v1.5: streak-at-risk 9 PM, Monday Flow noon, SW `#today`  

## Phase B — Product readiness (shipping)

1. Blank setup wizard (week shape, modules, starter blocks, hustle pack)  
2. Money tab label for non-Marco presets  
3. Hustle packs library (freelance / job hunt / content / blank)  
4. Fitness rest timer + History sparkline  

## Phase C — Glanceability (shipping)

1. List | Timeline toggle on Today  
2. Share card sealed stamp + Sunday streak share toast  
3. Coach Brain: empty wizard, late workout, Day 25+ Day 30  

## Next

- Capacitor wrap + local notifications + widget (see CAPACITOR.md)  
- Light accountability (one trusted person)  
- Money hours/$ modes  

## Threat model

No auth. Device wipe = data loss. Export is the account. Escape all user HTML.

## Explicit non-goals

Cloud sync now, TensorFlow in-app, font swaps away from Barlow, CRM billing.
