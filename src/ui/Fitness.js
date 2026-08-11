import {
  activeSessionForDate,
  completedSessions,
  filterExercises,
  formatVolume,
  MUSCLE_GROUPS,
  previousPerformance,
  progressiveOverloadHint,
  sessionVolume,
  sessionsThisWeek,
  suggestNextExercises,
  workoutStreak,
} from "../fitness.js";
import { formatDisplayDate, todayKey } from "../dates.js";
import { escapeHtml, icon } from "./dom.js";
import { renderMuscleThumb, muscleWikiUrl } from "./MuscleMap.js";

const FITNESS_TABS = [
  { id: "today", label: "Today" },
  { id: "history", label: "History" },
];

function muscleLabel(id) {
  return MUSCLE_GROUPS.find((g) => g.id === id)?.label || id || "General";
}

function renderSetRow(set, exerciseId, sessionId, unit) {
  return `
    <div class="fitness-set-row flex items-center gap-2">
      <button type="button" class="check shrink-0 ${set.done ? "is-done" : ""}" data-action="toggle-fitness-set" data-session="${escapeHtml(sessionId)}" data-exercise="${escapeHtml(exerciseId)}" data-set="${escapeHtml(set.id)}" aria-label="Mark set done">
        ${set.done ? icon("check", "h-4 w-4") : ""}
      </button>
      <input class="input !min-h-11 !w-16 shrink-0 text-center" type="number" min="0" step="1" inputmode="numeric" value="${Number(set.weight) || ""}" placeholder="0" data-action="fitness-set-field" data-field="weight" data-session="${escapeHtml(sessionId)}" data-exercise="${escapeHtml(exerciseId)}" data-set="${escapeHtml(set.id)}" aria-label="Weight" />
      <span class="text-xs shrink-0" style="color:var(--mute)">${escapeHtml(set.unit || unit)}</span>
      <span class="text-xs shrink-0" style="color:var(--mute)">×</span>
      <input class="input !min-h-11 !w-14 shrink-0 text-center" type="number" min="0" step="1" inputmode="numeric" value="${Number(set.reps) || ""}" placeholder="0" data-action="fitness-set-field" data-field="reps" data-session="${escapeHtml(sessionId)}" data-exercise="${escapeHtml(exerciseId)}" data-set="${escapeHtml(set.id)}" aria-label="Reps" />
      <button type="button" class="icon-btn shrink-0" data-action="delete-fitness-set" data-session="${escapeHtml(sessionId)}" data-exercise="${escapeHtml(exerciseId)}" data-set="${escapeHtml(set.id)}" aria-label="Remove set">${icon("trash", "h-4 w-4")}</button>
    </div>
  `;
}

function renderExerciseCard(exercise, session, settings, log) {
  const unit = settings.preferredUnit || "lb";
  const prev = previousPerformance(log, exercise.name);
  const prevLine = prev
    ? `Last: ${prev.weight} ${prev.unit} × ${prev.reps}`
    : "No history yet. Set the baseline.";

  const overload = progressiveOverloadHint(log, exercise.name, unit);
  const wiki = muscleWikiUrl(exercise.name);

  return `
    <article class="panel fitness-exercise-card">
      <div class="mb-3 flex items-start gap-3">
        ${renderMuscleThumb(exercise.muscleGroup)}
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <h3 class="task-title !min-h-0">${escapeHtml(exercise.name)}</h3>
            ${exercise.muscleGroup ? `<span class="chip">${escapeHtml(muscleLabel(exercise.muscleGroup))}</span>` : ""}
          </div>
          <p class="mt-1 text-xs" style="color:var(--mute)">${escapeHtml(prevLine)}</p>
          ${overload ? `<p class="mt-1 text-xs" style="color:var(--build)">${escapeHtml(overload)}</p>` : ""}
          ${wiki ? `<a class="mt-1 inline-block text-xs" style="color:var(--text-soft)" href="${escapeHtml(wiki)}" target="_blank" rel="noopener">Form guide</a>` : ""}
        </div>
        <button type="button" class="icon-btn shrink-0" data-action="delete-fitness-exercise" data-session="${escapeHtml(session.id)}" data-exercise="${escapeHtml(exercise.id)}" aria-label="Remove exercise">${icon("trash", "h-4 w-4")}</button>
      </div>
      <div class="space-y-2">
        ${(exercise.sets || []).map((set) => renderSetRow(set, exercise.id, session.id, unit)).join("")}
      </div>
      <button type="button" class="btn mt-3 w-full !min-h-11 !text-xs" data-action="add-fitness-set" data-session="${escapeHtml(session.id)}" data-exercise="${escapeHtml(exercise.id)}">
        ${icon("plus", "h-4 w-4")} Add set
      </button>
    </article>
  `;
}

