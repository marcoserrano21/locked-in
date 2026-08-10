import {
  activeSessionForDate,
  canCompleteWorkout,
  completedSessions,
  EQUIPMENT_OPTIONS,
  EXPERIENCE_LEVELS,
  FITNESS_GOALS,
  trainWhyLine,
  filterExercises,
  formatVolume,
  countExercisesForEquipment,
  MAIN_MUSCLE_GROUPS,
  ACCESSORY_MUSCLE_GROUPS,
  muscleLabel,
  previousPerformance,
  progressiveOverloadHint,
  sessionVolume,
  sessionsThisWeek,
  workoutStreak,
  exerciseVolumeHistory,
  sparklinePath,
} from "../fitness.js";
import { formatDisplayDate, todayKey } from "../dates.js";
import { escapeHtml, icon } from "./dom.js";
import { renderMuscleThumb } from "./MuscleMap.js";
import { paginate, renderPager } from "./Pagination.js";
import { renderExerciseMenu } from "./fitness/ExerciseMenu.js";

const FITNESS_TABS = [
  { id: "today", label: "Today" },
  { id: "history", label: "History" },
];

const FILTER_GROUPS = [{ id: "all", label: "All" }, ...MAIN_MUSCLE_GROUPS, ...ACCESSORY_MUSCLE_GROUPS];

function isFavorite(settings, name) {
  const key = String(name || "").toLowerCase();
  return (settings?.favoriteExercises || []).some((n) => n.toLowerCase() === key);
}

function renderEquipmentPanel(settings, ui, { compact = false } = {}) {
  const open = Boolean(ui.fitnessEquipmentOpen);
  const available = new Set(settings?.equipmentAvailable || []);
  const blocked = settings?.blockedExercises || [];
  const level = settings?.experienceLevel || "beginner";
  const goal = settings?.goal || "build_muscle";
  const trainWhy = settings?.trainWhy || [];
  const whyLine = trainWhyLine(trainWhy);
  const goalLabel = FITNESS_GOALS.find((g) => g.id === goal)?.label || "Build muscle";
  const matchCount = countExercisesForEquipment(settings?.equipmentAvailable || []);
  const showAllEquipment = Boolean(ui.fitnessEquipmentMore);
  const visibleEquipment = showAllEquipment ? EQUIPMENT_OPTIONS : EQUIPMENT_OPTIONS.slice(0, 4);
  const hiddenCount = EQUIPMENT_OPTIONS.length - 4;

  return `
    <section class="panel ${compact ? "!py-3" : ""}">
      <button type="button" class="flex w-full items-center justify-between gap-3 text-left cursor-pointer" data-action="toggle-equipment-panel" aria-expanded="${open}">
        <span>
          <span class="eyebrow mb-0 block">Your equipment</span>
          <span class="text-xs" style="color:var(--mute)">${available.size} available · ${matchCount} exercises match</span>
        </span>
        <span class="chevron-rot ${open ? "is-open" : ""}">${icon("down", "h-4 w-4 shrink-0")}</span>
      </button>
      <div class="fitness-panel-body ${open ? "is-open" : ""}">
        <div class="fitness-panel-body-inner">
          <div class="mt-3 space-y-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide mb-2" style="color:var(--mute)">Level</p>
              <div class="segment" role="group" aria-label="Experience level">
                ${EXPERIENCE_LEVELS.map(
                  (l) =>
                    `<button type="button" class="segment-btn ${level === l.id ? "is-active accent" : ""}" data-action="set-fitness-level" data-level="${l.id}">${escapeHtml(l.label)}</button>`
                ).join("")}
              </div>
            </div>
            <div class="rounded-2xl px-3 py-3" style="background:var(--bg-elev)">
              <p class="text-xs font-semibold uppercase tracking-wide" style="color:var(--mute)">Training prefs</p>
              <p class="mt-1 text-sm">${escapeHtml(goalLabel)}${trainWhy.length ? ` · ${trainWhy.length} why` : ""}</p>
              ${whyLine ? `<p class="mt-1 text-xs" style="color:var(--build)">${escapeHtml(whyLine)}</p>` : ""}
              <button type="button" class="btn mt-3 w-full !min-h-11 !text-xs" data-action="open-fitness-prefs">Edit training prefs</button>
            </div>
            <div class="flex flex-wrap gap-2">
              ${visibleEquipment.map(
                (opt) => `
              <button type="button" class="chip ${available.has(opt.id) ? "chip-build" : ""}" data-action="toggle-equipment" data-id="${opt.id}" aria-pressed="${available.has(opt.id)}">
                ${escapeHtml(opt.label)}
              </button>`
              ).join("")}
              ${
                hiddenCount > 0
                  ? `<button type="button" class="chip chip-soft" data-action="fitness-equipment-more" aria-pressed="${showAllEquipment}">${showAllEquipment ? "Less" : `+${hiddenCount} more`}</button>`
                  : ""
              }
            </div>
          </div>
          ${
            blocked.length
              ? `
            <div class="mt-4 space-y-2">
              <p class="text-xs font-semibold uppercase tracking-wide" style="color:var(--mute)">Blocked</p>
              ${blocked
                .map(
                  (name) => `
                <div class="flex items-center justify-between gap-2">
                  <span class="text-sm truncate">${escapeHtml(name)}</span>
                  <button type="button" class="btn !min-h-9 !px-3 !text-xs" data-action="unblock-exercise" data-name="${escapeHtml(name)}">Unblock</button>
                </div>`
                )
                .join("")}
            </div>`
              : ""
          }
        </div>
      </div>
    </section>
  `;
}

