import { formatVolume, cooldownMovesForSession } from "../../fitness.js";
import { escapeHtml, icon } from "../dom.js";

function headlineFor(payload) {
  if (payload?.mode === "ended") {
    if (payload.tier === "pr" && payload.exerciseName) {
      return `Session ended. New PR: ${payload.exerciseName}.`;
    }
    return "Session ended.";
  }
  const tier = payload?.tier || "standard";
  if (tier === "pr" && payload.exerciseName) {
    return `New PR: ${payload.exerciseName}.`;
  }
  if (tier === "streak-milestone" && payload.streakCount) {
    return `${payload.streakCount}-day streak. Let's go.`;
  }
  return "Workout complete.";
}

function subtextFor(payload) {
  const exercises = Number(payload.exerciseCount) || 0;
  const done = Number(payload.setCount) || 0;
  const total = Number(payload.totalSets) || done;
  const vol = formatVolume(payload.totalVolume || 0);
  const unit = payload.unit || "lb";
  const mins = Number(payload.durationMinutes) || 1;
  if (payload?.mode === "ended") {
    return `${done}/${total} sets logged · ${exercises} exercise${exercises === 1 ? "" : "s"} · ${escapeHtml(vol)} ${escapeHtml(unit)} · ${mins} min`;
  }
  return `${exercises} exercise${exercises === 1 ? "" : "s"} · ${done} set${done === 1 ? "" : "s"} · ${escapeHtml(vol)} ${escapeHtml(unit)} total volume · ${mins} min`;
}

function milestoneStat(payload) {
  const tier = payload?.tier || "standard";
  if (tier === "pr" && payload.previousValue && payload.newValue) {
    return `
      <div class="wc-stat" data-anim="stat">
        <p class="wc-stat-label">Previous</p>
        <p class="wc-stat-values">
          <span class="wc-stat-old">${escapeHtml(payload.previousValue)}</span>
          <span class="wc-stat-arrow" aria-hidden="true">→</span>
          <span class="wc-stat-new">${escapeHtml(payload.newValue)}</span>
        </p>
      </div>`;
  }
  if (payload?.mode !== "ended" && tier === "streak-milestone" && payload.streakCount) {
    return `
      <div class="wc-stat wc-stat-streak" data-anim="stat">
        <span class="wc-flame" aria-hidden="true">${icon("spark", "h-5 w-5")}</span>
        <p class="wc-stat-values">
          <span class="wc-stat-new">${Number(payload.streakCount)}</span>
          <span class="wc-stat-label">day streak</span>
        </p>
      </div>`;
  }
  if (payload?.mode === "ended") {
    const done = Number(payload.setCount) || 0;
    const total = Number(payload.totalSets) || done;
    return `
      <div class="wc-stat" data-anim="stat">
        <p class="wc-stat-label">Logged</p>
        <p class="wc-stat-values">
          <span class="wc-stat-new">${done}/${total}</span>
          <span class="wc-stat-label">sets</span>
        </p>
      </div>`;
  }
  return "";
}

function primaryCta(payload) {
  const tier = payload?.tier || "standard";
  if (payload?.mode === "ended") {
    return `<button type="button" class="btn btn-primary w-full wc-primary" data-action="dismiss-fitness-celebrate">Done</button>`;
  }
  if (tier === "pr") {
    return `<button type="button" class="btn btn-primary w-full gap-2 wc-primary" data-action="share-progress" data-scope="fitness" data-from-celebrate="1">${icon("proof", "h-5 w-5")} Share this PR</button>`;
  }
  if (tier === "streak-milestone") {
    return `<button type="button" class="btn btn-primary w-full gap-2 wc-primary" data-action="share-progress" data-scope="fitness" data-from-celebrate="1">${icon("proof", "h-5 w-5")} Share this streak</button>`;
  }
  return `<button type="button" class="btn btn-primary w-full wc-primary" data-action="dismiss-fitness-celebrate">Done</button>`;
}

function cooldownStrip(payload, ui = {}) {
  if (ui.fitnessCooldownSkipped) return "";
  const session = {
    exercises: (payload.muscleGroups || []).map((g) => ({ muscleGroup: g })),
  };
  const moves = cooldownMovesForSession(session);
  const checked = new Set(ui.fitnessCooldownChecked || []);
  return `
    <section class="stretch-strip stretch-strip-cool" data-anim="copy">
      <p class="text-xs font-semibold uppercase tracking-wide" style="color:var(--mute)">Cool-down</p>
      <p class="help-text mt-0.5">30 to 60 seconds per hold. Optional.</p>
      <ul class="stretch-list">
        ${moves
          .map(
            (m) => `
          <li>
            <button type="button" class="stretch-check ${checked.has(m.id) ? "is-done" : ""}" data-action="toggle-cooldown-move" data-id="${escapeHtml(m.id)}">
              <span class="check shrink-0 ${checked.has(m.id) ? "is-done" : ""}">${checked.has(m.id) ? icon("check", "h-3.5 w-3.5") : ""}</span>
              <span class="min-w-0 text-left">
                <span class="stretch-name">${escapeHtml(m.name)}</span>
                <span class="stretch-meta">${m.seconds}s</span>
              </span>
            </button>
          </li>`
          )
          .join("")}
      </ul>
      <button type="button" class="text-link mt-2" data-action="skip-cooldown">Skip</button>
    </section>
  `;
}

/** Full-screen workout completion or session-ended celebration. */
export function renderWorkoutCompletion(payload = {}, ui = {}) {
  const ended = payload.mode === "ended";
  const tier = payload.tier || "standard";
  const milestone = !ended && (tier === "pr" || tier === "streak-milestone");
  const tierClass = milestone ? "is-milestone" : ended ? "is-ended" : "is-standard";
  const accentVar = milestone ? "var(--accent-milestone)" : "var(--accent-core)";
  const sessionId = payload.sessionId || "";
  const sparkles = milestone
    ? `<span class="wc-sparkle" style="--i:0" aria-hidden="true"></span>
       <span class="wc-sparkle" style="--i:1" aria-hidden="true"></span>
       <span class="wc-sparkle" style="--i:2" aria-hidden="true"></span>`
    : "";

  return `
    <div class="celebrate workout-completion ${tierClass}" role="dialog" aria-modal="true" aria-label="${ended ? "Session ended" : "Workout complete"}" style="--wc-accent:${accentVar}">
      <div class="wc-glow" data-anim="glow" aria-hidden="true"></div>
      <div class="wc-stage">
        <div class="wc-badge-wrap" data-anim="badge">
          ${sparkles}
          <div class="wc-badge" aria-hidden="true">
            ${icon(ended ? "spark" : "check", "h-12 w-12")}
          </div>
        </div>
        <h2 class="wc-headline display" data-anim="copy">${escapeHtml(headlineFor(payload))}</h2>
        <p class="wc-subtext" data-anim="copy">${subtextFor(payload)}</p>
        ${milestoneStat(payload)}
        ${cooldownStrip(payload, ui)}
        <div class="wc-actions" data-anim="actions">
          ${primaryCta(payload)}
          <button type="button" class="wc-link" data-action="view-fitness-session" data-session="${escapeHtml(sessionId)}">View full session</button>
          ${
            milestone
              ? `<button type="button" class="wc-link wc-link-muted" data-action="dismiss-fitness-celebrate">Done</button>`
              : ""
          }
        </div>
      </div>
    </div>
  `;
}
