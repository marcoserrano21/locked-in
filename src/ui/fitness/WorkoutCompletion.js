import { formatVolume } from "../../fitness.js";
import { escapeHtml, icon } from "../dom.js";

function headlineFor(payload) {
  const tier = payload?.tier || "standard";
  if (tier === "pr" && payload.exerciseName) {
    return `New PR: ${payload.exerciseName}.`;
  }
  if (tier === "streak-milestone" && payload.streakCount) {
    return `${payload.streakCount}-day streak. Let's go.`;
  }
  return "Workout complete.";
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
  if (tier === "streak-milestone" && payload.streakCount) {
    return `
      <div class="wc-stat wc-stat-streak" data-anim="stat">
        <span class="wc-flame" aria-hidden="true">${icon("spark", "h-5 w-5")}</span>
        <p class="wc-stat-values">
          <span class="wc-stat-new">${Number(payload.streakCount)}</span>
          <span class="wc-stat-label">day streak</span>
        </p>
      </div>`;
  }
  return "";
}

function primaryCta(payload) {
  const tier = payload?.tier || "standard";
  if (tier === "pr") {
    return `<button type="button" class="btn btn-primary w-full gap-2 wc-primary" data-action="share-progress" data-scope="fitness" data-from-celebrate="1">${icon("proof", "h-5 w-5")} Share this PR</button>`;
  }
  if (tier === "streak-milestone") {
    return `<button type="button" class="btn btn-primary w-full gap-2 wc-primary" data-action="share-progress" data-scope="fitness" data-from-celebrate="1">${icon("proof", "h-5 w-5")} Share this streak</button>`;
  }
  return `<button type="button" class="btn btn-primary w-full wc-primary" data-action="dismiss-fitness-celebrate">Done</button>`;
}

/** Full-screen workout completion celebration. */
export function renderWorkoutCompletion(payload = {}) {
  const tier = payload.tier || "standard";
  const milestone = tier === "pr" || tier === "streak-milestone";
  const tierClass = milestone ? "is-milestone" : "is-standard";
  const accentVar = milestone ? "var(--accent-milestone)" : "var(--accent-core)";
  const exercises = Number(payload.exerciseCount) || 0;
  const sets = Number(payload.setCount) || 0;
  const vol = formatVolume(payload.totalVolume || 0);
  const unit = payload.unit || "lb";
  const mins = Number(payload.durationMinutes) || 1;
  const sessionId = payload.sessionId || "";
  const sparkles = milestone
    ? `<span class="wc-sparkle" style="--i:0" aria-hidden="true"></span>
       <span class="wc-sparkle" style="--i:1" aria-hidden="true"></span>
       <span class="wc-sparkle" style="--i:2" aria-hidden="true"></span>`
    : "";

  return `
    <div class="celebrate workout-completion ${tierClass}" role="dialog" aria-modal="true" aria-label="Workout complete" style="--wc-accent:${accentVar}">
      <div class="wc-glow" data-anim="glow" aria-hidden="true"></div>
      <div class="wc-stage">
        <div class="wc-badge-wrap" data-anim="badge">
          ${sparkles}
          <div class="wc-badge" aria-hidden="true">
            ${icon("check", "h-12 w-12")}
          </div>
        </div>
        <h2 class="wc-headline display" data-anim="copy">${escapeHtml(headlineFor(payload))}</h2>
        <p class="wc-subtext" data-anim="copy">
          ${exercises} exercise${exercises === 1 ? "" : "s"} · ${sets} set${sets === 1 ? "" : "s"} · ${escapeHtml(vol)} ${escapeHtml(unit)} total volume · ${mins} min
        </p>
        ${milestoneStat(payload)}
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
