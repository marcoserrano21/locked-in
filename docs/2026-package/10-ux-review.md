# Screen-by-screen UX review (August 2026)

Scores are 1–5 against the bar in [`docs/flows/00-overview.md`](../flows/00-overview.md) and [`01-recommended-approach.md`](01-recommended-approach.md).

**Dimensions:** Job (one job, one loud CTA) · Mobile (44px, thumb, sheets) · Themes (dark / light / high, AA mute) · A11y (focus, labels, motion) · Retention (does this earn the next open)

Live files cited. As-built mermaid stays in `docs/flows/`. This is the critique.

Tokens: [`design-system/MASTER.md`](../../design-system/MASTER.md). Bottom nav: `src/ui/Nav.js`. Routing: `src/main.js`.

---

## P0 list (do these first)

1. Fitness buried under a Hustle tab (`Nav.js` label vs `Fitness.js` home)
2. Build workout reopens full setup even when prefs exist
3. Today stacked banners bury Check (`Today.js`)
4. Two onboarding brains (`Welcome.js` live, `SetupWizard.js` dead)
5. Muscle picker miss-hits (`MuscleGroupPicker.js`)
6. Session chrome too loud vs Complete
7. Proof is a dashboard on day 1 (`Proof.js`)
8. Premium preview looks like a broken paywall
9. Profile is a settings dump
10. Miles form still Uber-shaped for blank profiles
11. Five-tab Full mode on 390px
12. iOS: no haptics, no real install prompt, reminders need the tab open

---

## Global chrome

### Bottom nav · `src/ui/Nav.js`

**User goal:** Switch the one job they came for.

| | Job | Mobile | Themes | A11y | Retention |
|---|---|---|---|---|---|
| Score | 3 | 3 | 4 | 4 | 3 |

**Works:** `role="tablist"`, `aria-label="Primary"`, safe-area inset, hidden during Commit. Simple default is three tabs (Today · Hustle · Profile). Proof unlocks on first core. Miles unlocks with the module.

**Fails:** Full mode is five equal items with 10px labels on a 390px width. Hustle is not Fitness. Miles is not Money for Marco. Leftover `data-tab="plan"` opens Today Edit.

**Primary vs secondary:** Every tab looks primary. Award-winning apps do not put five equal destinations under a "one job" thesis.

**Themes:** Nav surface token `--nav` is fine. 10px labels fail large-text users before they fail contrast.

**Change:** Fitness-lane Welcome → label Train (or a fourth tab only when lane is Fitness/Both). Keep Simple at three. Do not add a sixth.

### App shell · 440px · `#app`

**Works:** Phone chrome, centered, pad above nav (`4.75rem`). Keyboard inset sync in `main.js`. Backdrop tap does not close sheets.

**Fails:** Global scrollbar hiding conceals overflow in long sheets (prefs, builder, Profile). High-contrast users cannot see that more exists.

**Change:** Show a thin scrollbar inside `.modal-sheet` at least.

---

## Onboarding

### Welcome 1–5 · `src/ui/Welcome.js`

**User goal:** Name, lane, week shape, Simple/Full, length. Land on Today.

| Step | Job | Mobile | Themes | A11y | Retention |
|---|---|---|---|---|---|
| 1 Name | 4 | 4 | 3 | 3 | 4 |
| 2 Focus | 4 | 4 | 3 | 3 | 4 |
| 3 Week | 3 | 3 | 3 | 3 | 3 |
| 4 Simple/Full | 4 | 4 | 3 | 3 | 4 |
| 5 Length | 4 | 4 | 3 | 3 | 4 |
| Flow overall | 4 | 4 | 3 | 3 | 4 |

**Primary:** Continue / Start my track (mint). **Secondary:** Back. **Text:** Try Marco demo instead.

**Works:** Five steps is honest. Demo skip is a text link in the flow doc; keep it from looking like a second primary. Challenge chips exist.

