import { CHALLENGE_META } from "../schedule.js";
import { challengeDayNumber, isChallengeUnlocked } from "../challenge.js";
import {
  computeStreak,
  dayCompletion,
  heatShade,
  longestStreak,
  weekSplit,
} from "../streaks.js";
import {
  completedSessions,
  formatVolume,
  sessionVolume,
  sessionsThisWeek,
  workoutStreak,
  defaultFitnessSettings,
} from "../fitness.js";
import { escapeHtml, icon, pctLabel } from "./dom.js";

const STATUSES = [
  { id: "yes", label: "Yes" },
  { id: "partial", label: "Partial" },
  { id: "no", label: "No" },
  { id: "skip", label: "Skip" },
];

const COACH = {
  q0: {
    text: "Wednesday assignments slipped. Put the due block on Sunday night in Edit, then protect it in Track.",
    action: "open-edit",
    actionLabel: "Open Edit",
  },
  q1: {
    text: "Apartment drift. Add a short tidy block on a build day so Sunday is not a scramble.",
    action: "open-edit",
    actionLabel: "Open Edit",
  },
  q2: {
    text: "Uber math is fuzzy. Log every night and respect soft stop before the hard cap.",
    action: "open-miles",
    actionLabel: "Open Miles",
  },
  q3: {
    text: "Monday outreach missed. Clear research / post / send before the week escapes.",
    action: "open-hustle-flow",
    actionLabel: "Open Hustle Flow",
  },
  q4: {
    text: "Family call skipped. Put a soft reminder on the calendar day and treat it as a kept promise.",
    action: "today-mode",
    actionLabel: "Open Today Track",
    mode: "track",
  },
};

function summarizeAnswers(answers, total) {
  let onTrack = 0;
  let atRisk = 0;
  let answered = 0;
  for (let i = 0; i < total; i++) {
    const status = answers[`q${i}`]?.status;
    if (!status) continue;
    answered += 1;
    if (status === "yes" || status === "partial") onTrack += 1;
    if (status === "no" || status === "partial") atRisk += 1;
  }
  return { answered, onTrack, atRisk, unanswered: total - answered };
}

function weekFitnessVolume(log = [], unit = "lb") {
  return sessionsThisWeek(log).reduce((sum, s) => sum + sessionVolume(s, unit), 0);
}

function proofInsights(state, log, weekCount) {
  const lines = [];
  if (weekCount === 0) lines.push("0 workouts this week — schedule one session.");
  else if (weekCount === 1) lines.push("One session logged. A second locks the week.");
  else lines.push(`${weekCount} workouts this week. Momentum is real.`);

  const coreToday = dayCompletion(state, 0);
  if (coreToday.coreCount > 0 && coreToday.doneCore / coreToday.coreCount < 0.5) {
    lines.push("Core completion lagging today — close the open blocks.");
  } else if (computeStreak(state) === 0) {
    lines.push("Day streak reset. Protect tomorrow's first block.");
  }

  const last = completedSessions(log).sort((a, b) => (b.date > a.date ? 1 : -1))[0];
  if (last && workoutStreak(log) >= 3) {
    lines.push(`Workout streak ${workoutStreak(log)}. Keep the chain.`);
  }

  return lines.slice(0, 2);
}

