# Competitive analysis (August 2026)

Locked-In is not trying to beat Streaks at circles or Strong at set speed. It is trying to win the week that needs **the next block, the lift, and a money ceiling** without a login wall.

Wedge to claim:

**One local-first OS for the next block, the lift, and the money cap. Streak on core only. Export is the account.**

Sources: category roundups for 2026 (Streaks, HabitKit, Habitify, Strong, Hevy, Fitbod, Apple Fitness+, Structured as the day-timeline reference). Prices move. Mechanisms do not.

As-built journeys: [`docs/flows/00-overview.md`](../flows/00-overview.md). Steal vs refuse is the point of this file.

---

## Snapshot matrix

| App | Job it wins | What it lacks | Locked-In move |
|---|---|---|---|
| Streaks | Circle grid, Watch, HealthKit auto-complete, one-time buy | No day blocks, no lift log, no money cap | Steal widget + glanceability later. Keep core-only honesty. |
| HabitKit | Heatmap identity, no account, lifetime | No timed day, no fitness | Steal heat as Proof identity. Do not become 4-habit-only. |
| Structured | Beautiful day timeline | No proof ritual, no core-only streak | Timeline stays optional. List is default. |
| Habitify | Analytics, cross-platform, time-of-day grouping | SaaS feel, account gravity | Refuse the dashboard-as-home. |
| Duolingo | Activation + streak psychology | Not a life OS | Steal short activation. Refuse leagues and fake urgency. |
| Strong | Set-rep-weight speed, rest timer, one Complete | No day OS, history gated on Pro | Steal session hierarchy. Skip re-asking prefs. |
| Hevy | Generous free, social copy-routines | Social is the product | Steal End vs Complete. Refuse the feed as v1. |
| Apple Fitness+ | Session clarity, Watch | No custom lift log, Apple-only | Steal elapsed session time. Not a class app. |
| Fitbod | AI programming | Subscription-only, opaque plan | Refuse fake AI. Coach stays rules. |
| Nike Training Club | Free guided library | Follow a class, not prove a block | Different job. Do not clone videos. |
| Strava | GPS social endurance | Wrong sport | Steal kudos energy for share cards only. Not GPS. |

---

## Habits / day OS

### Streaks

**Excels:** Apple Design Award circles. Up to ~24 tasks. HealthKit can auto-complete. Watch + widgets. One-time purchase. On-device. The look everyone copies.

**Lacks:** Timed schedule blocks. Workout log. Money ceiling. Day 30 ritual. The product is binary habits, by design.

**Implement:** Home-screen widget (Now + streak + Day X/N) after Capacitor. Interactive widget is the 2026 bar for iPhone retention. HealthKit auto-complete is a maybe later, never a v1 promise.

**Do not implement:** 24 parallel habits. That is how core-only dies.

### HabitKit

**Excels:** GitHub-style heatmap. No account. Fast. Calendar surface filling in is a different cue than a number streak. Lifetime purchase.

**Lacks:** Timed day. Fitness. Goals hierarchy.

**Implement:** Proof heat is already the right cousin. Make first-run Proof **the heat + one share card**, not a bento of tiles.

**Do not implement:** Free cap of 4 habits as a monetization story. We are not selling habit slots.

### Structured

**Excels:** Day as a visual timeline. Gorgeous. Time as a landscape.

**Lacks:** Proof. Core vs soft. Fitness. Local-export-as-identity.

**Implement:** Keep List default, Timeline optional (`docs/flows/today.md`). Time highlights now. Never disables checks.

**Do not implement:** Timeline-only home. Jordan bounces. Marco checks faster in a list.

### Habitify

**Excels:** Power-user analytics, time-of-day grouping, cross-platform, mood add-ons.

**Lacks:** Feels like SaaS. Account and subscription gravity. Honesty about local-only is not the brand.

**Implement:** Nothing from the billing page. Maybe morning/afternoon/evening as labels (Welcome already has presets).

**Do not implement:** Mood graphs on Today.

### Duolingo (retention reference, not a competitor)

**Excels:** Activation under a minute. Streak as identity. Notifications that hurt in a way people joke about.