**Fails:** Mute `text-xs` labels on dark/light/high. Focus cards lack a 2-sentence tip for what Schedule / Fitness / Both unlock. Length chips still read as bare numbers unless "Days" is visible. Week shape can feel like a settings page before they have a day.

**Change:** Large labels, bright fields, "Days" on chips, one tip per lane. Demo stays text.

### Commit fallback · `src/ui/Commit.js`

**User goal:** Lock start date + length if Welcome did not.

| | Job | Mobile | Themes | A11y | Retention |
|---|---|---|---|---|---|
| Score | 3 | 4 | 4 | 4 | 3 |

**Primary:** Lock in for N days. **Secondary:** 7 / 14 / 30 / 90 chips.

**Fails:** 90 is ungated here; Welcome premium-gates it. Two length pickers. Nav hidden (good) but the modal is a second brain.

**Change:** One length control. If Welcome always sets `startDate`, delete the path or make Commit a confirm-only sheet.

### SetupWizard · `src/ui/SetupWizard.js` (orphan)

**Score:** 1 across the board as a product surface. Handlers `setup-wizard-next/back/finish` return without doing anything.

**Change:** Delete or wire. Do not leave dead UI in the bundle.

---

## Today

### Today Track · `src/ui/Today.js`

**User goal:** See the next block. Check it. Seal the day.

| | Job | Mobile | Themes | A11y | Retention |
|---|---|---|---|---|---|
| Score | 3 | 4 | 3 | 4 | 4 |

**Primary:** Check on the next incomplete core. **Secondary:** Edit icon, day pills, date field, Share when sealed, Quick tour. **Text:** coach links, Export / Not now, Install.

**Works:** No clock-lock. Stats rail (Day X/N · Streak · Core). Check-seal motion + reduced-motion. List default, Timeline optional. Yesterday catch-up. Empty state can point at Edit.

**Fails:** Coach + backup + install + status + stats + date + 7 pills. Check loses. Eyebrow/stats mute type is small. Install/backup do not belong above the habit loop.

**Themes:** Mute captions fail first. High contrast helps the Check, not the stacked banners.

**Change:** One status line. Install and backup after seal or behind a chip. Check stays the only mint control in the viewport.

### Today Edit · `src/ui/Plan.js`

**User goal:** Change the track without pretending it did not happen.

| Mode | Job | Mobile | Themes | A11y | Retention |
|---|---|---|---|---|---|
| One day | 4 | 4 | 4 | 4 | 3 |
| Shifts | 4 | 4 | 4 | 4 | 3 |
| Templates | 4 | 4 | 4 | 4 | 3 |

**Primary:** Add block / Edit {date}. **Secondary:** date field, week pills, up/down/menu. **Destructive:** Delete via overflow. Mid-lock goes through **edit-confirm**.

**Works:** Segment is clear. Empty copy exists. Edit friction is the retention feature.

**Fails:** Header "Edit the track" + check icon back to Track is clever and easy to miss. Block rows with Edit/Delete overflow are fine; do not add a third equal pill.

**Change:** Back should say Track, not an icon-only check, unless `aria-label` is loud.

---

## Hustle → Fitness

Nav says Hustle. Header says Growth / Fitness tracker. File: `src/ui/Fitness.js`.

### Fitness empty (Today subtab)

**User goal:** Start a session.

| | Job | Mobile | Themes | A11y | Retention |
|---|---|---|---|---|---|
| Score | 2 | 4 | 4 | 4 | 2 |

**Primary:** Build workout. **Fails:** Always `open-workout-builder` → `workout-setup` even when `prefsCaptured`. Activation tax every session.

**Change:** If prefs exist, open the builder (path already in `main.js`). Rename the tab for fitness-lane users.

### Workout setup · `src/ui/fitness/FitnessPrefsModal.js`

**User goal:** Capture gear / goal once.

| | Job | Mobile | Themes | A11y | Retention |
|---|---|---|---|---|---|
| Score | 3 | 3 | 3 | 3 | 2 |