function renderTodayPanel(state, ui) {
  const log = state.fitnessLog || [];
  const settings = state.fitnessSettings || { preferredUnit: "lb" };
  const date = todayKey();
  const session = activeSessionForDate(log, date);
  const weekCount = sessionsThisWeek(log).length;
  const streak = workoutStreak(log);

  if (!session) {
    const suggestions = suggestNextExercises(state, 3);
    const smart = suggestions.length
      ? `<div class="mt-4">
          <p class="mb-2 text-xs font-semibold" style="color:var(--mute)">Smart picks</p>
          <div class="flex flex-wrap gap-1">
            ${suggestions
              .map(
                (s) =>
                  `<button type="button" class="chip cursor-pointer" data-action="smart-start" data-label="${escapeHtml(s.label)}" data-muscle="${escapeHtml(s.muscleGroup || "")}">${escapeHtml(s.label)}${s.hint ? ` · ${escapeHtml(s.hint)}` : ""}</button>`
              )
              .join("")}
          </div>
        </div>`
      : "";
    return `
      <section class="panel fitness-empty">
        <p class="eyebrow mb-1">Today</p>
        <h2 class="display text-4xl">Ready to train?</h2>
        <p class="mt-2 text-sm" style="color:var(--mute)">Start a session, add exercises, log sets. Your last numbers show up automatically.</p>
        ${smart}
        <button type="button" class="btn btn-primary mt-5 w-full gap-2" data-action="start-workout">
          ${icon("plus", "h-4 w-4")} Start workout
        </button>
      </section>
    `;
  }

  const vol = sessionVolume(session, settings.preferredUnit);
  const exercises = session.exercises || [];

  return `
    <section class="panel space-y-3">
      <div class="grid grid-cols-3 gap-3">
        <div>
          <p class="text-xs" style="color:var(--mute)">this week</p>
          <p class="display text-3xl" style="color:var(--build)">${weekCount}</p>
        </div>
        <div>
          <p class="text-xs" style="color:var(--mute)">streak</p>
          <p class="display text-3xl">${streak}</p>
        </div>
        <div>
          <p class="text-xs" style="color:var(--mute)">volume</p>
          <p class="display text-3xl">${formatVolume(vol)}</p>
        </div>
      </div>
      <p class="text-xs" style="color:var(--mute)">${formatDisplayDate(date)} · ${exercises.length} exercise${exercises.length === 1 ? "" : "s"}</p>
    </section>

    ${exercises.length ? exercises.map((ex) => renderExerciseCard(ex, session, settings, log)).join("") : `<section class="panel-quiet text-center py-6"><p class="text-sm" style="color:var(--mute)">No exercises yet. Add your first move.</p></section>`}

    <div class="flex flex-col gap-2">
      <button type="button" class="btn w-full gap-2 !min-h-11" data-action="open-add-exercise" data-session="${escapeHtml(session.id)}">
        ${icon("plus", "h-4 w-4")} Add exercise
      </button>
      ${exercises.length ? `<button type="button" class="btn btn-primary w-full !min-h-11" data-action="complete-workout" data-session="${escapeHtml(session.id)}">Complete workout</button>` : ""}
    </div>
  `;
}

function renderHistoryPanel(state, settings) {
  const log = state.fitnessLog || [];
  const sessions = completedSessions(log).slice(0, 30);
  const unit = settings.preferredUnit || "lb";

  if (!sessions.length) {
    return `
      <section class="panel text-center py-8">
        <p class="text-sm" style="color:var(--mute)">No completed workouts yet. Finish today's session to build history.</p>
      </section>
    `;
  }

  return `
    <section class="panel space-y-2">
      <p class="eyebrow mb-1">Recent sessions</p>
      ${sessions
        .map((session) => {
          const count = (session.exercises || []).length;
          const vol = sessionVolume(session, unit);
          return `
          <div class="plan-row !min-h-[5rem]">
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="task-title !min-h-0">${formatDisplayDate(session.date)}</p>
                <p class="task-meta">${count} exercise${count === 1 ? "" : "s"} · ${formatVolume(vol)} ${unit} volume</p>
              </div>
              <button type="button" class="icon-btn" data-action="delete-workout" data-session="${escapeHtml(session.id)}" aria-label="Delete workout">${icon("trash", "h-4 w-4")}</button>
            </div>
          </div>`;
        })
        .join("")}
    </section>
  `;
}

