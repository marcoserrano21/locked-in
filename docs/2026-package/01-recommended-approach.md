# Recommended approach (August 2026)

Most habit apps design for the fantasy version of you. Twelve habits. A dashboard. A streak you can inflate with a water log.

This one should stay meaner than that.

**The job is the next block.** Seal the day on core only. Fitness is depth. Proof is the share. Money is a ceiling, not a game.

That is already the product. The 2026 work is making the live UI match that sentence on a phone, in three themes, without adding a second brain.

Journey maps stay in [`docs/flows/`](../flows/00-overview.md). This doc is the build order.

---

## Effectiveness: do the job in under 60 seconds

Activation should be: name → lane → length → empty Today with **one** Edit CTA.

Welcome (`src/ui/Welcome.js`) already does five steps. That is close. The leaks:

- **Two onboarding brains.** Welcome is live. `src/ui/SetupWizard.js` still exists with no-op handlers. Kill or wire it. One path, one length picker.
- **Commit vs Welcome.** `src/ui/Commit.js` still appears if Welcome finishes without `startDate`, and it offers 90 days without the Premium lock Welcome uses. Collapse to one length control.
- **Fitness empty state always reopens full setup.** `open-workout-builder` goes to `workout-setup` even when prefs exist. Another path in `src/main.js` already skips to the builder. Use that. Strong does not re-ask bodyweight every session.
- **One loud CTA per view.** Check / Start / Complete / Save. Secondary as text or overflow. Anti-pattern already named in [`docs/flows/00-overview.md`](../flows/00-overview.md): stacking three equal `.btn` pills.

Measure: first core check inside 48 hours of install. First workout complete inside 7 days for fitness-lane users.

---

## Retention: identity loop, not checkbox spam

The loop that actually keeps people:

Check core → seal day → streak identity → optional Fitness depth → Proof / share.

Protect that loop. Everything else is chrome.

**Today is noisy.** Coach strip + backup banner + install tip + status banner + stats rail + date field + 7 pills. Check loses. Install and backup do not belong above the habit. Park them after seal, or behind a single quiet chip.

**Share proof, not dashboards.** Celebrate (`src/ui/Celebrate.js`) and workout complete (`src/ui/fitness/WorkoutCompletion.js`) are the social objects. Proof on day 1 should be one card. Day 30 is a ritual near the end, not a form wall on day one.

**Do not clock-lock checks.** Time highlights "now." It never disables a check on an editable day. That is the wedge vs calendar apps that punish early work.

**Next product wedge** (already in [`docs/STRATEGY.md`](../STRATEGY.md), not this pass): Capacitor + local notifications + home-screen widget (Now + streak + Day X/N), then light accountability (one trusted person sees streak only).

North star metrics stay: current streak (core only), Monday Flow completion, miles under soft-stop, Day 30 answered N/M, second profile week sealed.

---

## Usefulness: one OS, not three half-apps

The app currently contains three products under five tabs.

1. **Day OS** (Today + Edit) is the core. Keep it.
2. **Fitness** is buried under a nav label that says Hustle. The screen says Growth / Fitness tracker. Fitness-first Welcome users land on a misnamed tab. Award-winning workout apps put Train on the bar. Rename, or give Fitness its own tab when the Welcome lane is Fitness / Both.
3. **Hustle Command** is premium-gated progressive disclosure. Keep it that way. Do not let Flow / Ramp / Scripts / Log become the home screen for gym users.
4. **Miles / Money** is still an Uber logger (`src/ui/Miles.js`). Tab label switches. The form is still Miles + Earnings ($). Hours/$ must be first-class for blank profiles, not a Limits footnote.

Simple mode (Today · Hustle · Profile) is the right default. Full mode's five tabs on a 390px phone fight "one job per screen." Do not add a sixth.

---

## UI/UX: mobile, three themes, 2026 bar

Tokens stay: ink stage, Barlow, build-green, [`design-system/MASTER.md`](../../design-system/MASTER.md). No font swap. No emoji icons.

**Mobile**

- Touch targets ≥ 44px. Global `.check` is 28px with a row hit target; do not shrink the row.
- Long-press reorder on exercises (Strong). Grip-only HTML5 DnD fails on iOS.
- Bottom nav: 10px labels + five items is tight. Simple stays three tabs.
- Sheets, not desktop dialogs. Backdrop tap does not close (explicit in `src/main.js`). Keep that; accidental dismiss on a mid-set log is worse than an extra Cancel.

**Themes: dark / light / high**

- Mute type is the failure mode. `text-xs` + `--mute` fails AA on dark and light, and still looks weak on high.
- High contrast (`#000` / `#39ff14`) is a real mode, not a skin. Test Welcome labels, coach copy, and Profile help text in all three.
- Text size (`default` / `medium` / `large`) is a first-class a11y control. Keep it on Profile, not buried.

**Accessibility**

- Focus trap on sheets (except add-exercise, which is a known exception).
- Visible focus. Semantic `nav` / `main` / `button`.
- `prefers-reduced-motion` already on check-seal. Keep it on celebrate and rest chime.
- iOS will not vibrate. Do not design retention around haptics.

**Fitness session chrome**

Complete vs End is the right split (Hevy-class honesty). The rest is loud: Start/Pause, rest 60/90/120, Expand all, Collapse all, Add exercise, Complete, End, plus overflow. One primary. Complete can sit disabled under a pile of equal pills. Fix hierarchy before adding features.

**Muscle picker is an activation bug.** Clipped anatomy, abs/quads and calves/hamstrings miss-hits. If the first tap feels random, they bounce before set one. This is not polish.

---

## What not to do (August 2026)

- Do not add Fitbod-style AI programming. Coach Brain is rule-based and should stay honest.
- Do not clock-lock checks.
- Do not inflate streaks with soft targets.
- Do not ship cloud sync before widget + local notifications. Export is still the account.
- Do not fake a paywall. Premium preview is client-side (`test123!S`). Either make the gate a clearly labeled beta switch, or wait for Stripe + auth.
- Do not replace Barlow / build-green.
- Do not clone Habitica quests or LinkedIn CRM chrome.

---

## Build order for a later coding pass

This pass is docs. When you open a coding session, ship in this order:

| Priority | Slice | Why |
|---|---|---|
| P0 | Today chrome | Protects the identity loop |
| P0 | Fitness skip-setup when prefs exist | Activation for the gym lane |
| P0 | Muscle picker hit-targets | First workout bounce |
| P1 | Nav naming (Train vs Hustle) | Fitness-first users cannot find the product |
| P1 | Proof first-run | Share card, not Day 30 wall |
| P1 | Session button hierarchy | Complete has to be the loud control |
| P2 | Kill/wire SetupWizard + unify Commit | One onboarding brain |
| P2 | Profile density (iOS Settings pattern) | Settings dump tax |
| P2 | Miles hours/$ as first-class | Blank profiles are not Uber |
| P3 | Capacitor + widget + local notifications | Glanceability, then accountability |

Each slice should stay mobile-first and pass dark / light / high before it ships.