**Primary:** Continue / Save setup. **Secondary:** Cancel / Back.

**Fails:** Long sheet. Scrollbar hidden. Outcome pre-selected. Session labeled as `30m`. Re-entry from empty state.

**Change:** First run only. Later: Adjust gear in overflow (already exists).

### Pick muscles · `WorkoutBuilderModal.js` + `MuscleGroupPicker.js`

**User goal:** Pick what to train. Save a plan.

| | Job | Mobile | Themes | A11y | Retention |
|---|---|---|---|---|---|
| Score | 2 | 2 | 3 | 2 | 2 |

**Primary:** Save · N. **Secondary:** Back (reopens setup), Cancel, Add single exercise.

**Fails:** Anatomy clipped. Abs/quads and calves/hamstrings miss-hits. This is the fitness activation gate. Random taps = bounce.

**Change:** Fix hit areas before any new builder features. Restore scroll to top on step change (docs already flag this).

### Active session

**User goal:** Log every set. Rest. Complete or End.

| | Job | Mobile | Themes | A11y | Retention |
|---|---|---|---|---|---|
| Score | 3 | 3 | 4 | 3 | 4 |

**Primary should be:** Complete (gated) or End. **Actual:** Start/Pause, rest 60/90/120, Expand all, Collapse all, Add exercise, Complete, End, plus ⋯ (Rebuild / Adjust gear / Rest).

**Works:** Session clock as elapsed time. Rest timer + chime. Complete vs End honesty. Multi-open cards (`fitnessOpenMode` default `multi`). Haptics on Android.

**Fails:** Equal `.btn` pills. Grip DnD. Complete disabled at the bottom of a pile. iOS vibration no-op.

**Change:** One mint Complete. End as text/destructive quiet. Rest default in overflow. Long-press reorder.

### History

**User goal:** See that the work existed.

| | Job | Mobile | Themes | A11y | Retention |
|---|---|---|---|---|---|
| Score | 4 | 4 | 4 | 4 | 4 |

**Works:** Empty copy. Sparkline, sessions/week, muscle map, session list → detail. Share this session. Delete session (destructive, confirm).

**Fails:** Muscle map here inherits picker sins if used as a control. As a visualization it is fine.

---

## Hustle → Command · `src/ui/Freelance.js`

**User goal:** Check this week's Flow. Log a touch.

| Sub | Job | Mobile | Themes | A11y | Retention |
|---|---|---|---|---|---|
| Segment Fitness/Hustle | 3 | 3 | 4 | 3 | 3 |
| Flow | 4 | 4 | 4 | 4 | 4 |
| Ramp | 4 | 4 | 4 | 4 | 3 |
| Scripts | 4 | 4 | 4 | 4 | 3 |
| Log | 4 | 4 | 4 | 4 | 4 |
| Premium gate | 2 | 4 | 3 | 3 | 2 |

**Primary:** Check Flow item / Add log / Log first touch. **Secondary:** Edit command center, Copy script.

**Works:** Empty Monday copy is on-voice. Rails for weekly flow and 4-week ramp. Packs exist.

**Fails:** Two products under one nav. "Unlock Premium preview" underline looks like a broken paywall. Password `test123!S` is a beta switch wearing a store costume.

**Change:** Fitness-first default. Gate labeled "Beta preview" or Profile-only toggle. Do not headline Command for Ava.

---

## Miles / Money · `src/ui/Miles.js`

**User goal:** Log a session. See the ceiling.

| | Job | Mobile | Themes | A11y | Retention |
|---|---|---|---|---|---|
| Score | 3 | 4 | 3 | 3 | 4 |

**Primary:** Add session. **Secondary:** Edit/Delete row, pager.

**Works:** Soft-stop tick. Hard cap. Empty copy. Money tab label for non-Marco.

**Fails:** Form is still Miles + Earnings ($). `/mi after energy` unless Limits `moneyMode === "hours"`. Mute captions on totals. Easy to miss.