function renderSetRow(set, exercise, sessionId, unit) {
  return `
    <div class="fitness-set-row flex items-center gap-2">
      <button type="button" class="check shrink-0 ${set.done ? "is-done" : ""}" data-action="toggle-fitness-set" data-session="${escapeHtml(sessionId)}" data-exercise="${escapeHtml(exercise.id)}" data-set="${escapeHtml(set.id)}" aria-label="Mark set done">
        ${set.done ? icon("check", "h-4 w-4") : ""}
      </button>
      <input class="input !min-h-11 !w-16 shrink-0 text-center" type="number" min="0" step="1" inputmode="numeric" value="${Number(set.weight) || ""}" placeholder="0" data-action="fitness-set-field" data-field="weight" data-session="${escapeHtml(sessionId)}" data-exercise="${escapeHtml(exercise.id)}" data-set="${escapeHtml(set.id)}" aria-label="Weight" />
      <span class="text-xs shrink-0" style="color:var(--mute)">${escapeHtml(set.unit || unit)}</span>
      <span class="text-xs shrink-0" style="color:var(--mute)">×</span>
      <input class="input !min-h-11 !w-14 shrink-0 text-center" type="number" min="0" step="1" inputmode="numeric" value="${Number(set.reps) || ""}" placeholder="0" data-action="fitness-set-field" data-field="reps" data-session="${escapeHtml(sessionId)}" data-exercise="${escapeHtml(exercise.id)}" data-set="${escapeHtml(set.id)}" aria-label="Reps" />
      <button type="button" class="icon-btn shrink-0" data-action="start-rest-timer" data-seconds="90" aria-label="Start 90s rest">${icon("refresh", "h-4 w-4")}</button>
      <button type="button" class="icon-btn shrink-0" data-action="delete-fitness-set" data-session="${escapeHtml(sessionId)}" data-exercise="${escapeHtml(exercise.id)}" data-set="${escapeHtml(set.id)}" aria-label="Delete set">${icon("trash", "h-4 w-4")}</button>
    </div>
  `;
}

function renderRestTimerBar(ui) {
  const timer = ui.restTimer;
  if (!timer?.endsAt) return "";
  const left = Math.max(0, Math.ceil((timer.endsAt - Date.now()) / 1000));
  const mm = String(Math.floor(left / 60)).padStart(1, "0");
  const ss = String(left % 60).padStart(2, "0");
  return `
    <div class="rest-timer-bar" role="status" aria-live="polite">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide" style="color:var(--mute)">Rest</p>
        <p class="rest-timer-count">${mm}:${ss}</p>
      </div>
      <div class="flex gap-1">
        <button type="button" class="btn !min-h-10 !px-3 !text-xs" data-action="start-rest-timer" data-seconds="60">60</button>
        <button type="button" class="btn !min-h-10 !px-3 !text-xs" data-action="start-rest-timer" data-seconds="90">90</button>
        <button type="button" class="btn !min-h-10 !px-3 !text-xs" data-action="start-rest-timer" data-seconds="120">120</button>
        <button type="button" class="btn !min-h-10 !px-3 !text-xs" data-action="clear-rest-timer">Skip</button>
      </div>
    </div>`;
}