export function renderProof(state, ui) {
  const streak = computeStreak(state);
  const longest = longestStreak(state);
  const split = weekSplit(state);
  const dayNum = state.challenge ? challengeDayNumber(state.challenge) : 0;
  const unlocked = isChallengeUnlocked(state.challenge);
  const edits = state.scheduleEdits?.length || 0;
  const answers = state.day30Answers || {};
  const questions =
    Array.isArray(state.day30Questions) && state.day30Questions.length
      ? state.day30Questions
      : CHALLENGE_META.reviewQuestions || [];
  const openId = ui.day30Open || null;
  const showCoach = Boolean(ui.day30Coach);
  const summary = summarizeAnswers(answers, questions.length);
  const earlyNudge = dayNum >= 21 && !unlocked;
  const sectionOpen =
    ui.day30SectionOpen != null ? Boolean(ui.day30SectionOpen) : unlocked || dayNum >= 21;

  const log = state.fitnessLog || [];
  const settings = { ...defaultFitnessSettings(), ...(state.fitnessSettings || {}) };
  const unit = settings.preferredUnit || "lb";
  const fitStreak = workoutStreak(log);
  const weekCount = sessionsThisWeek(log).length;
  const weekVol = weekFitnessVolume(log, unit);
  const insights = proofInsights(state, log, weekCount);

  const cells = [];
  for (let i = 29; i >= 0; i--) {
    const c = dayCompletion(state, i);
    cells.push(
      `<div class="heat-cell" style="background:${heatShade(c.pct)}" title="${c.date}: ${Math.round(c.pct * 100)}%"></div>`
    );
  }

  const spark = [];
  for (let i = 13; i >= 0; i--) {
    const c = dayCompletion(state, i);
    const h = Math.max(6, Math.round(c.pct * 44));
    spark.push(
      `<div class="flex w-full items-end justify-center"><div class="w-1.5 rounded-full" style="height:${h}px;background:var(--build)" title="${Math.round(c.pct * 100)}%"></div></div>`
    );
  }

  const board = questions
    .map((q, i) => {
      const id = `q${i}`;
      const ans = answers[id] || {};
      const isOpen = openId === id;
      const status = ans.status || "";
      return `
        <div class="review-row ${status ? `is-${status}` : ""}">
          <button type="button" class="review-head" data-action="day30-open" data-id="${id}" aria-expanded="${isOpen}">
            <span class="display text-2xl" style="color:var(--build)">${i + 1}</span>
            <span class="min-w-0 flex-1 text-left">
              <p class="text-sm leading-snug">${escapeHtml(q)}</p>
              <p class="mt-1 text-[11px]" style="color:var(--mute)">${status ? status : "tap to answer"}</p>
            </span>
          </button>
          ${
            isOpen
              ? `<div class="review-body">
                  <div class="flex flex-wrap gap-1" role="group" aria-label="Answer question ${i + 1}">
                    ${STATUSES.map(
                      (s) =>
                        `<button type="button" class="chip ${status === s.id ? "chip-build" : ""}" data-action="day30-status" data-id="${id}" data-status="${s.id}" aria-pressed="${status === s.id}">${s.label}</button>`
                    ).join("")}
                  </div>
                  <form class="mt-2" data-action="day30-note" data-id="${id}">
                    <label class="sr-only" for="note-${id}">Note</label>
                    <input class="input" id="note-${id}" name="note" placeholder="One-line note (optional)" value="${escapeHtml(ans.note || "")}" />
                    <button class="btn mt-2 w-full" type="submit">Save note</button>
                  </form>
                </div>`
              : ""
          }
        </div>`;
    })
    .join("");

  const weakNotes = questions
    .map((_, i) => {
      const id = `q${i}`;
      const status = answers[id]?.status;
      if (status !== "no" && status !== "partial") return "";
      const coach = COACH[id];
      if (!coach) return "";
      const actionAttr =
        coach.action === "today-mode"
          ? `data-action="set-tab" data-tab="today"`
          : `data-action="${coach.action}"`;
      return `<li class="space-y-2">
        <p class="text-sm" style="color:var(--text-soft)"><span class="font-semibold" style="color:var(--text)">Q${i + 1}:</span> ${escapeHtml(coach.text)}</p>
        <button type="button" class="btn !min-h-11 !text-xs w-full" ${actionAttr}>${escapeHtml(coach.actionLabel)}</button>
      </li>`;
    })
    .filter(Boolean)
    .join("");

  return `
    <section class="screen">
      <header class="page-header">
        <p class="eyebrow">Proof</p>
        <h1 class="display">Numbers only</h1>
        <p class="serif-accent mt-2 text-xl" style="color:var(--mute)">Momentum you can audit.</p>
      </header>

      <div class="proof-bento" aria-label="Proof metrics">
        <section class="proof-tile">
          <p class="proof-tile-label">Current streak</p>
          <p class="proof-tile-value" style="color:var(--build)">${streak}</p>
          <p class="mt-2 text-xs" style="color:var(--mute)">Longest ${longest}</p>
        </section>

        <section class="proof-tile">
          <p class="proof-tile-label">Fitness pulse</p>
          <p class="proof-tile-value">${fitStreak}</p>
          <p class="mt-2 text-xs" style="color:var(--mute)">${weekCount} this week · ${formatVolume(weekVol)} vol</p>
        </section>

        <section class="proof-tile proof-tile-wide">
          <p class="proof-tile-label">This week split</p>
          <div class="mt-3 space-y-3">
            <div>
              <div class="mb-1 flex justify-between text-sm"><span>Build</span><span style="color:var(--build)">${pctLabel(split.buildPct)}</span></div>
              <div class="day-rail"><div class="day-rail-fill" style="width:${Math.round(split.buildPct * 100)}%"></div></div>
            </div>
            <div>
              <div class="mb-1 flex justify-between text-sm"><span>Maintain</span><span style="color:var(--maintain)">${pctLabel(split.maintainPct)}</span></div>
              <div class="day-rail"><div class="day-rail-fill maintain" style="width:${Math.round(split.maintainPct * 100)}%"></div></div>
            </div>
          </div>
        </section>

        <section class="proof-tile proof-tile-wide">
          <p class="proof-tile-label">Last 30 days</p>
          <div class="mt-3 grid grid-cols-10 justify-items-center gap-1.5" aria-hidden="true">${cells.join("")}</div>
        </section>

        <section class="proof-tile">
          <p class="proof-tile-label">Last 14 days</p>
          <div class="mt-3 flex h-12 items-end gap-1" aria-hidden="true">${spark.join("")}</div>
        </section>

        <section class="proof-tile">
          <p class="proof-tile-label">Insight</p>
          <ul class="proof-insight-list">
            ${insights.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}
          </ul>
        </section>

        <section class="proof-tile proof-tile-wide">
          <p class="proof-tile-label mb-3">Share proof</p>
          <div class="flex flex-col gap-2">
            <button type="button" class="btn btn-primary w-full !min-h-11" data-action="share-progress" data-scope="week">Share this week</button>
            <button type="button" class="btn w-full !min-h-11" data-action="share-progress" data-scope="month">Share last 30 days</button>
          </div>
        </section>
      </div>

      ${
        earlyNudge
          ? `<div class="banner banner-warn" role="status">
              Day ${dayNum}/30. Start the review now. Early answers beat a Day 30 surprise.
              ${summary.unanswered ? ` ${summary.unanswered} still unanswered.` : ""}
              ${summary.atRisk ? ` At risk signals: ${summary.atRisk}.` : ""}
            </div>`
          : ""
      }

      <section class="panel" id="day30-review">
        <button type="button" class="review-head w-full !px-0" data-action="toggle-day30-section" aria-expanded="${sectionOpen}">
          <div class="min-w-0 text-left">
            <p class="eyebrow mb-0">Day 30 review</p>
            <p class="mt-1 text-xs" style="color:var(--mute)">answered ${summary.answered}/${questions.length} · ${unlocked ? "unlocked" : `day ${dayNum}/30`}</p>
          </div>
          <span class="chevron-rot ${sectionOpen ? "is-open" : ""}" aria-hidden="true">${icon("down", "h-5 w-5")}</span>
        </button>
        <div class="day30-body ${sectionOpen ? "is-open" : ""}">
        ${
          sectionOpen
            ? `
        <div class="mt-3 mb-3 flex flex-wrap gap-2 text-xs" style="color:var(--mute)">
          <span>On track: <strong style="color:var(--build)">${summary.onTrack}</strong></span>
          <span>At risk: <strong style="color:var(--maintain)">${summary.atRisk}</strong></span>
          <span>Plan edits: ${edits}</span>
        </div>
        <div class="space-y-2">${board}</div>
        <button type="button" class="btn btn-primary mt-4 w-full" data-action="day30-coach" aria-expanded="${showCoach}">
          ${showCoach ? "Hide adjust notes" : "Generate adjust notes"}
        </button>
        ${
          showCoach
            ? `<div class="mt-3 rounded-2xl px-3 py-3" style="background:var(--bg-elev)">
                <p class="eyebrow mb-2">Adjust notes</p>
                ${
                  weakNotes
                    ? `<ul class="space-y-3">${weakNotes}</ul>`
                    : `<p class="text-sm" style="color:var(--mute)">No weak answers yet. Mark a no or partial to unlock coaching.</p>`
                }
              </div>`
            : ""
        }`
            : ""
        }
        </div>
      </section>
    </section>
  `;
}
