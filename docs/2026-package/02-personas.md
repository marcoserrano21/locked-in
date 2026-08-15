# User personas

Four people. Not a TAM slide. Each one maps to a Welcome lane, a kill moment, and a quote they might actually post.

Founder context: [`docs/CONTEXT.md`](../CONTEXT.md). Beta segments: [`docs/BETA_MARKETING.md`](../BETA_MARKETING.md).

---

## 1. Marco (founder-user)

**Job:** Survive the week with receipts. Tesla Wed–Sat, Full Sail deadlines, Uber cap, Monday Flow, gym Sun–Tue.

**Constraint:** Model 3 lease is 10k miles/year. Nights run late. Apartment, dog, girlfriend on a later shift. No energy for a second spreadsheet.

**Welcome path:** Full mode. Focus: Both. Challenge: 30. Marco preset.

**Uses:** Today Check, Miles soft-stop, Monday Flow, Fitness on build days, Day 30 review.

**Retention trigger:** Core streak + miles under 400. Identity is "I sealed the day," not "I opened the app."

**Kill moment:** If Today takes more than one tap to check the next block, he will edit the plan instead of doing the block. The product already knows this. Mid-lock edits get logged for Day 30.

**Would post:** "Day sealed. Core is what counts. Soft targets can wait."

**Design implication:** Never hide Check under coach banners. Miles must stay a ceiling, not a badge.

---

## 2. Ava (fitness-first)

**Job:** Log sets without 12 taps. Lift 4x a week. Wants Strong-simple logging plus a day that still exists when she is not in the gym.

**Constraint:** Hates subscriptions. Will not make an account to try a PWA. iPhone, Add to Home Screen if it feels native in 60 seconds.

**Welcome path:** Simple. Focus: Fitness. Challenge: 14. Blank track.

**Uses:** Hustle → Fitness (she will not call it Hustle). Session timer, rest, Complete vs End. Maybe Today if a "train" block exists.

**Retention trigger:** First completed workout with a shareable PR/streak card. Second session that does **not** re-ask bodyweight and gear.

**Kill moment:** Muscle map miss-hits, or "Build workout" reopening the full setup. She will go back to Strong.

**Would post:** "Logged the workout. Sealed the day. One app. No login."

**Design implication:** Nav cannot say Hustle when the product is Train. Skip prefs when they exist. Muscle picker is an activation bug.

---

## 3. Jordan (builder / ADHD-adjacent)

**Job:** One next block. Not 24 habits. Has tried Streaks, HabitKit, Notion, three other trackers. None survived week two.

**Constraint:** Dashboard fatigue. If the home screen looks like a BI report, they bounce. Needs a single loud action.

**Welcome path:** Simple. Focus: Schedule. Challenge: 7, then 30 if week one seals.

**Uses:** Today Track. Date rail. Yesterday catch-up. Share when sealed. Profile theme + text size (large).

**Retention trigger:** Opening the app and seeing **one** Check. Streak that only moves on core. No punishment for doing the block early.

**Kill moment:** Clock-locked checks, or five equal tabs, or Proof as a form wall on day 1.

**Would post:** "Today is an open window. I check when I do it, not when the clock says."

**Design implication:** Protect Simple mode. Proof stays gated until first core. Mute type must pass AA at large text size.

---

## 4. Sam (freelance / side hustle)

**Job:** Check this week's Flow. Log 5 touches. See whether the week actually paid.

**Constraint:** Outreach dread on Mondays. Will not maintain a CRM for a $300 landing-page gig. Needs scripts and a log, not a pipeline cartoon.

**Welcome path:** Full. Focus: Schedule (or Both). Challenge: 30. Hustle pack: freelance.

**Uses:** Hustle Command (Flow / Ramp / Scripts / Log), Today Monday money block, Miles if gig driving exists.

**Retention trigger:** Monday Flow noon reminder + a log that is not empty. Week 4 ramp item marked done.

**Kill moment:** Premium preview that looks like a broken paywall (`Unlock Hustle` underline + test password). Or Command buried so deep they never find Log.

**Would post:** "Monday Flow + miles + core. Survive the week with receipts."

**Design implication:** Command is progressive disclosure, not the default for gym users. Gate copy must say "beta preview," not "subscribe." Money hours/$ for people who are not Marco.

---

## Who it is not for (yet)

- Teams that need a shared calendar
- People who refuse a PWA and will only use App Store
- Anyone expecting cloud sync on day one
- Class-based fitness (Peloton / Fitness+) or GPS endurance (Strava)
- Kids. Not targeted. No COPPA flow.

## Persona × activation matrix

| Persona | Mode | First success | Share object |
|---|---|---|---|
| Marco | Full | Seal day 1 + log miles or Flow | Day sealed card |
| Ava | Simple | Complete one session | Workout PR / streak |
| Jordan | Simple | Check next block twice | Streak rail |
| Sam | Full | Log first touch | Monday Flow check |

If a change does not help at least one of these four land that first success, it is decoration.
