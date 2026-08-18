import {
  activeSessionForDate,
  canCompleteWorkout,
  completedSessions,
  EQUIPMENT_OPTIONS,
  MAIN_MUSCLE_GROUPS,
  ACCESSORY_MUSCLE_GROUPS,
  trainWhyLine,
  filterExercises,
  findExerciseCatalog,
  isEachSideExercise,
  warmupMovesForSession,
  formatVolume,
  muscleLabel,
  previousPerformance,
  progressiveOverloadHint,
  restPresetsForGoal,
  sessionVolume,
  sessionsThisWeek,
  workoutStreak,
  exerciseVolumeHistory,
  sessionVolumeHistory,
  muscleBalanceCounts,
  sparklinePath,
  liveSessionElapsedMs,
  formatSessionClock,
  formatDurationSeconds,
  isTimedExercise,
  normalizeFocusExercise,
} from "../fitness.js";
import { isBodyweightExercise } from "../fitness-plan.js";
import { formatDisplayDate, todayKey } from "../dates.js";
import { escapeHtml, icon } from "./dom.js";
import { renderMuscleThumb, renderHighlightBodyMap } from "./MuscleMap.js";
import { paginate, renderPager } from "./Pagination.js";
import { renderExerciseMenu } from "./fitness/ExerciseMenu.js";
import { renderWorkoutCompletion } from "./fitness/WorkoutCompletion.js";
import { copy } from "../copy/voice.js";

export { renderWorkoutCompletion as renderFitnessCelebrate };

const FITNESS_TABS = [
  { id: "today", label: "Today" },
  { id: "history", label: "History" },
];

const FILTER_GROUPS = [{ id: "all", label: "All" }, ...MAIN_MUSCLE_GROUPS, ...ACCESSORY_MUSCLE_GROUPS];

function isFavorite(settings, name) {
  const key = String(name || "").toLowerCase();
  return (settings?.favoriteExercises || []).some((n) => n.toLowerCase() === key);
}

function restPresetLabel(sec) {
  if (sec < 60) return `${sec}s`;
  const mins = sec / 60;
  return Number.isInteger(mins) ? `${mins}m` : `${mins.toFixed(1).replace(/\.0$/, "")}m`;
}

function sortFitnessSessions(sessions, sort = "recent") {
  return [...sessions].sort((a, b) => {
    const ta = new Date(a.completedAt || a.date).getTime();
    const tb = new Date(b.completedAt || b.date).getTime();
    return sort === "oldest" ? ta - tb : tb - ta;
  });
}

function setFieldValue(set, field) {
  const n = set?.[field];
  if (n == null || n === "") return "";
  return String(n);
}

function renderSetRow(set, exercise, sessionId, unit, { bodyweight = false } = {}) {
  const restSec = Number(exercise?.restSeconds) || Number(set?.restSeconds) || 90;
  const timed = set?.duration != null || isTimedExercise(exercise);
  const loadFields = timed
    ? `${bodyweight ? `<span class="text-xs shrink-0 font-semibold" style="color:var(--mute)">BW</span>` : `<input class="input !min-h-11 !w-16 shrink-0 text-center" type="text" inputmode="decimal" pattern="[0-9]*" value="${escapeHtml(setFieldValue(set, "weight"))}" placeholder="0" data-action="fitness-set-field" data-field="weight" data-session="${escapeHtml(sessionId)}" data-exercise="${escapeHtml(exercise.id)}" data-set="${escapeHtml(set.id)}" aria-label="Weight" />
      <span class="text-xs shrink-0" style="color:var(--mute)">${escapeHtml(set.unit || unit)}</span>`}
      <input class="input !min-h-11 !w-16 shrink-0 text-center" type="text" inputmode="numeric" pattern="[0-9]*" value="${escapeHtml(setFieldValue(set, "duration"))}" placeholder="30" data-action="fitness-set-field" data-field="duration" data-session="${escapeHtml(sessionId)}" data-exercise="${escapeHtml(exercise.id)}" data-set="${escapeHtml(set.id)}" aria-label="Interval seconds" />
      <span class="text-xs shrink-0" style="color:var(--mute)">sec</span>`
    : bodyweight
      ? `<span class="text-xs shrink-0 font-semibold" style="color:var(--mute)">BW</span>
      <span class="text-xs shrink-0" style="color:var(--mute)">×</span>`
      : `<input class="input !min-h-11 !w-16 shrink-0 text-center" type="text" inputmode="decimal" pattern="[0-9]*" value="${escapeHtml(setFieldValue(set, "weight"))}" placeholder="0" data-action="fitness-set-field" data-field="weight" data-session="${escapeHtml(sessionId)}" data-exercise="${escapeHtml(exercise.id)}" data-set="${escapeHtml(set.id)}" aria-label="Weight" />
      <span class="text-xs shrink-0" style="color:var(--mute)">${escapeHtml(set.unit || unit)}</span>
      <span class="text-xs shrink-0" style="color:var(--mute)">×</span>`;
  return `
    <div class="fitness-set-row flex items-center gap-2 ${set.done ? "is-done" : ""} ${timed ? "is-timed" : ""}">
      <button type="button" class="check shrink-0 ${set.done ? "is-done" : ""}" data-action="toggle-fitness-set" data-session="${escapeHtml(sessionId)}" data-exercise="${escapeHtml(exercise.id)}" data-set="${escapeHtml(set.id)}" aria-label="Mark set done">
        ${set.done ? icon("check", "h-4 w-4") : ""}
      </button>
      ${loadFields}
      ${timed ? "" : `<input class="input !min-h-11 !w-14 shrink-0 text-center" type="text" inputmode="numeric" pattern="[0-9]*" value="${escapeHtml(setFieldValue(set, "reps"))}" placeholder="0" data-action="fitness-set-field" data-field="reps" data-session="${escapeHtml(sessionId)}" data-exercise="${escapeHtml(exercise.id)}" data-set="${escapeHtml(set.id)}" aria-label="Reps" />`}
      <span class="fitness-set-row-actions ml-auto flex items-center gap-1 shrink-0">
        <button type="button" class="icon-btn shrink-0" data-action="start-rest-timer" data-seconds="${timed ? Number(set.duration) || 30 : restSec}" aria-label="${timed ? `Start ${Number(set.duration) || 30}s interval` : `Start ${restSec}s rest`}">${icon("refresh", "h-4 w-4")}</button>
        <button type="button" class="icon-btn shrink-0" data-action="delete-fitness-set" data-session="${escapeHtml(sessionId)}" data-exercise="${escapeHtml(exercise.id)}" data-set="${escapeHtml(set.id)}" aria-label="Delete set">${icon("trash", "h-4 w-4")}</button>
      </span>
    </div>
  `;
}