export function renderFitness(state, ui) {
  const settings = state.fitnessSettings || { preferredUnit: "lb" };
  const tab = ui.fitnessTab || "today";

  const tabBar = `
    <div class="segment" role="tablist" aria-label="Fitness sections">
      ${FITNESS_TABS.map(
        (t) =>
          `<button type="button" class="segment-btn ${tab === t.id ? "is-active accent" : ""}" data-action="fitness-tab" data-tab="${t.id}" role="tab" aria-selected="${tab === t.id}">${t.label}</button>`
      ).join("")}
    </div>
  `;

  const panel = tab === "history" ? renderHistoryPanel(state, settings) : renderTodayPanel(state, ui);

  return `
    <section class="fitness-screen space-y-3">
      ${tabBar}
      ${panel}
    </section>
  `;
}

export function renderAddExerciseModal(ui, settings) {
  const sessionId = ui.fitnessAddSession || "";
  const query = ui.fitnessSearch || "";
  const muscle = ui.fitnessMuscle || "all";
  const unit = settings?.preferredUnit || "lb";
  const recent = settings?.recentExercises || [];
  const results = filterExercises(query, muscle).slice(0, 12);

  const recentBlock =
    recent.length && !query
      ? `
      <div>
        <p class="mb-2 text-xs font-semibold" style="color:var(--mute)">Recent</p>
        <div class="flex flex-wrap gap-1">
          ${recent
            .map(
              (name) =>
                `<button type="button" class="chip cursor-pointer" data-action="pick-exercise" data-session="${escapeHtml(sessionId)}" data-name="${escapeHtml(name)}">${escapeHtml(name)}</button>`
            )
            .join("")}
        </div>
      </div>`
      : "";

  const muscleFilters = `
    <div class="flex flex-wrap gap-1">
      ${MUSCLE_GROUPS.map(
        (g) =>
          `<button type="button" class="chip ${muscle === g.id ? "chip-build" : ""}" data-action="fitness-muscle" data-muscle="${g.id}">${escapeHtml(g.label)}</button>`
      ).join("")}
    </div>
  `;

  return `
    <div class="modal-backdrop" data-action="close-modal">
      <div class="modal-sheet modal-scroll-body fitness-modal" role="dialog" aria-modal="true" aria-label="Add exercise" data-stop>
        <h2 class="display text-3xl">Add exercise</h2>
        <form class="mt-3 space-y-3" data-action="search-exercise">
          <input type="hidden" name="sessionId" value="${escapeHtml(sessionId)}" />
          <input class="input" name="query" placeholder="Search exercises..." value="${escapeHtml(query)}" autocomplete="off" />
        </form>
        ${muscleFilters}
        ${recentBlock}
        <div class="modal-scroll-inner scroll-touch mt-3 space-y-2">
          ${results
            .map(
              (ex) => `
            <button type="button" class="plan-row !min-h-[4.5rem] w-full text-left flex items-center gap-3" data-action="pick-exercise" data-session="${escapeHtml(sessionId)}" data-name="${escapeHtml(ex.name)}" data-muscle="${escapeHtml(ex.muscleGroup)}">
              ${renderMuscleThumb(ex.muscleGroup)}
              <span class="min-w-0">
                <p class="task-title !min-h-0">${escapeHtml(ex.name)}</p>
                <p class="task-meta">${escapeHtml(muscleLabel(ex.muscleGroup))}</p>
              </span>
            </button>`
            )
            .join("")}
        </div>
        <form class="mt-4 space-y-2 border-t pt-4 shrink-0" style="border-color:var(--border)" data-action="custom-exercise">
          <input type="hidden" name="sessionId" value="${escapeHtml(sessionId)}" />
          <p class="text-xs font-semibold" style="color:var(--mute)">Custom exercise</p>
          <input class="input" name="name" placeholder="Exercise name" required />
          <button type="submit" class="btn btn-primary w-full">Add custom</button>
        </form>
        <button type="button" class="btn w-full mt-2" data-action="close-modal">Cancel</button>
      </div>
    </div>
  `;
}

export function renderFitnessCelebrate(payload) {
  const vol = payload?.volume || 0;
  const unit = payload?.unit || "lb";
  const count = payload?.exerciseCount || 0;

  return `
    <div class="celebrate" role="dialog" aria-modal="true" aria-label="Workout complete">
      <div class="celebrate-card">
        <div class="sealed-stamp mx-auto mb-4">LIFT</div>
        <p class="eyebrow" style="color:var(--build)">Workout sealed</p>
        <h2 class="display text-5xl mt-2">Progress logged.</h2>
        <p class="mt-3 text-sm" style="color:var(--mute)">
          ${count} exercise${count === 1 ? "" : "s"} · ${formatVolume(vol)} ${escapeHtml(unit)} volume
        </p>
        <div class="mt-6 flex flex-col gap-2">
          <button type="button" class="btn btn-primary w-full gap-2" data-action="share-progress" data-scope="day">${icon("proof", "h-5 w-5")} Share workout</button>
          <button type="button" class="btn w-full" data-action="dismiss-fitness-celebrate">Keep moving</button>
        </div>
      </div>
    </div>
  `;
}