**Change:** Hours/$ as the default UI for blank profiles. Caps stay in Profile Limits disclosure.

---

## Proof · `src/ui/Proof.js`

**User goal:** See receipts. Share one card.

| | Job | Mobile | Themes | A11y | Retention |
|---|---|---|---|---|---|
| Score | 3 | 4 | 4 | 4 | 3 |

**Primary:** Share (week / last 30). **Secondary:** Day 30 answers, Generate adjust notes, coach jumps.

**Works:** "Numbers only." First-run card can say Open Today. Heat + share is the HabitKit cousin. Simple mode gated until first core (correct).

**Fails:** After unlock, Day 30 review + tiles + heat + spark + insights + Share. Day 1 looks like a BI intern's first dashboard. Copy still says "day X/30" even when length is 7/14/90. Coach/Proof copy can be Marco-specific (Uber, apartment, Wednesday homework) on blank tracks.

**Change:** Day 1–7: heat + one share card. Day 30 block appears near the end. Length-aware copy. Blank tracks get blank questions, not Tesla leftovers.

---

## Profile · `src/ui/Profile.js`

**User goal:** Identity, theme, export, danger.

| | Job | Mobile | Themes | A11y | Retention |
|---|---|---|---|---|---|
| Score | 2 | 3 | 4 | 4 | 2 |

**Primary:** Save identity; Export when stale. **Secondary:** Add track, copy guest link, prefs. **Destructive:** Remove profile, Reset app (confirm + export nudge).

**Works:** Theme cycle dark → light → high. Text size default/medium/large. Guest links for founder. Export/Import. Restart onboarding with export first.

**Fails:** Identity, tracks, theme, type, mode, catch-up, reminders, limits, challenge, Day 30 editor, data, beta, danger. Plus **Back to Today** when the tab bar already has Today. Dense mute help copy.

**Change:** iOS Settings pattern: hero → four prefs → disclosures (Limits / Challenge / Data / Beta / Danger). Kill Back to Today.

---

## Sheets and overlays

All: `.modal-backdrop` + `.modal-sheet` unless noted. Focus trap except add-exercise. Backdrop tap does not close.

| Surface | File | Primary | Job | Mobile | Themes | A11y | Ret | Notes |
|---|---|---|---|---|---|---|---|---|
| Celebrate (day seal) | `Celebrate.js` | Share proof | 5 | 4 | 4 | 4 | 5 | Identity object. Keep moving = text. |
| Workout complete / ended | `WorkoutCompletion.js` | Done or Share | 4 | 4 | 4 | 4 | 5 | Share layout with Celebrate. Skip cooldown = text. |
| Premium unlock | `PremiumUnlock.js` | Unlock Hustle | 2 | 4 | 3 | 3 | 2 | Looks like IAP. Is a test password. |
| Install tip | `Install.js` | Install / Got it | 4 | 3 | 4 | 4 | 4 | Chrome prompt vs iOS paragraph. Do not park above Check. |
| Tips / Quick tour | `Tips.js` | Next / Got it | 4 | 4 | 4 | 4 | 3 | Fine. Do not auto-stack with banners. |
| Date picker | `DatePicker.js` | Day tap, Today | 4 | 4 | 4 | 4 | 3 | Popover, not `ui.modal`. Good. |
| Shift sheet | `ShiftSheet.js` | Save | 4 | 4 | 4 | 4 | 3 | Reset secondary. |
| Block editor | `Plan.js` | Save block (dirty) | 4 | 4 | 4 | 4 | 3 | Disabled until dirty is correct. |
| Edit confirm | `Plan.js` | Continue | 5 | 4 | 4 | 4 | 5 | Retention feature. Keep. |
| Hustle editor | `HustleEditor.js` | Save / Add | 3 | 3 | 4 | 3 | 3 | Many jobs in one sheet. Split if testers drown. |
| Outreach editor | `Freelance.js` | Save | 4 | 4 | 4 | 4 | 4 | Delete secondary. |
| Uber editor | `Miles.js` | Save | 3 | 4 | 4 | 4 | 4 | Rename fields with money mode. |
| Exercise menu | `ExerciseMenu.js` | Replace / Focus / Block / Delete | 4 | 4 | 4 | 4 | 3 | Backdrop closes (exception). OK for a menu. |
| Add / replace exercise | `Fitness.js` | Pick / Add | 4 | 3 | 4 | 3 | 3 | Filters + favorites. Long list. |
| Workout detail | `Fitness.js` | Share this session | 4 | 4 | 4 | 4 | 4 | Delete destructive. |
| Profile editor | `Profile.js` | Save | 4 | 4 | 4 | 4 | 2 | Fine. |
| Delete profile | `Profile.js` | Remove | 4 | 4 | 4 | 4 | 2 | Confirm. |
| Reset / restart | `Profile.js` | Reset / Restart | 5 | 4 | 4 | 4 | 5 | Export first is the trust move. |
| Day 30 editor | `Day30Editor.js` | Add question | 4 | 3 | 4 | 4 | 3 | Lives in Profile. Heavy. Disclosure. |
| Toast / flash | `Install.js` | Undo (reorder) | 4 | 4 | 4 | 4 | 3 | Keep undo. |