function renderExerciseCard(exercise, session, settings, log, { open = false } = {}) {
  const unit = settings.preferredUnit || "lb";
  const prev = previousPerformance(log, exercise.name);
  const prevLine = prev
    ? `Last: ${prev.weight} ${prev.unit} × ${prev.reps}`
    : "No history yet. Set the baseline.";
  const overload = progressiveOverloadHint(log, exercise.name, unit);
  const fav = isFavorite(settings, exercise.name);
  const sets = exercise.sets || [];
  const doneSets = sets.filter((s) => s.done).length;
  const totalSets = sets.length;
  const pairLabel =
    exercise.pairType === "superset"
      ? `Superset ${(exercise.pairId || "").replace("ss-", "").toUpperCase() || "A"}`
      : exercise.pairType === "circuit"
        ? "Circuit"
        : "";

  return `
    <article class="panel fitness-exercise-card ${open ? "is-open" : "is-collapsed"}" data-action="toggle-fitness-exercise" data-exercise="${escapeHtml(exercise.id)}" aria-expanded="${open}">
      <div class="flex items-start gap-3">
        ${renderMuscleThumb(exercise.muscleGroup, "lg")}
        <div class="min-w-0 flex-1">
          ${pairLabel ? `<p class="text-xs font-semibold mb-1" style="color:var(--build)">${escapeHtml(pairLabel)}</p>` : ""}
          <h3 class="task-title !min-h-0">${escapeHtml(exercise.name)}</h3>
          <p class="mt-1 text-xs" style="color:var(--mute)">${escapeHtml(muscleLabel(exercise.muscleGroup))}</p>
          <p class="mt-1 text-xs font-semibold" style="color:var(--text-soft)">${doneSets}/${totalSets} sets</p>
        </div>
        <button type="button" class="icon-btn shrink-0 ${fav ? "is-fav" : ""}" data-action="toggle-favorite-exercise" data-name="${escapeHtml(exercise.name)}" aria-label="${fav ? "Unfavorite" : "Favorite"}" aria-pressed="${fav}">
          ${icon("star", "h-4 w-4")}
        </button>
        <button type="button" class="icon-btn shrink-0" data-action="open-exercise-menu" data-session="${escapeHtml(session.id)}" data-exercise="${escapeHtml(exercise.id)}" data-name="${escapeHtml(exercise.name)}" aria-label="Exercise menu">${icon("more", "h-4 w-4")}</button>
      </div>
      <div class="fitness-exercise-body ${open ? "is-open" : ""}">
        <div class="fitness-exercise-body-inner">
          <div class="mt-3 space-y-2">
            <p class="text-xs" style="color:var(--mute)">${escapeHtml(prevLine)}</p>
            ${overload ? `<p class="text-xs" style="color:var(--build)">${escapeHtml(overload)}</p>` : ""}
            ${sets.map((set) => renderSetRow(set, exercise, session.id, unit)).join("")}
            <button type="button" class="btn mt-1 w-full !min-h-11 !text-xs" data-action="add-fitness-set" data-session="${escapeHtml(session.id)}" data-exercise="${escapeHtml(exercise.id)}">
              ${icon("plus", "h-4 w-4")} Add set
            </button>
          </div>
        </div>
      </div>
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
    const whyLine = trainWhyLine(settings.trainWhy || []);
    return `
      <section class="panel fitness-empty">
        <p class="eyebrow mb-1">Today</p>
        <h2 class="display text-4xl">Ready to train?</h2>
        <p class="mt-2 text-sm" style="color:var(--mute)">Pick muscle groups. We build a session from your available equipment.</p>
        ${whyLine ? `<p class="mt-2 text-xs" style="color:var(--build)">${escapeHtml(whyLine)}</p>` : ""}
        <button type="button" class="btn btn-primary mt-5 w-full gap-2" data-action="open-workout-builder">
          ${icon("plus", "h-4 w-4")} Build workout
        </button>
      </section>
      ${renderEquipmentPanel(settings, ui)}
    `;
  }

  const vol = sessionVolume(session, settings.preferredUnit);
  const exercises = session.exercises || [];
  const gate = canCompleteWorkout(session);
  const firstIncomplete = exercises.find((ex) => {
    const sets = ex.sets || [];
    return !sets.length || sets.some((s) => !s.done);
  });
  const openId =
    ui.fitnessOpenExerciseId == null
      ? firstIncomplete?.id || exercises[0]?.id || null
      : ui.fitnessOpenExerciseId;

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
      <button type="button" class="btn w-full !min-h-10 !text-xs" data-action="rebuild-workout" data-session="${escapeHtml(session.id)}">Rebuild workout</button>
      ${renderRestTimerBar(ui)}
      <div class="flex gap-1">
        <button type="button" class="btn flex-1 !min-h-10 !text-xs" data-action="start-rest-timer" data-seconds="60">Rest 60s</button>
        <button type="button" class="btn flex-1 !min-h-10 !text-xs" data-action="start-rest-timer" data-seconds="90">90s</button>
        <button type="button" class="btn flex-1 !min-h-10 !text-xs" data-action="start-rest-timer" data-seconds="120">120s</button>
      </div>
    </section>

    ${renderEquipmentPanel(settings, ui, { compact: true })}

    ${
      exercises.length
        ? exercises
            .map((ex) => renderExerciseCard(ex, session, settings, log, { open: openId === ex.id }))
            .join("")
        : `<section class="panel-quiet text-center py-6"><p class="text-sm" style="color:var(--mute)">No exercises yet. Add your first move.</p></section>`
    }

    <div class="grid grid-cols-2 gap-2">
      <button type="button" class="btn w-full gap-2 !min-h-11" data-action="open-add-exercise" data-session="${escapeHtml(session.id)}">
        ${icon("plus", "h-4 w-4")} Add exercise
      </button>
      ${
        exercises.length
          ? `<button type="button" class="btn btn-primary w-full !min-h-11" data-action="complete-workout" data-session="${escapeHtml(session.id)}" ${gate.ok ? "" : "disabled"} title="${escapeHtml(gate.reason || "")}">Complete</button>`
          : `<button type="button" class="btn btn-primary w-full !min-h-11" disabled>Complete</button>`
      }
    </div>
    ${exercises.length && !gate.ok ? `<p class="text-xs text-center" style="color:var(--mute)">${escapeHtml(gate.reason || "Fill weight and reps on every set")}</p>` : ""}
  `;
}