function renderRestTimerBar(ui) {
  const timer = ui.restTimer;
  if (!timer) return "";
  if (timer.phase === "done") {
    return `
    <div class="rest-timer-bar is-done" role="status" aria-live="assertive">
      <div>
        <p class="rest-timer-done-title">Rest done. Next set.</p>
        <p class="text-xs" style="color:var(--text-soft)">Clock's back. Hit the next round.</p>
      </div>
      <button type="button" class="btn !min-h-10 !px-3 !text-xs" data-action="clear-rest-timer">Got it</button>
    </div>`;
  }
  if (!timer.endsAt) return "";
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

function pairGroupLabel(pairType, pairId) {
  if (pairType === "circuit") return "Circuit";
  const raw = String(pairId || "").replace(/^ss-/i, "");
  const n = Number(raw);
  if (Number.isFinite(n) && n >= 1) return `Superset ${String.fromCharCode(64 + n)}`;
  if (/^[A-Za-z]$/.test(raw)) return `Superset ${raw.toUpperCase()}`;
  return "Superset";
}

function isExerciseOpen(ui, exerciseId, fallbackId = null) {
  const mode = ui.fitnessOpenMode || "multi";
  if (mode === "all") return true;
  if (mode === "none") return false;
  if (Array.isArray(ui.fitnessOpenIds)) return ui.fitnessOpenIds.includes(exerciseId);
  if (ui.fitnessOpenIds == null && fallbackId) return exerciseId === fallbackId;
  return false;
}

function isPairCollapsed(ui, pairId) {
  return (ui.fitnessCollapsedPairIds || []).includes(pairId);
}

function renderSessionTimerBar(session) {
  const running = Boolean(session?.timerStartedAt);
  const ms = liveSessionElapsedMs(session, Date.now());
  const label = formatSessionClock(ms);
  return `
    <div class="session-timer-bar" data-session-timer data-session="${escapeHtml(session.id)}" data-running="${running ? "1" : "0"}">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide" style="color:var(--mute)">Session</p>
        <p class="session-timer-count" data-session-clock>${escapeHtml(label)}</p>
      </div>
      <button type="button" class="btn ${running ? "" : "btn-primary"} !min-h-11 !px-4 !text-xs" data-action="toggle-session-timer" data-session="${escapeHtml(session.id)}">
        ${running ? "Pause" : "Start"}
      </button>
    </div>`;
}

function groupSessionExercises(exercises = []) {
  const groups = [];
  const consumed = new Set();
  for (const ex of exercises) {
    if (consumed.has(ex.id)) continue;
    if (ex.pairId) {
      const members = exercises.filter((e) => e.pairId === ex.pairId);
      members.forEach((m) => consumed.add(m.id));
      groups.push({
        kind: ex.pairType === "circuit" ? "circuit" : "superset",
        pairId: ex.pairId,
        pairType: ex.pairType || "superset",
        exercises: members,
      });
    } else {
      consumed.add(ex.id);
      groups.push({ kind: "solo", pairId: null, pairType: null, exercises: [ex] });
    }
  }
  return groups;
}

function groupIsComplete(group) {
  return (group.exercises || []).every((ex) => {
    const sets = ex.sets || [];
    return sets.length > 0 && sets.every((set) => set.done);
  });
}

function orderSessionGroups(exercises = []) {
  return groupSessionExercises(exercises)
    .map((group, index) => ({ group, index, done: groupIsComplete(group) }))
    .sort((a, b) => Number(a.done) - Number(b.done) || a.index - b.index)
    .map((item) => item.group);
}

function renderExerciseCard(exercise, session, settings, log, { open = false, hidePairBadge = false, showGrip = false } = {}) {
  const unit = settings.preferredUnit || "lb";
  const catalog = findExerciseCatalog(exercise.name) || {};
  const bodyweight = isBodyweightExercise({
    name: exercise.name,
    equipment: catalog.equipment || exercise.equipment || [],
  });
  const timed = exercise.measurement === "time" || isTimedExercise(exercise);
  const prev = previousPerformance(log, exercise.name);
  const prevLine = prev
    ? timed
      ? `Last: ${formatDurationSeconds(prev.duration || 0)}`
      : bodyweight
        ? `Last: ${prev.reps} reps`
        : `Last: ${prev.weight} ${prev.unit} × ${prev.reps}`
    : timed
      ? "Interval work. Set the baseline."
      : "No history yet. Set the baseline.";
  const goal = settings.goal || "build_muscle";
  const focus = normalizeFocusExercise(settings.focusExercise);
  const isFocus =
    focus &&
    String(exercise.name || "").trim().toLowerCase() === String(focus.name).trim().toLowerCase();
  const overload = progressiveOverloadHint(log, exercise.name, unit, goal, focus);
  const eachSide = isEachSideExercise(exercise.name, catalog);
  const sets = exercise.sets || [];
  const doneSets = sets.filter((s) => s.done).length;
  const totalSets = sets.length;
  const pairLabel =
    !hidePairBadge && exercise.pairId
      ? pairGroupLabel(exercise.pairType, exercise.pairId)
      : "";
  const setLine = timed
    ? `${doneSets}/${totalSets} intervals · ${formatDurationSeconds(sets[0]?.duration || catalog.defaultDuration || 30)}`
    : eachSide
      ? `Each side · ${totalSets} sets`
      : `${doneSets}/${totalSets} sets`;

  return `
    <article class="panel fitness-exercise-card ${open ? "is-open" : "is-collapsed"}" data-exercise-card data-exercise-id="${escapeHtml(exercise.id)}" data-session-id="${escapeHtml(session.id)}" data-exercise-name="${escapeHtml(exercise.name)}" data-pair-id="${escapeHtml(exercise.pairId || "")}" data-pair-type="${escapeHtml(exercise.pairType || "")}">
      <div class="flex items-start gap-2">
        ${showGrip ? `<button type="button" class="fitness-drag-handle fitness-pair-drag icon-btn shrink-0" data-long-press-drag-handle aria-label="Drag to reorder ${escapeHtml(exercise.name)}">${icon("grip", "h-4 w-4")}</button>` : ""}
        <button type="button" class="flex min-w-0 flex-1 items-start gap-3 text-left" data-action="toggle-fitness-exercise" data-exercise="${escapeHtml(exercise.id)}" aria-expanded="${open}">
          ${renderMuscleThumb(exercise.muscleGroup, "lg")}
          <span class="min-w-0 flex-1">
            ${pairLabel ? `<p class="text-xs font-semibold mb-1" style="color:var(--build)">${escapeHtml(pairLabel)}</p>` : ""}
            ${isFocus ? `<p class="text-xs font-semibold mb-1" style="color:var(--build)">Focus · Week ${focus.weekIndex}</p>` : ""}
            <h3 class="task-title !min-h-0">${escapeHtml(exercise.name)}</h3>
            <p class="mt-1 help-text">${escapeHtml(muscleLabel(exercise.muscleGroup))}${timed ? " · Timed" : ""}${bodyweight ? " · Bodyweight" : ""}${eachSide ? " · Each side" : ""}</p>
            <p class="mt-1 text-xs font-semibold" style="color:var(--text-soft)">${escapeHtml(setLine)}</p>
          </span>
        </button>
        <button type="button" class="icon-btn shrink-0" data-action="open-exercise-menu" data-session="${escapeHtml(session.id)}" data-exercise="${escapeHtml(exercise.id)}" data-name="${escapeHtml(exercise.name)}" data-pair-id="${escapeHtml(exercise.pairId || "")}" data-pair-type="${escapeHtml(exercise.pairType || "")}" aria-label="Exercise menu">${icon("more", "h-4 w-4")}</button>
      </div>
      <div class="fitness-exercise-body ${open ? "is-open" : ""}">
        <div class="fitness-exercise-body-inner">
          <div class="mt-3 space-y-2">
            <p class="help-text">${escapeHtml(prevLine)}</p>
            ${overload ? `<p class="text-xs" style="color:var(--build)">${escapeHtml(overload)}</p>` : ""}
            ${sets.map((set) => renderSetRow(set, exercise, session.id, unit, { bodyweight })).join("")}
            <button type="button" class="btn mt-1 w-full !min-h-11 !text-xs" data-action="add-fitness-set" data-session="${escapeHtml(session.id)}" data-exercise="${escapeHtml(exercise.id)}">
              ${icon("plus", "h-4 w-4")} Add set
            </button>
          </div>
        </div>
      </div>
    </article>
  `;
}

function renderPairGroup(group, session, settings, log, ui, fallbackId) {
  const label = pairGroupLabel(group.pairType, group.pairId);
  const kindClass = group.kind === "circuit" ? "is-circuit" : "is-superset";
  const collapsed = isPairCollapsed(ui, group.pairId);
  return `
    <section class="fitness-pair-group ${kindClass} ${collapsed ? "is-collapsed" : ""}" data-pair-group data-pair-id="${escapeHtml(group.pairId)}" data-pair-type="${escapeHtml(group.pairType)}" data-session="${escapeHtml(session.id)}">
      <div class="fitness-pair-head">
        <button type="button" class="fitness-pair-drag icon-btn shrink-0" data-long-press-drag-pair aria-label="Drag to reorder ${escapeHtml(label)}">${icon("grip", "h-4 w-4")}</button>
        <button type="button" class="min-w-0 flex-1 text-left" data-action="toggle-fitness-pair" data-pair-id="${escapeHtml(group.pairId)}" aria-expanded="${!collapsed}">
          <p class="fitness-pair-label">${escapeHtml(label)}</p>
        </button>
        <div class="flex items-center gap-1 shrink-0">
          <button type="button" class="icon-btn" data-action="toggle-fitness-pair" data-pair-id="${escapeHtml(group.pairId)}" aria-label="${collapsed ? "Expand" : "Collapse"} ${escapeHtml(label)}">${icon(collapsed ? "down" : "up", "h-4 w-4")}</button>
          <button type="button" class="btn !min-h-9 !px-3 !text-xs" data-action="open-add-exercise" data-session="${escapeHtml(session.id)}" data-pair-id="${escapeHtml(group.pairId)}" data-pair-type="${escapeHtml(group.pairType)}">${icon("plus", "h-3.5 w-3.5")} Add</button>
          <button type="button" class="btn !min-h-9 !px-3 !text-xs" data-action="dissolve-fitness-pair" data-session="${escapeHtml(session.id)}" data-pair-id="${escapeHtml(group.pairId)}">Ungroup</button>
        </div>
      </div>
      ${
        collapsed
          ? ""
          : `<div class="fitness-pair-members">
        ${group.exercises
          .map((ex) =>
            renderExerciseCard(ex, session, settings, log, {
              open: isExerciseOpen(ui, ex.id, fallbackId),
              hidePairBadge: true,
            })
          )
          .join("")}
      </div>`
      }
    </section>
  `;
}

function renderWarmupStrip(session, ui) {
  const moves = warmupMovesForSession(session);
  const checked = new Set(ui.fitnessWarmupChecked || []);
  const doneCount = moves.filter((m) => checked.has(m.id)).length;
  const collapsed = Boolean(ui.fitnessWarmupCollapsed);
  return `
    <section class="stretch-strip ${collapsed ? "is-collapsed" : ""}" aria-label="Warm-up">
      <div class="flex items-start justify-between gap-2">
        <button type="button" class="min-w-0 flex-1 text-left" data-action="toggle-warmup-collapse" aria-expanded="${!collapsed}">
          <p class="text-xs font-semibold uppercase tracking-wide" style="color:var(--mute)">Warm-up</p>
          <p class="help-text mt-0.5">${
            collapsed
              ? `${doneCount}/${moves.length} checked · tap to expand`
              : "5 to 8 minutes. Dynamic. Does not block Start."
          }</p>
        </button>
        <button type="button" class="icon-btn shrink-0" data-action="toggle-warmup-collapse" aria-expanded="${!collapsed}" aria-label="${collapsed ? "Expand warm-up" : "Collapse warm-up"}">${icon(collapsed ? "down" : "up", "h-4 w-4")}</button>
      </div>
      <div class="fitness-exercise-body ${collapsed ? "" : "is-open"}">
        <div class="fitness-exercise-body-inner">
          <ul class="stretch-list mt-2">
            ${moves
              .map(
                (m) => `
              <li>
                <button type="button" class="stretch-check ${checked.has(m.id) ? "is-done" : ""}" data-action="toggle-warmup-move" data-id="${escapeHtml(m.id)}">
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
        </div>
      </div>
    </section>
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
        <p class="mt-2 text-sm" style="color:var(--mute)">Build a session from your level, gear, and goals.</p>
        ${whyLine ? `<p class="mt-2 text-xs" style="color:var(--build)">${escapeHtml(whyLine)}</p>` : ""}
        ${renderWarmupStrip(null, ui)}
        <button type="button" class="btn btn-primary mt-5 w-full" data-action="open-workout-builder">
          Build workout
        </button>
      </section>
    `;
  }

  const vol = sessionVolume(session, settings.preferredUnit);
  const exercises = session.exercises || [];
  const gate = canCompleteWorkout(session);
  const firstIncomplete = exercises.find((ex) => {
    const sets = ex.sets || [];
    return !sets.length || sets.some((s) => !s.done);
  });
  const fallbackId = firstIncomplete?.id || exercises[0]?.id || null;
  const focusGroups = [...new Set(exercises.map((ex) => muscleLabel(ex.muscleGroup)).filter(Boolean))].slice(0, 3);
  const focusText = focusGroups.length ? focusGroups.join("/") : "Custom";
  const sessionMenuOpen = ui.fitnessSessionMenuOpen;
  const focusLift = normalizeFocusExercise(settings.focusExercise);

  return `
    <div class="fitness-today-stack">
    <div class="sr-only" id="fitness-dnd-live" role="status" aria-live="polite"></div>
    <section class="panel space-y-2">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <p class="text-xs" style="color:var(--mute)">${formatDisplayDate(date)} · ${exercises.length} exercise${exercises.length === 1 ? "" : "s"} · ${escapeHtml(focusText)} focus</p>
          <p class="mt-1 text-xs" style="color:var(--text-soft)">Week ${weekCount} · Streak ${streak} · Vol ${formatVolume(vol)}</p>
        </div>
        <div class="relative shrink-0">
          <button type="button" class="icon-btn" data-action="toggle-fitness-session-menu" aria-expanded="${Boolean(sessionMenuOpen)}" aria-label="Session options">${icon("more", "h-4 w-4")}</button>
          ${
            sessionMenuOpen
              ? `<div class="fitness-session-menu" role="menu">
            <button type="button" role="menuitem" data-action="rebuild-workout" data-session="${escapeHtml(session.id)}">Rebuild workout</button>
            <button type="button" role="menuitem" data-action="open-fitness-prefs">Adjust gear</button>
            <button type="button" role="menuitem" data-action="open-rest-presets">Rest timer</button>
          </div>`
              : ""
          }
        </div>
      </div>
      ${renderWarmupStrip(session, ui)}
      ${renderSessionTimerBar(session)}
      ${renderRestTimerBar(ui)}
      ${
        focusLift
          ? `<p class="text-[11px] font-semibold" style="color:var(--build)">Focus · Week ${focusLift.weekIndex} · ${escapeHtml(focusLift.name)}</p>`
          : ""
      }
      <p class="text-[11px]" style="color:var(--mute)">Start the clock when you begin. Log every set. Rest between moves. Complete when done.</p>
      ${
        ui.fitnessRestPresetsOpen
          ? `<div class="flex gap-1">
        ${restPresetsForGoal(settings.goal || "build_muscle")
          .map(
            (sec) =>
              `<button type="button" class="btn flex-1 !min-h-10 !text-xs" data-action="start-rest-timer" data-seconds="${sec}">Rest ${restPresetLabel(sec)}</button>`
          )
          .join("")}
      </div>`
          : ""
      }
      ${
        exercises.length
          ? `<div class="flex justify-end gap-3">
        <button type="button" class="session-text-link" data-action="fitness-expand-all">Expand all</button>
        <button type="button" class="session-text-link" data-action="fitness-collapse-all">Collapse all</button>
      </div>`
          : ""
      }
    </section>

    <div class="fitness-exercise-list" data-fitness-list data-session="${escapeHtml(session.id)}">
    ${
      exercises.length
        ? orderSessionGroups(exercises)
            .map((group) =>
              group.kind === "solo"
                ? renderExerciseCard(group.exercises[0], session, settings, log, {
                    open: isExerciseOpen(ui, group.exercises[0].id, fallbackId),
                    showGrip: true,
                  })
                : renderPairGroup(group, session, settings, log, ui, fallbackId)
            )
            .join("")
        : `<section class="panel-quiet text-center py-6"><p class="text-sm" style="color:var(--mute)">No exercises yet. Add your first move.</p></section>`
    }
    </div>

    <div class="fitness-session-actions">
      <button type="button" class="btn w-full gap-2 !min-h-11" data-action="open-add-exercise" data-session="${escapeHtml(session.id)}">
        ${icon("plus", "h-4 w-4")} Add exercise
      </button>
      ${
        exercises.length
          ? `<button type="button" class="btn btn-primary w-full !min-h-12 !text-sm font-semibold" data-action="complete-workout" data-complete-gate data-session="${escapeHtml(session.id)}" ${gate.ok ? "" : "disabled"} title="${escapeHtml(gate.reason || "")}">Complete</button>`
          : `<button type="button" class="btn btn-primary w-full !min-h-11" disabled>Complete</button>`
      }
    </div>
    ${
      exercises.length
        ? `<button type="button" class="session-text-link session-end-link" data-action="end-workout-session" data-session="${escapeHtml(session.id)}">End session</button>`
        : ""
    }
    ${exercises.length && !gate.ok ? `<p class="help-text text-center" data-complete-help>${escapeHtml(gate.reason || "Fill weight and reps on every set")}</p>` : ""}
    </div>
  `;
}

function renderHistoryPanel(state, settings, ui) {
  const log = state.fitnessLog || [];
  const all = completedSessions(log);
  const sort = ui.fitnessHistorySort === "oldest" ? "oldest" : "recent";
  const sorted = sortFitnessSessions(all, sort);
  const unit = settings.preferredUnit || "lb";
  const focus = ui.fitnessHistoryFocus || null;
  const weekCount = sessionsThisWeek(log).length;
  const volPoints = sessionVolumeHistory(log, 8, unit);
  const volValues = volPoints.map((p) => p.volume);
  const spark = sparklinePath(volValues, 160, 40);
  const balance = muscleBalanceCounts(log, 24);
  const topMuscles = Object.entries(balance)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const mapSide = ui.muscleMapSide === "back" ? "back" : "front";
  const muscleFilter = ui.fitnessHistoryMuscle || null;
  const muscleFiltered = muscleFilter
    ? sorted.filter((s) =>
        (s.exercises || []).some((ex) => String(ex.muscleGroup || "").toLowerCase() === String(muscleFilter).toLowerCase())
      )
    : sorted;
  const { items: sessions, page, totalPages } = paginate(muscleFiltered, ui.fitnessHistoryPage || 0);

  if (!all.length) {
    return `
      <section class="panel text-center py-8">
        <p class="text-sm" style="color:var(--mute)">No completed workouts yet. Finish today's session to build history.</p>
      </section>
    `;
  }

  const highlighted =
    focus === "volume"
      ? "Volume trend selected. Recent sessions ranked by load."
      : focus === "sessions"
        ? "Sessions / week selected. This week's completed work."
        : focus === "balance"
          ? "Muscle balance selected. Where you've been training."
          : "";

  const listSource =
    focus === "sessions"
      ? sortFitnessSessions(all.filter((s) => sessionsThisWeek(log).some((w) => w.id === s.id)), sort)
      : sessions;

  return `
    <div class="proof-bento mb-3" aria-label="Fitness history analytics">
      <button type="button" class="proof-tile proof-tile-span-2 text-left cursor-pointer ${focus === "volume" ? "is-focus" : ""}" data-action="fitness-history-focus" data-focus="volume" aria-pressed="${focus === "volume"}">
        <p class="proof-tile-label">${copy.fitness.historyVolume}</p>
        <svg class="mt-3 w-full" viewBox="0 0 160 40" aria-hidden="true">
          <path d="${escapeHtml(spark)}" fill="none" stroke="var(--build)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <p class="mt-2 text-xs" style="color:var(--mute)">${volPoints.length} sessions · tap to focus</p>
      </button>
      <button type="button" class="proof-tile proof-tile-span-2 text-left cursor-pointer ${focus === "sessions" ? "is-focus" : ""}" data-action="fitness-history-focus" data-focus="sessions" aria-pressed="${focus === "sessions"}">
        <p class="proof-tile-label">${copy.fitness.historySessions}</p>
        <p class="proof-tile-value" style="color:var(--build)">${weekCount}</p>
        <p class="mt-2 text-xs" style="color:var(--mute)">this calendar week</p>
      </button>
      <section class="proof-tile proof-tile-span-4 ${focus === "balance" ? "is-focus" : ""}" aria-label="${copy.fitness.historyBalance}">
        <div class="proof-balance-grid">
          <div class="min-w-0">
            <button type="button" class="w-full text-left cursor-pointer" data-action="fitness-history-focus" data-focus="balance" aria-pressed="${focus === "balance"}">
              <p class="proof-tile-label">${copy.fitness.historyBalance}</p>
            </button>
            <div class="mt-3 flex flex-wrap gap-1.5">
              ${
                topMuscles.length
                  ? topMuscles
                      .map(
                        ([id, n]) =>
                          `<button type="button" class="chip chip-data ${muscleFilter === id ? "is-active" : ""}" data-action="fitness-history-muscle" data-muscle="${escapeHtml(id)}" aria-pressed="${muscleFilter === id}">${escapeHtml(muscleLabel(id))} · ${n}</button>`
                      )
                      .join("")
                  : `<span class="text-xs" style="color:var(--mute)">Log more sessions to map balance.</span>`
              }
            </div>
            <div class="segment mt-3" role="group" aria-label="Balance body view">
              <button type="button" class="segment-btn ${mapSide === "front" ? "is-active accent" : ""}" data-action="muscle-map-side" data-side="front">Front</button>
              <button type="button" class="segment-btn ${mapSide === "back" ? "is-active accent" : ""}" data-action="muscle-map-side" data-side="back">Back</button>
            </div>
          </div>
          <div class="proof-balance-map">${renderHighlightBodyMap(Object.keys(balance), mapSide, "w-full h-auto", balance)}</div>
        </div>
      </section>
    </div>

    ${highlighted ? `<p class="mb-2 text-xs" style="color:var(--build)">${escapeHtml(highlighted)}</p>` : ""}
    ${muscleFilter ? `<p class="mb-2 text-xs" style="color:var(--data)">Filtered to ${escapeHtml(muscleLabel(muscleFilter))} · <button type="button" class="coach-strip-link !text-xs" data-action="fitness-history-muscle" data-muscle="${escapeHtml(muscleFilter)}">Clear</button></p>` : ""}

    <section class="panel">
      <div class="flex items-center justify-between gap-2 mb-3">
        <p class="eyebrow mb-0">Recent sessions</p>
        <div class="segment segment-sm shrink-0" role="group" aria-label="Session sort">
          <button type="button" class="segment-btn ${sort === "recent" ? "is-active accent" : ""}" data-action="fitness-history-sort" data-sort="recent">Recent</button>
          <button type="button" class="segment-btn ${sort === "oldest" ? "is-active accent" : ""}" data-action="fitness-history-sort" data-sort="oldest">Oldest</button>
        </div>
      </div>
      <div class="plan-row-stack">
      ${(focus === "sessions" ? listSource : sessions)
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
        .join("") || `<p class="text-sm py-3 text-center" style="color:var(--mute)">No sessions match this filter.</p>`}
      </div>
      ${focus === "sessions" ? "" : renderPager(page, totalPages, "fitness")}
    </section>
  `;
}

export function renderFitness(state, ui) {
  const settings = state.fitnessSettings || { preferredUnit: "lb" };
  const tab = ui.fitnessTab || "today";
  const hasCompleted = completedSessions(state.fitnessLog || []).length > 0;
  const showFitnessTour = !state.settings?.fitnessTourCompleted && !hasCompleted;

  const tabBar = `
    <div class="flex items-center justify-between gap-2">
      <div class="segment flex-1" role="tablist" aria-label="Fitness sections">
        ${FITNESS_TABS.map((t) => {
          const selected = tab === t.id;
          return `<button type="button" class="segment-btn ${selected ? "is-active accent" : ""}" id="fitness-tab-${t.id}" data-action="fitness-tab" data-tab="${t.id}" role="tab" aria-selected="${selected}" aria-controls="fitness-panel-${t.id}" tabindex="${selected ? "0" : "-1"}">${t.label}</button>`;
        }).join("")}
      </div>
      ${
        showFitnessTour
          ? `<button type="button" class="btn shrink-0 !min-h-10 !px-3 !text-xs" data-action="open-tips" data-track="fitness">${copy.fitness.quickTour}</button>`
          : ""
      }
    </div>
  `;

  const panel =
    tab === "history"
      ? `<div role="tabpanel" id="fitness-panel-history" aria-labelledby="fitness-tab-history">${renderHistoryPanel(state, settings, ui)}</div>`
      : `<div role="tabpanel" id="fitness-panel-today" aria-labelledby="fitness-tab-today">${renderTodayPanel(state, ui)}</div>`;
  const menu = renderExerciseMenu(ui.openExerciseMenu, state.fitnessSettings);

  return `
    <section class="fitness-screen space-y-3">
      ${tabBar}
      ${panel}
      ${menu}
    </section>
  `;
}

/** Patch open/collapsed classes without remounting the exercise list. */
export function patchFitnessExpandState(root, state, ui) {
  const list = root?.querySelector?.("[data-fitness-list]");
  if (!list) return false;
  const date = todayKey();
  const session = activeSessionForDate(state.fitnessLog || [], date);
  const exercises = session?.exercises || [];
  const firstIncomplete = exercises.find((ex) => {
    const sets = ex.sets || [];
    return !sets.length || sets.some((s) => !s.done);
  });
  const fallbackId = firstIncomplete?.id || exercises[0]?.id || null;
  list.querySelectorAll("[data-exercise-card]").forEach((card) => {
    const id = card.dataset.exerciseId;
    const open = isExerciseOpen(ui, id, fallbackId);
    card.classList.toggle("is-open", open);
    card.classList.toggle("is-collapsed", !open);
    const body = card.querySelector(".fitness-exercise-body");
    if (body) body.classList.toggle("is-open", open);
    const toggle = card.querySelector('[data-action="toggle-fitness-exercise"]');
    if (toggle) toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  return true;
}

/** Update Complete gate after a set-field commit without remounting inputs. */
export function patchFitnessSetCommit(root, state) {
  const date = todayKey();
  const session = activeSessionForDate(state.fitnessLog || [], date);
  if (!session) return false;
  const gate = canCompleteWorkout(session);
  const btn = root.querySelector("[data-complete-gate]");
  if (btn) {
    btn.disabled = !gate.ok;
    btn.title = gate.reason || "";
  }
  let help = root.querySelector("[data-complete-help]");
  const actions = root.querySelector(".fitness-session-actions");
  if (!gate.ok) {
    const reason = gate.reason || "Fill weight and reps on every set";
    if (help) help.textContent = reason;
    else if (actions) {
      help = document.createElement("p");
      help.className = "help-text text-center";
      help.dataset.completeHelp = "";
      help.textContent = reason;
      actions.insertAdjacentElement("afterend", help);
    }
  } else if (help) {
    help.remove();
  }
  return true;
}

export function patchAddExerciseResults(root, ui, settings) {
  const inner = root?.querySelector?.("[data-region='add-exercise-results']");
  if (!inner) return false;
  const sessionId = ui.fitnessAddSession || "";
  const query = ui.fitnessSearch || "";
  const muscle = ui.fitnessMuscle || "all";
  const listFilter = ui.fitnessListFilter || "all";
  const replacing = ui.replaceExercise;
  const available =
    ui.fitnessEquipmentFilter || settings?.equipmentAvailable || EQUIPMENT_OPTIONS.map((e) => e.id);
  const results = filterExercises(query, muscle, {
    equipment: available,
    blocked: settings?.blockedExercises || [],
    favorites: settings?.favoriteExercises || [],
    recent: settings?.recentExercises || [],
    listFilter,
  }).slice(0, 40);
  const pickAction = replacing ? "replace-pick-exercise" : "pick-exercise";
  inner.innerHTML = renderAddExerciseResults(results, settings, sessionId, pickAction, query, listFilter);
  return true;
}

/** Tick live session clock without full remount. */
export function patchSessionTimerClock(root, state) {
  const bar = root?.querySelector?.("[data-session-timer]");
  if (!bar) return false;
  const sessionId = bar.dataset.session;
  const session = (state.fitnessLog || []).find((s) => s.id === sessionId);
  if (!session) return false;
  const clock = bar.querySelector("[data-session-clock]");
  if (clock) clock.textContent = formatSessionClock(liveSessionElapsedMs(session, Date.now()));
  bar.dataset.running = session.timerStartedAt ? "1" : "0";
  return true;
}

function renderExercisePickRow(ex, settings, sessionId, pickAction) {
  const fav = isFavorite(settings, ex.name);
  const eq = (ex.equipment || []).join(" · ");
  const timed = ex.measurement === "time";
  const category = ex.category ? ` · ${ex.category === "calisthenics" ? "Calisthenics" : "Conditioning"}` : "";
  return `
    <div class="exercise-pick-row flex items-center gap-3">
      <button type="button" class="min-w-0 flex-1 text-left flex items-center gap-4" data-action="${pickAction}" data-session="${escapeHtml(sessionId)}" data-name="${escapeHtml(ex.name)}" data-muscle="${escapeHtml(ex.muscleGroup)}">
        ${renderMuscleThumb(ex.muscleGroup, "lg")}
        <span class="min-w-0">
          <p class="task-title !min-h-0">${escapeHtml(ex.name)}</p>
          <p class="task-meta">${escapeHtml(muscleLabel(ex.muscleGroup))}${timed ? ` · ${formatDurationSeconds(ex.defaultDuration || 30)}` : ""}${category}${eq ? ` · ${escapeHtml(eq)}` : ""}</p>
        </span>
      </button>
      <button type="button" class="icon-btn shrink-0 ${fav ? "is-fav" : ""}" data-action="toggle-favorite-exercise" data-name="${escapeHtml(ex.name)}" aria-label="${fav ? "Unfavorite" : "Favorite"}" aria-pressed="${fav}">
        ${icon("star", "h-4 w-4")}
      </button>
    </div>`;
}

function renderExerciseSection(title, items, settings, sessionId, pickAction) {
  if (!items.length) return "";
  return `
    <section class="exercise-pick-section">
      <p class="exercise-section-title">${escapeHtml(title)}</p>
      <div class="space-y-2">${items.map((ex) => renderExercisePickRow(ex, settings, sessionId, pickAction)).join("")}</div>
    </section>`;
}

function renderAddExerciseResults(results, settings, sessionId, pickAction, query = "", listFilter = "all") {
  if (!results.length) {
    const q = String(query || "").trim();
    return q
      ? `<section class="exercise-empty-card">
          <p class="task-title !min-h-0">No match for “${escapeHtml(q)}”</p>
          <p class="help-text mt-1">Add it once and it stays in your session.</p>
          <button type="button" class="btn btn-primary w-full mt-3" data-action="add-search-custom-exercise" data-session="${escapeHtml(sessionId)}" data-name="${escapeHtml(q)}">Add “${escapeHtml(q)}”</button>
        </section>`
      : `<p class="text-sm py-4 text-center" style="color:var(--mute)">No matches.</p>`;
  }
  if (!query && listFilter === "all") {
    const byName = new Map(results.map((ex) => [ex.name.toLowerCase(), ex]));
    const used = new Set();
    const takeNames = (names = [], limit = 5) =>
      (names || [])
        .map((name) => byName.get(String(name).toLowerCase()))
        .filter(Boolean)
        .filter((ex) => {
          const key = ex.name.toLowerCase();
          if (used.has(key)) return false;
          used.add(key);
          return true;
        })
        .slice(0, limit);
    const recent = takeNames(settings?.recentExercises || [], 5);
    const favorites = takeNames(settings?.favoriteExercises || [], 5);
    const rest = results.filter((ex) => !used.has(ex.name.toLowerCase()));
    return [
      renderExerciseSection("Recent", recent, settings, sessionId, pickAction),
      renderExerciseSection("Favorites", favorites, settings, sessionId, pickAction),
      renderExerciseSection("All exercises", rest, settings, sessionId, pickAction),
    ].join("");
  }
  return results.map((ex) => renderExercisePickRow(ex, settings, sessionId, pickAction)).join("");
}

export function renderAddExerciseModal(ui, settings) {
  const sessionId = ui.fitnessAddSession || "";
  const query = ui.fitnessSearch || "";
  const muscle = ui.fitnessMuscle || "all";
  const listFilter = ui.fitnessListFilter || "all";
  const replacing = ui.replaceExercise;
  const available =
    ui.fitnessEquipmentFilter || settings?.equipmentAvailable || EQUIPMENT_OPTIONS.map((e) => e.id);
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
    <div class="modal-backdrop modal-enter">
      <div class="modal-sheet modal-scroll-body sheet-enter fitness-modal add-exercise-modal" role="dialog" aria-modal="true" aria-label="${title}" data-stop>
        <div class="flex items-center justify-between gap-3 shrink-0">
          <div class="min-w-0">
            <h2 class="display text-3xl">${title}</h2>
            ${replacing ? `<p class="help-text mt-1">Only this exercise changes. Your other logged work stays.</p>` : ""}
          </div>
          <button type="button" class="btn !min-h-11 !px-3" data-action="close-modal">Cancel</button>
        </div>
        <form class="mt-4 shrink-0" data-action="search-exercise">
          <input type="hidden" name="sessionId" value="${escapeHtml(sessionId)}" />
          <input class="input !text-base" id="add-exercise-search" name="query" placeholder="Search exercises..." value="${escapeHtml(query)}" autocomplete="off" enterkeyhint="search" />
        </form>
        <div class="segment mt-4 shrink-0" role="group" aria-label="List filter">
          ${["all", "favorites", "recent"]
            .map(
              (id) =>
                `<button type="button" class="segment-btn ${listFilter === id ? "is-active accent" : ""}" data-action="fitness-list-filter" data-filter="${id}">${id === "all" ? "All" : id === "favorites" ? "Favorites" : "Recent"}</button>`
            )
            .join("")}
        </div>
        <div class="equipment-rail scroll-touch mt-4 shrink-0" role="group" aria-label="Equipment filter">
          ${EQUIPMENT_OPTIONS.map((opt) => {
            const on = available.includes(opt.id);
            return `<button type="button" class="chip shrink-0 ${on ? "chip-build" : ""}" data-action="toggle-picker-equipment" data-id="${opt.id}" aria-pressed="${on}">${escapeHtml(opt.label)}</button>`;
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
        <div class="modal-scroll-inner scroll-touch mt-5 space-y-3" data-region="add-exercise-results">
          ${renderAddExerciseResults(results, settings, sessionId, pickAction, query, listFilter)}
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
      <div class="modal-backdrop">
        <div class="modal-sheet" role="dialog" aria-modal="true" data-stop>
          <p class="text-sm" style="color:var(--mute)">Session not found.</p>
          <button type="button" class="btn mt-4 w-full" data-action="close-modal">Close</button>
        </div>
      </div>`;
  }

  const vol = sessionVolume(session, unit);
  const exercises = session.exercises || [];

  return `
    <div class="modal-backdrop">
      <div class="modal-sheet modal-scroll-body" role="dialog" aria-modal="true" aria-label="Workout detail" data-stop>
        <div class="flex items-center justify-between gap-3 shrink-0">
          <h2 class="display text-3xl">${formatDisplayDate(session.date)}</h2>
          <button type="button" class="btn !min-h-11 !px-3" data-action="close-modal">Close</button>
        </div>
        <p class="mt-2 text-sm shrink-0" style="color:var(--mute)">${exercises.length} exercise${exercises.length === 1 ? "" : "s"} · ${formatVolume(vol)} ${escapeHtml(unit)} volume</p>
        <div class="modal-scroll-inner scroll-touch mt-4 workout-detail-list">
          ${exercises
            .map((ex) => {
              const hist = exerciseVolumeHistory(state.fitnessLog || [], ex.name, 5);
              const path = sparklinePath(hist.map((h) => h.volume), 120, 24);
              return `
            <article class="workout-detail-card">
              <p class="task-title !min-h-0 !text-[0.95rem]">${escapeHtml(ex.name)}</p>
              <p class="task-meta">${escapeHtml(muscleLabel(ex.muscleGroup))}</p>
              ${
                path
                  ? `<svg class="sparkline sparkline-sm mt-1.5" viewBox="0 0 120 24" aria-label="Volume trend">
                      <path d="${path}" fill="none" stroke="var(--build)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <p class="text-[10px] mt-0.5" style="color:var(--mute)">Last ${hist.length} session${hist.length === 1 ? "" : "s"}</p>`
                  : ""
              }
              <ul class="mt-1.5 space-y-0.5 text-xs" style="color:var(--mute)">
                ${(ex.sets || [])
                  .map((set) => {
                    if (set.duration != null) {
                      return `<li>${set.done ? "✓ " : ""}${formatDurationSeconds(set.duration)}${Number(set.weight) > 0 ? ` · ${Number(set.weight)} ${escapeHtml(set.unit || unit)}` : ""}</li>`;
                    }
                    const bw = isBodyweightExercise({
                      name: ex.name,
                      equipment: findExerciseCatalog(ex.name)?.equipment || [],
                    });
                    return bw
                      ? `<li>${set.done ? "✓ " : ""}${Number(set.reps) || 0} reps</li>`
                      : `<li>${set.done ? "✓ " : ""}${Number(set.weight) || 0} ${escapeHtml(set.unit || unit)} × ${Number(set.reps) || 0}</li>`;
                  })
                  .join("")}
              </ul>
            </article>`;
            })
            .join("")}
        </div>
        <div class="shrink-0 pt-4 space-y-2 border-t mt-4" style="border-color:var(--rail)">
          <button type="button" class="btn btn-primary w-full gap-2" data-action="share-progress" data-scope="fitness">${icon("proof", "h-5 w-5")} Share this session</button>
          <button type="button" class="btn btn-danger w-full" data-action="delete-workout" data-session="${escapeHtml(session.id)}">Delete session</button>
        </div>
      </div>
    </div>
  `;
}