**Lacks:** Dignity, sometimes. Leagues. Nagging. Not a schedule OS.

**Implement:** Honest short Welcome. Seal as the streak moment.

**Do not implement:** Streak freeze as a paid pack. Fake social proof walls. Owl guilt. Our midnight copy is already blunt. Keep it adult.

---

## Fitness

### Strong

**Excels:** Fastest set-rep-weight loop in the category. Rest timer. One loud Complete. Long-press reorder. The bar our session should match.

**Lacks:** Life schedule. Core streak. Free history is limited (Pro ~$5/mo or ~$30/yr).

**Implement:** Skip full setup when prefs exist. Long-press reorder instead of grip DnD. One primary Complete. Rest 60/90/120 can live in overflow once a default is set.

**Do not implement:** Paywalling history. Our History sparkline is a trust feature.

### Hevy

**Excels:** Logging feel near Strong. Generous free. Follow, share, copy routines. End session as a first-class exit.

**Lacks:** Local-first story. Day OS. Social feed is gravity.

**Implement:** End vs Complete (already shipped). Keep it visible, not buried under equal pills.

**Do not implement:** A following feed in v1. Light accountability (one trusted person, streak only) is the ethical cousin.

### Apple Fitness+

**Excels:** Session clock clarity. Watch. Rings as identity for Apple-only users. Classes.

**Lacks:** Custom barbell log. Android. Export-as-account. Requires Watch for the full trick.

**Implement:** Elapsed session time, not a fake countdown that looks like a class limit. (`docs/flows/hustle-growth.md`)

**Do not implement:** Rings. We already have a core streak. Two identity systems is how both get ignored.

### Fitbod

**Excels:** Adaptive programming, substitutions, recovery language.

**Lacks:** Trial-then-pay. You cannot evaluate the log without the AI overlay.

**Implement:** Nothing branded as AI. Coach Brain empty-state / late workout / Day 25+ is enough.

**Do not implement:** Generated splits that we cannot explain. If we cannot say why today's muscles were picked, we do not pick them.

### Nike Training Club

**Excels:** Free guided library. Brand trust. Follow-along.

**Lacks:** Proving *your* block. Different job.

**Implement:** None. Video classes are a different product and a different budget.

### Strava (adjacent)

**Excels:** Social proof of work. Segments. Endurance GPS.

**Lacks:** Lifting. Day OS. Privacy default is public-ish.

**Implement:** Share card energy (kudos without the map).

**Do not implement:** GPS, leaderboards, segments.

---

## Where Locked-In already wins

- Core-only streak. Soft targets cannot inflate identity.
- No clock-lock on checks.
- No login. Guest isolation.
- Day 30 as a review, not a vibe check.
- Miles soft-stop / hard cap (Marco lane).
- Fitness + Today in one install (even if IA is wrong).
- Complete vs End honesty.
- Three themes + text size.

## Where Locked-In loses in 2026

- No widget, no Watch, no HealthKit.
- Reminders need the tab recently open.
- Fitness is named Hustle.
- Muscle picker miss-hits.
- Setup re-asks every build.
- Today chrome stacks.
- Five tabs in Full mode on 390px.
- Premium is a client-side password.
- iOS haptics are a no-op.
- Not on App Store / Play.

Those losses are a roadmap, not a personality. Widget + Train label + skip-setup close more of the gap than adding a ninth competitor feature.

---

## Steal / refuse checklist

**Steal**

- Strong session hierarchy and long-press reorder
- Hevy End vs Complete (keep)
- HabitKit heatmap as the Proof identity
- Streaks widget + glanceability (later)
- Structured timeline as optional
- BeReal / Streaks share card (one object)
- Duolingo-short activation (not Duolingo-mean)

**Refuse**

- Fitbod AI programming
- Habitica gamification
- LinkedIn/CRM pipeline chrome
- Clock-locking checks
- Streak freeze paywall
- Social feed as home
- Rings as a second identity

## Positioning sentence for sales and hiring

Streaks is the circle. Strong is the set. Structured is the day drawing.

Locked-In is the receipt for the next block, with a lift log and a ceiling on the side hustle miles, on your phone, without an account.