function renderHistoryPanel(state, settings, ui) {
  const log = state.fitnessLog || [];
  const all = completedSessions(log);
  const unit = settings.preferredUnit || "lb";
  const { items: sessions, page, totalPages } = paginate(all, ui.fitnessHistoryPage || 0);

  if (!all.length) {
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
          <button type="button" class="plan-row !min-h-[5rem] w-full text-left" data-action="open-workout-detail" data-session="${escapeHtml(session.id)}">
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="task-title !min-h-0">${formatDisplayDate(session.date)}</p>
                <p class="task-meta">${count} exercise${count === 1 ? "" : "s"} · ${formatVolume(vol)} ${unit} volume</p>
              </div>
              ${icon("right", "h-4 w-4 shrink-0")}
            </div>
          </button>`;
        })
        .join("")}
      ${renderPager(page, totalPages, "fitness")}
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

  const panel = tab === "history" ? renderHistoryPanel(state, settings, ui) : renderTodayPanel(state, ui);
  const menu = renderExerciseMenu(ui.openExerciseMenu);

  return `
    <section class="fitness-screen space-y-3">
      ${tabBar}
      ${panel}
      ${menu}
    </section>
  `;
}

export function renderAddExerciseModal(ui, settings) {
  const sessionId = ui.fitnessAddSession || "";
  const query = ui.fitnessSearch || "";
  const muscle = ui.fitnessMuscle || "all";
  const listFilter = ui.fitnessListFilter || "all";
  const replacing = ui.replaceExercise;
  const available = settings?.equipmentAvailable || EQUIPMENT_OPTIONS.map((e) => e.id);
  const results = filterExercises(query, muscle, {
    equipment: available,
    blocked: settings?.blockedExercises || [],
    favorites: settings?.favoriteExercises || [],
    recent: settings?.recentExercises || [],
    listFilter,
  }).slice(0, 40);
  const title = replacing ? "Replace exercise" : "Add exercise";
  const pickAction = replacing ? "replace-pick-exercise" : "pick-exercise";

  return `
    <div class="modal-backdrop" data-action="close-modal">
      <div class="modal-sheet modal-scroll-body fitness-modal add-exercise-modal" role="dialog" aria-modal="true" aria-label="${title}" data-stop>
        <div class="flex items-center justify-between gap-3 shrink-0">
          <h2 class="display text-3xl">${title}</h2>
          <button type="button" class="btn !min-h-11 !px-3" data-action="close-modal">Cancel</button>
        </div>
        <form class="mt-4 shrink-0" data-action="search-exercise">
          <input type="hidden" name="sessionId" value="${escapeHtml(sessionId)}" />
          <input class="input !text-base" name="query" placeholder="Search exercises..." value="${escapeHtml(query)}" autocomplete="off" />
        </form>
        <div class="segment mt-4 shrink-0" role="group" aria-label="List filter">
          ${["all", "favorites", "recent"]
            .map(
              (id) =>
                `<button type="button" class="segment-btn ${listFilter === id ? "is-active accent" : ""}" data-action="fitness-list-filter" data-filter="${id}">${id === "all" ? "All" : id === "favorites" ? "Favorites" : "Recent"}</button>`
            )
            .join("")}
        </div>
        <div class="equipment-rail scroll-touch mt-4 shrink-0" role="group" aria-label="Equipment">
          ${EQUIPMENT_OPTIONS.map((opt) => {
            const on = available.includes(opt.id);
            return `<button type="button" class="chip shrink-0 ${on ? "chip-build" : ""}" data-action="toggle-equipment" data-id="${opt.id}" aria-pressed="${on}">${escapeHtml(opt.label)}</button>`;
          }).join("")}
        </div>
        <div class="muscle-rail scroll-touch mt-4 shrink-0" role="group" aria-label="Muscle">
          ${FILTER_GROUPS.map(
            (g) => `
            <button type="button" class="muscle-rail-cell ${muscle === g.id ? "is-selected" : ""}" data-action="fitness-muscle" data-muscle="${g.id}">
              ${g.id === "all" ? `<span class="text-sm font-semibold">All</span>` : renderMuscleThumb(g.id)}
              <span class="muscle-filter-label">${escapeHtml(g.label)}</span>
            </button>`
          ).join("")}
        </div>
        <div class="modal-scroll-inner scroll-touch mt-5 space-y-3">
          ${
            results
              .map((ex) => {
                const fav = isFavorite(settings, ex.name);
                const eq = (ex.equipment || []).join(" · ");
                return `
                <div class="exercise-pick-row flex items-center gap-3">
                  <button type="button" class="min-w-0 flex-1 text-left flex items-center gap-4" data-action="${pickAction}" data-session="${escapeHtml(sessionId)}" data-name="${escapeHtml(ex.name)}" data-muscle="${escapeHtml(ex.muscleGroup)}">
                    ${renderMuscleThumb(ex.muscleGroup, "lg")}
                    <span class="min-w-0">
                      <p class="task-title !min-h-0">${escapeHtml(ex.name)}</p>
                      <p class="task-meta">${escapeHtml(muscleLabel(ex.muscleGroup))}${eq ? ` · ${escapeHtml(eq)}` : ""}</p>
                    </span>
                  </button>
                  <button type="button" class="icon-btn shrink-0 ${fav ? "is-fav" : ""}" data-action="toggle-favorite-exercise" data-name="${escapeHtml(ex.name)}" aria-label="${fav ? "Unfavorite" : "Favorite"}" aria-pressed="${fav}">
                    ${icon("star", "h-4 w-4")}
                  </button>
                </div>`;
              })
              .join("") || `<p class="text-sm py-4 text-center" style="color:var(--mute)">No matches.</p>`
          }
        </div>
        <form class="mt-4 space-y-3 border-t pt-4 shrink-0" style="border-color:var(--rail)" data-action="custom-exercise">
          <input type="hidden" name="sessionId" value="${escapeHtml(sessionId)}" />
          <p class="text-xs font-semibold uppercase tracking-wide" style="color:var(--mute)">Custom</p>
          <div class="flex gap-2">
            <input class="input flex-1" name="name" placeholder="Custom name" required />
            <button type="submit" class="btn btn-primary !px-4">Add</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

export function renderWorkoutDetailModal(state, ui) {
  const id = ui.viewingWorkoutId;
  const session = (state.fitnessLog || []).find((w) => w.id === id);
  const unit = state.fitnessSettings?.preferredUnit || "lb";
  if (!session) {
    return `
      <div class="modal-backdrop" data-action="close-modal">
        <div class="modal-sheet" role="dialog" aria-modal="true" data-stop>
          <p class="text-sm" style="color:var(--mute)">Session not found.</p>
          <button type="button" class="btn mt-4 w-full" data-action="close-modal">Close</button>
        </div>
      </div>`;
  }

  const vol = sessionVolume(session, unit);
  const exercises = session.exercises || [];

  return `
    <div class="modal-backdrop" data-action="close-modal">
      <div class="modal-sheet modal-scroll-body" role="dialog" aria-modal="true" aria-label="Workout detail" data-stop>
        <div class="flex items-center justify-between gap-3 shrink-0">
          <h2 class="display text-3xl">${formatDisplayDate(session.date)}</h2>
          <button type="button" class="btn !min-h-11 !px-3" data-action="close-modal">Close</button>
        </div>
        <p class="mt-2 text-sm shrink-0" style="color:var(--mute)">${exercises.length} exercise${exercises.length === 1 ? "" : "s"} · ${formatVolume(vol)} ${escapeHtml(unit)} volume</p>
        <div class="modal-scroll-inner scroll-touch mt-5 space-y-4">
          ${exercises
            .map((ex) => {
              const hist = exerciseVolumeHistory(state.fitnessLog || [], ex.name, 5);
              const path = sparklinePath(hist.map((h) => h.volume));
              return `
            <article class="panel !py-3">
              <p class="task-title !min-h-0">${escapeHtml(ex.name)}</p>
              <p class="task-meta">${escapeHtml(muscleLabel(ex.muscleGroup))}</p>
              ${
                path
                  ? `<svg class="sparkline mt-2" viewBox="0 0 120 36" aria-label="Volume trend">
                      <path d="${path}" fill="none" stroke="var(--build)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <p class="text-[10px] mt-1" style="color:var(--mute)">Last ${hist.length} sessions</p>`
                  : ""
              }
              <ul class="mt-2 space-y-1 text-sm" style="color:var(--mute)">
                ${(ex.sets || [])
                  .map(
                    (set) =>
                      `<li>${set.done ? "✓ " : ""}${Number(set.weight) || 0} ${escapeHtml(set.unit || unit)} × ${Number(set.reps) || 0}</li>`
                  )
                  .join("")}
              </ul>
            </article>`;
            })
            .join("")}
        </div>
        <div class="shrink-0 pt-4 space-y-2 border-t mt-4" style="border-color:var(--rail)">
          <button type="button" class="btn btn-primary w-full gap-2" data-action="share-progress" data-scope="day">${icon("proof", "h-5 w-5")} Share this session</button>
          <button type="button" class="btn btn-danger w-full" data-action="delete-workout" data-session="${escapeHtml(session.id)}">Delete session</button>
        </div>
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
        <div class="sealed-stamp mx-auto mb-3">LIFT</div>
        <p class="eyebrow" style="color:var(--build)">Workout sealed</p>
        <h2 class="display text-5xl mt-2">Progress logged.</h2>
        <p class="mt-3 text-sm" style="color:var(--mute)">
          ${count} exercise${count === 1 ? "" : "s"} · ${formatVolume(vol)} ${escapeHtml(unit)} volume
        </p>
        <div class="sealed-actions">
          <button type="button" class="btn btn-primary w-full gap-2" data-action="share-progress" data-scope="day">${icon("proof", "h-5 w-5")} Share workout</button>
          <button type="button" class="btn w-full" data-action="dismiss-fitness-celebrate">Keep moving</button>
        </div>
      </div>
    </div>
  `;
}
