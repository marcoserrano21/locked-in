# Portfolio placement

How this product sits on a personal site, in a DM, or in a Tesla-to-product interview. Steal the blocks. Rewrite the first sentence so it sounds like you that week.

Full narrative: [`07-case-study.md`](07-case-study.md). Deck: [`06-presentation.md`](06-presentation.md).

---

## Grid card (homepage)

**Marco Locked-In**
Local-first schedule OS. Next block. Proof over vibes.

PWA · Vite · retention loops · fitness log · guest beta

Link: live app · case study

## One-liner (bio / LinkedIn featured)

I built the phone OS I actually use on shift weeks: core-only streaks, a lift log, a mileage ceiling. No login. Export is the account.

## Three proof shots (in this order)

1. **Today Track** with the next block + Check. Streak rail visible. No stacked banners if you can avoid it.
2. **Workout complete** card (PR or sealed session). This is the share object.
3. **Proof** share card or heat, not the Day 30 form.

Do not lead with Profile, Premium unlock, or the muscle map until hit-targets are fixed.

Alt text: "Locked-In Today screen, next block with Check control and streak rail" (and matching lines for 2 and 3). Dark default. Mention light/high only if you show them.

---

## Project page outline

1. Problem in two sentences (intent vs proof).
2. Constraints (local-only, PWA, three themes).
3. Mechanism (next block + core-only streak).
4. Three shots.
5. What shipped vs what is still wrong (Hustle label, setup loop, muscle picker).
6. Stack.
7. Next (P0 list). Link to `docs/2026-package/`.

Keep it under 400 words on the site. The repo can be long. The site should not be a README.

## Tech stack line

`Vite · vanilla JS · Tailwind · PWA (service worker v4) · localStorage profiles · Vercel`

Optional: "Guest isolation via scoped keys. No auth."

## What I would ship next (interview closer)

If I had two weeks: collapse Today chrome, skip fitness prefs when they exist, fix muscle-map hits, rename Hustle to Train for fitness-lane users.

If I had a quarter: Capacitor, local notifications, home-screen widget, then a streak-only accountability link.

I would not start with cloud sync. That is how this becomes a login app that nobody opens.

---

## DM to a hiring manager (short)

I shipped a local-first PWA I actually live on: schedule blocks, core-only streaks, workout log, mileage cap. Phone-first, three themes, no login wall.

Happy to walk the case study or send a guest link if you want to tap through Today + Fitness.

Live: `https://locked-in-marco.vercel.app/`

## Interview talking points

- **Retention vs features.** Soft targets never inflate the streak. That was a product decision, not a missing checkbox.
- **Trust.** Export is the account. We say wipe-risk in the UI.
- **IA miss I own.** Fitness lives under Hustle. I can show the fix plan without pretending I did not ship the miss.
- **Prior proof.** Demo Drive Hub (Tesla internal tool, 30+ users) if they need a "this person ships inside a company" beat. Locked-In is the "this person ships for themselves and friends" beat.

## What not to put in the portfolio

- Guest passwords or `test123!S`
- Tester JSON exports
- A fake user count
- "AI-powered coaching"
- Five-tab Full mode as the hero shot