---

## Buttons and hierarchy (global)

| Level | When | Look | Review |
|---|---|---|---|
| Primary | One job (Check, Continue, Complete, Save) | `.btn-primary` mint | Too many views mint more than one thing |
| Secondary | Back, Add, Expand | Quiet `.btn` | Expand all / Collapse all should not match Complete |
| Text link | Demo, View session, Not now | No chrome | Correct pattern. Use more of it |
| Destructive | Reset, Remove, End session | `.btn-danger` rare | End session should be quiet-danger, not equal to Complete |

Touch: row hit targets for 28px checks are correct. Icon-only Edit / back-to-Track need labels.

Motion: 150–300ms, check-seal scale, `prefers-reduced-motion`. Do not add celebration that ignores it.

---

## Theme and contrast notes

| Theme | Risk |
|---|---|
| Dark (default) | Mute `#8B93A7` on `text-xs` Welcome/Profile/coach |
| Light | Glass/low-opacity leftovers, borders too faint, mute on paper `#f3f1eb` |
| High | Neon mint on black is loud (good). Mute almost white helps body, not 10px nav labels. No shadow: depth must come from borders |

Every P0 slice must be clicked in all three + `data-text-size=large` before it is "done."

---

## Layout scoreboard (retention loop first)

| Rank | Surface | Avg (approx) | Next action |
|---|---|---|---|
| 1 | Celebrate seal | 4.4 | Keep. Lead marketing with it |
| 2 | Workout complete | 4.2 | Unify with Celebrate layout |
| 3 | History | 4.0 | Keep |
| 4 | Welcome | 3.6 | Type + lane tips |
| 5 | Today Track | 3.6 | Kill banner stack |
| 6 | Plan Edit | 3.8 | Label the back control |
| 7 | Flow / Log | 4.0 | Do not make this the home for gym users |
| 8 | Session | 3.4 | Hierarchy |
| 9 | Proof | 3.6 | First-run card only |
| 10 | Miles | 3.4 | Hours/$ |
| 11 | Nav Full | 3.4 | Train vs 5 tabs |
| 12 | Profile | 3.0 | Disclosures |
| 13 | Muscle picker | 2.2 | Hit-targets |
| 14 | Fitness empty→setup | 2.4 | Skip prefs |
| 15 | Premium sheet | 2.6 | Call it a beta switch |
| 16 | SetupWizard | 1.0 | Delete or wire |

Ava's first session and Jordan's first Check decide whether this product retains. Those two rows are the award-winning gap. Everything below the fold on Profile can wait.
